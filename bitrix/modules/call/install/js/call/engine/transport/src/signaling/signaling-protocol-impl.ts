import type { ParticipantId } from '../domain/participant';
import { err, isErr } from '../error/result';
import type { Result } from '../error/result';
import type { TransportError } from '../error/transport-error';
import type { ClockPort } from '../port/clock-port';
import type { LogDetails, LoggerPort } from '../port/logger-port';
import type { PullPort } from '../port/pull-port';
import type { SignalingGateway } from './signaling-gateway';
import type {
	DeclineArgs,
	InviteArgs,
	InvitePayload,
	SignalingListener,
	SignalingProtocol,
} from './signaling-protocol';

/** How often the peers hear that this side is still there; the cadence of the legacy engine. */
const PEER_PING_INTERVAL_MS = 5000;

/**
 * The server hears it far less often than the peers do - it counts a side as present for over a
 * minute, so a round every five seconds would be traffic with no reader.
 */
const BACKEND_PING_INTERVAL_MS = 25000;

/** Which best-effort send a swallowed failure came from. It reaches the log and goes no further. */
const PEER_ARM = 'peers';
const BACKEND_ARM = 'backend';
const ANSWER_ARM = 'answer';
const HANGUP_ARM = 'hangup';

const KEEPALIVE_FAILED = 'signaling: a keepalive round failed';

/** A publish that broke mid-intent; the action of the same intent goes on regardless. */
const PUBLISH_FAILED = 'signaling: publishing an intent to the peers failed';

/** Stands in for a failure that carries no discriminant at all: a value thrown by something else. */
const UNTYPED_FAILURE = 'untyped';

/**
 * Codes the protocol itself puts on a failure, as opposed to the codes a server answers with: an
 * intent stated after the release is refused because the call it would speak for is over, and nothing
 * of it reached the wire.
 */
export const SignalingContractCode: {
	readonly Disposed: 'signaling.disposed',
} = Object.freeze({
	Disposed: 'signaling.disposed',
});

export type SignalingContractCode = typeof SignalingContractCode[keyof typeof SignalingContractCode];

/**
 * The answer of an intent that reached a released protocol. Nothing goes to the wire for it, and the
 * refusal is the intent's own rather than one of the server: a caller reads it in the type instead of
 * having to tell a send that never happened from one that failed.
 */
function refuseDisposed(): Promise<Result<void, TransportError>>
{
	const failure: TransportError = { kind: 'contract', code: SignalingContractCode.Disposed };

	return Promise.resolve(err(failure));
}

/**
 * What a swallowed failure is written down as: its discriminant, and the code of the server for a
 * contract failure. The failure itself stays out of the log - it may carry the prose of the server or
 * a whole answer of the client, and neither belongs in a record of a swallowed send.
 */
function describeFailure(cause: unknown): LogDetails
{
	if (typeof cause !== 'object' || cause === null || !('kind' in cause))
	{
		return { kind: UNTYPED_FAILURE };
	}

	const error = cause as TransportError;

	return error.kind === 'contract' ? { kind: error.kind, code: error.code } : { kind: error.kind };
}

export type SignalingProtocolImplOptions = {
	pull: PullPort,
	clock: ClockPort,
	gateway: SignalingGateway,
	/** Incoming presence, transport -> consumer: what this class relays and never produces itself. */
	listener: SignalingListener,
	logger: LoggerPort,
};

/**
 * `SignalingProtocol` over the two channels of presence and the single owner of which of them an
 * intent takes. That is settled before a send and never after it - a publish reports no delivery, so
 * there is nothing to fall back from - and the encoding belongs to the injected `SignalingGateway`,
 * which is why no name of a schema appears here.
 *
 * An intent the schema serves by an action alone goes to the server and nowhere else. The two intents
 * that carry the presence of this side - answering and hanging up - take both channels at once: the
 * peers hear them directly wherever this client may publish, and the server hears them in any case,
 * because it is the server that moves the participant and keeps the roster - a channel that breaks
 * mid-publish is written down and swallowed rather than allowed to take the action down with it.
 * Publishing is gated by whether the server allows this client to publish at all; `retransmit` is read
 * from the second capability, whether publishing works right now, so the server is asked to carry the
 * message exactly where the channel did not. The keepalive takes two arms on two timers, because the
 * peers and the server ask about presence at very different rates.
 *
 * The keepalive is the one thing this class owns beyond a send: `ping` arms it, the terminal intents
 * and an incoming finish stop it, and `dispose` releases it whatever ended the call.
 */
