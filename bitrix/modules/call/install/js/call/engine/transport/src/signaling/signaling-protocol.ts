import type { ParticipantId } from '../domain/participant';
import type { Result } from '../error/result';
import type { TransportError } from '../error/transport-error';

/**
 * What an incoming invite carries beside its sender. Opaque here on purpose: presence tells the layer
 * above that a call is offered, and what the offer says - video, the entity behind it, the roster -
 * is read there, by the layer that owns those meanings.
 */
export type InvitePayload = {
	[field: string]: unknown,
};

/**
 * Incoming presence events, transport -> consumer. Injected into the constructor of the protocol, so
 * neither an event string nor a global bus takes part: a consumer implements this interface and gets
 * typed calls.
 *
 * Every method names the side the event came from, already resolved into the canonical participant
 * id. A batch command of the channel is unfolded before it reaches here - one batch arrives as a
 * series of single calls - so a consumer sees one shape whatever the wire sent.
 */
export interface SignalingListener
{
	onInvite(from: ParticipantId, payload: InvitePayload): void;

	onAnswer(from: ParticipantId): void;

	/**
	 * Terminal: the side refused the call. The code is the one the wire carried, and is absent when it
	 * carried none - the transport invents no reason of its own.
	 */
	onDecline(from: ParticipantId, code?: number): void;

	/** Terminal and told apart from a decline: the side is already busy in another call. */
	onBusy(from: ParticipantId): void;

	onHangup(from: ParticipantId): void;

	/** Keepalive of a peer; the echo of this instance is suppressed before it reaches here. */
	onPing(from: ParticipantId): void;

	/** The side asks for the answer again; who resends it is decided above the channel, not here. */
	onRepeatAnswer(from: ParticipantId): void;

	/**
	 * The invite of that side timed out - a signal and nothing more: the transport starts no timer,
	 * changes no participant state and takes no lifecycle decision on it.
	 */
	onInviteTimeout(from: ParticipantId): void;

	onFinish(): void;
}

/** What an invite offers, in the vocabulary of presence; how it is spelled on the wire is elsewhere. */
export type InviteArgs = {
	recipients: ParticipantId[],
	isVideo: boolean,
	/** A repeat of an invite already sent, so the receiving side does not take it for a new call. */
	isRepeated?: boolean,
	/** Whether the invited side is shown the incoming call; a silent invite reaches the session only. */
	isVisible?: boolean,
};

export type DeclineArgs = {
	/**
	 * Reason of the refusal, in the vocabulary of the server. Absent means the schema decides, and the
	 * two decide differently: the classic action has a default of its own on the server and keeps it,
	 * while the jwt one broadcasts the code of the request as it stands, so a code left out there
	 * travels as a zero the other sides cannot tell from an ordinary hangup. That is why the jwt
	 * gateway names the reason itself and the classic one does not - one path would lose the refusal.
	 */
	code?: number,
};

/**
 * Presence lifecycle of a call - the intents one side states about itself, and nothing of the media
 * plane. Schema-agnostic by contract: it owns the lifecycle and the choice of channel, while every
 * name on the wire belongs to the `SignalingGateway` injected into it.
 *
 * A one-shot intent answers with a `Result`, so a caller reads a refusal in the type. `ping` is the
 * one exception: a periodic keepalive is best-effort, answers `void` and stays outside the result
 * model - a single failed ping is swallowed and logged, and what a series of them means for the
 * connection is an internal threshold rather than the outcome of a call.
 */
export interface SignalingProtocol
{
	invite(invite: InviteArgs): Promise<Result<void, TransportError>>;

	/** The recipients are who is told; the channel that carries it is addressed, the server one is not. */
	answer(recipients: ParticipantId[]): Promise<Result<void, TransportError>>;

	decline(decline?: DeclineArgs): Promise<Result<void, TransportError>>;

	hangup(recipients: ParticipantId[]): Promise<Result<void, TransportError>>;

	ping(recipients: ParticipantId[]): void;

	finish(): Promise<Result<void, TransportError>>;
}
