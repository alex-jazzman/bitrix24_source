import type { ParticipantId } from '../domain/participant';
import type { Result } from '../error/result';
import type { TransportError } from '../error/transport-error';
import type { PullPort, PullSignal } from '../port/pull-port';
import type { RestActionName, RestPort } from '../port/rest-port';
import type { RetransmitArgs, SignalingGateway } from './signaling-gateway';
import type { DeclineArgs, InviteArgs } from './signaling-protocol';
import { FINISH_ACTION, SignalingRestChannel, toWireFlag } from './signaling-wire';

/** Actions of the classic path: one controller serves the whole presence lifecycle of a call. */
const ACTIONS: { [intent: string]: RestActionName } = {
	invite: 'call.CallManager.invite',
	answer: 'call.CallManager.answer',
	decline: 'call.CallManager.decline',
	hangup: 'call.CallManager.hangup',
	ping: 'call.CallManager.ping',
};

/** Signals of the classic path, bare: the pull module and the prefix of the channel live in the port. */
const SIGNALS: { [intent: string]: PullSignal } = {
	answer: 'answer',
	hangup: 'hangup',
	ping: 'ping',
};

/** A hangup has to outlive the disconnect that caused it, so the channel keeps it for an hour. */
const HANGUP_EXPIRY_SECONDS = 3600;

/** A keepalive is worth nothing once the next one is due. */
const PING_EXPIRY_SECONDS = 5;

/** Whether the invited side is shown the incoming call, when the caller states nothing about it. */
const VISIBLE_BY_DEFAULT = true;

export type ClassicSignalingContext = {
	/** Numeric id of the call on the server - what every action of this schema is addressed by. */
	serverCallId: number,
	/** Instance sending on behalf of the user; the receiving side tells its own echo apart by it. */
	callInstanceId: string,
};

export type ClassicSignalingGatewayOptions = {
	rest: RestPort,
	pull: PullPort,
	context: ClassicSignalingContext,
	requestIdFactory: () => string,
};

/**
 * `SignalingGateway` of the classic schema - the path with a genuinely two-way pull channel, so every
 * intent that has a signal of its own can travel either way and the caller picks by capability.
 *
 * A published message carries no recipient list of its own: the port is addressed and already knows
 * who it goes to, so repeating them in the payload would build half an envelope here.
 */
export class ClassicSignalingGateway implements SignalingGateway
{
	#pull: PullPort;
	#rest: SignalingRestChannel;

	constructor(options: ClassicSignalingGatewayOptions)
	{
		this.#pull = options.pull;
		this.#rest = new SignalingRestChannel({
			rest: options.rest,
			callFields: { callId: options.context.serverCallId },
			callInstanceId: options.context.callInstanceId,
			requestIdFactory: options.requestIdFactory,
		});
	}

	sendInvite(invite: InviteArgs): Promise<Result<void, TransportError>>
	{
		return this.#rest.send(ACTIONS.invite, {
			userIds: invite.recipients,
			video: toWireFlag(invite.isVideo),
			show: toWireFlag(invite.isVisible ?? VISIBLE_BY_DEFAULT),
			repeated: toWireFlag(invite.isRepeated === true),
		});
	}

	/** No lifetime named: an answer nobody is waiting for any more is of no use, so the default stands. */
	sendAnswerViaPull(recipients: ParticipantId[]): void
	{
		this.#pull.publish(recipients, SIGNALS.answer, {});
	}

	sendAnswerViaRest(): Promise<Result<void, TransportError>>
	{
		return this.#rest.send(ACTIONS.answer);
	}

	/** The code travels only when the caller named one - its default belongs to the server. */
	sendDecline(decline: DeclineArgs): Promise<Result<void, TransportError>>
	{
		return this.#rest.send(ACTIONS.decline, decline.code === undefined ? {} : { code: decline.code });
	}

	sendHangupViaPull(recipients: ParticipantId[]): void
	{
		this.#pull.publish(recipients, SIGNALS.hangup, {}, HANGUP_EXPIRY_SECONDS);
	}

	sendHangupViaRest(hangup: RetransmitArgs): Promise<Result<void, TransportError>>
	{
		return this.#rest.send(ACTIONS.hangup, { retransmit: hangup.retransmit });
	}

	sendPingToPeersViaPull(recipients: ParticipantId[]): void
	{
		this.#pull.publish(recipients, SIGNALS.ping, {}, PING_EXPIRY_SECONDS);
	}

	sendPingToBackendViaRest(ping: RetransmitArgs): Promise<Result<void, TransportError>>
	{
		return this.#rest.send(ACTIONS.ping, { retransmit: ping.retransmit });
	}

	sendFinish(): Promise<Result<void, TransportError>>
	{
		return this.#rest.send(FINISH_ACTION);
	}
}