export class SignalingProtocolImpl implements SignalingProtocol, SignalingListener
{
	#pull: PullPort;
	#clock: ClockPort;
	#gateway: SignalingGateway;
	#listener: SignalingListener;
	#logger: LoggerPort;
	#keepaliveRecipients: ParticipantId[] = [];
	#stopPeerPing: (() => void) | undefined = undefined;
	#stopBackendPing: (() => void) | undefined = undefined;
	#disposed: boolean = false;

	constructor(options: SignalingProtocolImplOptions)
	{
		this.#pull = options.pull;
		this.#clock = options.clock;
		this.#gateway = options.gateway;
		this.#listener = options.listener;
		this.#logger = options.logger;
	}

	/** One channel in both schemas: the server carries the invite out, so nothing is published. */
	invite(invite: InviteArgs): Promise<Result<void, TransportError>>
	{
		if (this.#disposed)
		{
			return refuseDisposed();
		}

		return this.#gateway.sendInvite(invite);
	}

	/**
	 * Both channels, and not one or the other: the peers learn of the answer at once, while the server
	 * hears of it in any case, because only the action makes this side ready in the call. The outcome
	 * of the intent is the outcome of the action - a publish reports no delivery and would name a
	 * refusal nobody made.
	 *
	 * A channel primitive that breaks mid-publish is written down and stops there: the publish is
	 * best-effort by the contract of the port, and letting the break out would cost the action that
	 * alone makes this side ready. `async` still, so that a break of the action itself reaches the
	 * caller as a rejection of the declared promise rather than past it.
	 */
	async answer(recipients: ParticipantId[]): Promise<Result<void, TransportError>>
	{
		if (this.#disposed)
		{
			return refuseDisposed();
		}

		if (this.#pull.isPublishingSupported())
		{
			try
			{
				this.#gateway.sendAnswerViaPull(recipients);
			}
			catch (error)
			{
				this.#swallow(PUBLISH_FAILED, ANSWER_ARM, error);
			}
		}

		return this.#gateway.sendAnswerViaRest();
	}

	/**
	 * One channel in both schemas: a refusal is an action, and no peer is told it directly. Terminal
	 * like a hangup, so the keepalive of this side stops with it.
	 */
	decline(decline: DeclineArgs = {}): Promise<Result<void, TransportError>>
	{
		if (this.#disposed)
		{
			return refuseDisposed();
		}

		this.#stopKeepalive();

		return this.#gateway.sendDecline(decline);
	}

	/**
	 * Both channels, and not one or the other: the peers learn of the departure at once, while the
	 * server hears of it in any case because it keeps the roster. `retransmit` is read from whether
	 * publishing works right now rather than from the gate of the publish, so a channel that is
	 * allowed but down leaves the server carrying the message instead of nobody carrying it.
	 *
	 * A broken publish is swallowed on the same terms as the answer, and `async` on the same terms too:
	 * a break of the action reaches the caller as a rejection of the declared promise instead of past
	 * it.
	 */
	async hangup(recipients: ParticipantId[]): Promise<Result<void, TransportError>>
	{
		if (this.#disposed)
		{
			return refuseDisposed();
		}

		this.#stopKeepalive();

		if (this.#pull.isPublishingSupported())
		{
			try
			{
				this.#gateway.sendHangupViaPull(recipients);
			}
			catch (error)
			{
				this.#swallow(PUBLISH_FAILED, HANGUP_ARM, error);
			}
		}

		return this.#gateway.sendHangupViaRest({ retransmit: !this.#pull.isPublishingEnabled() });
	}

	/**
	 * Keeps this side present until the call ends. Arming is idempotent: calling it again re-targets a
	 * running keepalive instead of arming a second pair of timers, so a changing roster does not change
	 * the rate. Nothing is sent by the call itself - the first round of each arm lands one period later,
	 * as it does in the engine this behaviour comes from.
	 */
	ping(recipients: ParticipantId[]): void
	{
		if (this.#disposed)
		{
			return;
		}

		this.#keepaliveRecipients = recipients;

		if (this.#stopPeerPing === undefined)
		{
			this.#stopPeerPing = this.#clock.scheduleRepeating(() => this.#pingPeers(), PEER_PING_INTERVAL_MS);
		}

		if (this.#stopBackendPing === undefined)
		{
			this.#stopBackendPing = this.#clock.scheduleRepeating(
				() => this.#pingBackend(),
				BACKEND_PING_INTERVAL_MS,
			);
		}
	}

	finish(): Promise<Result<void, TransportError>>
	{
		if (this.#disposed)
		{
			return refuseDisposed();
		}

		this.#stopKeepalive();

		return this.#gateway.sendFinish();
	}

	/**
	 * Idempotent, and it takes no intent to the wire: what is released here is only what was armed. It is
	 * terminal in both directions - incoming presence that arrives afterwards reaches no consumer, so a
	 * late callback of the channel cannot report presence of a call that is already gone, and an intent
	 * stated afterwards reaches neither channel: it is refused where it stands, as a contract failure of
	 * the transport, instead of stating the presence of a side that has left.
	 */
	dispose(): void
	{
		if (this.#disposed)
		{
			return;
		}

		this.#disposed = true;
		this.#stopKeepalive();
	}

	onInvite(from: ParticipantId, payload: InvitePayload): void
	{
		this.#relay((listener) => listener.onInvite(from, payload));
	}

	onAnswer(from: ParticipantId): void
	{
		this.#relay((listener) => listener.onAnswer(from));
	}

	onDecline(from: ParticipantId, code?: number): void
	{
		this.#relay((listener) => listener.onDecline(from, code));
	}

	onBusy(from: ParticipantId): void
	{
		this.#relay((listener) => listener.onBusy(from));
	}

	onHangup(from: ParticipantId): void
	{
		this.#relay((listener) => listener.onHangup(from));
	}

	onPing(from: ParticipantId): void
	{
		this.#relay((listener) => listener.onPing(from));
	}

	onRepeatAnswer(from: ParticipantId): void
	{
		this.#relay((listener) => listener.onRepeatAnswer(from));
	}

	onInviteTimeout(from: ParticipantId): void
	{
		this.#relay((listener) => listener.onInviteTimeout(from));
	}

	/** The one incoming event this class acts on: the call is over, so its keepalive stops with it. */
	onFinish(): void
	{
		this.#stopKeepalive();
		this.#relay((listener) => listener.onFinish());
	}

	/** Gated by publishing being available right now, and read again on every round. */
	#pingPeers(): void
	{
		if (!this.#pull.isPublishingEnabled())
		{
			return;
		}

		try
		{
			this.#gateway.sendPingToPeersViaPull(this.#keepaliveRecipients);
		}
		catch (error)
		{
			this.#swallow(KEEPALIVE_FAILED, PEER_ARM, error);
		}
	}

	/** Always sent: the server is told either way, and `retransmit` says whether the peers were. */
	#pingBackend(): void
	{
		try
		{
			this.#gateway.sendPingToBackendViaRest({ retransmit: !this.#pull.isPublishingEnabled() }).then(
				(outcome) => {
					if (isErr(outcome))
					{
						this.#swallow(KEEPALIVE_FAILED, BACKEND_ARM, outcome.error);
					}
				},
				(reason: unknown) => this.#swallow(KEEPALIVE_FAILED, BACKEND_ARM, reason),
			);
		}
		catch (error)
		{
			this.#swallow(KEEPALIVE_FAILED, BACKEND_ARM, error);
		}
	}

	/**
	 * A failed best-effort send is written down and stops here: neither a keepalive round nor a publish
	 * of an intent reports delivery, so a caller has nothing to read, and what a series of failures
	 * means for the connection is settled above.
	 */
	#swallow(message: string, arm: string, cause: unknown): void
	{
		this.#logger.warn(message, { arm, ...describeFailure(cause) });
	}

	/**
	 * Incoming presence on its way to the consumer, and the one place a disposed protocol stops it: after
	 * the release there is nobody left to tell about the presence of a call that has ended.
	 */
	#relay(deliver: (listener: SignalingListener) => void): void
	{
		if (this.#disposed)
		{
			return;
		}

		deliver(this.#listener);
	}

	#stopKeepalive(): void
	{
		this.#stopPeerPing?.();
		this.#stopPeerPing = undefined;

		this.#stopBackendPing?.();
		this.#stopBackendPing = undefined;
	}
}
