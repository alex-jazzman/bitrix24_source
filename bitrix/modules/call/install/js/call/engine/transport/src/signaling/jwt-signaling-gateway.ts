import type { Result } from '../error/result';
import type { TransportError } from '../error/transport-error';
import type { RestActionName, RestPort } from '../port/rest-port';
import type { SignalingGateway } from './signaling-gateway';
import type { DeclineArgs, InviteArgs } from './signaling-protocol';
import { FINISH_ACTION, nothingToSend, SignalingRestChannel, toWireFlag } from './signaling-wire';
import { DECLINE_CODE } from './wire-codes';

/** The whole outgoing presence vocabulary of the jwt path; everything else is finished or has no wire. */
const ACTIONS: { [intent: string]: RestActionName } = {
	invite: 'call.Call.invite',
	decline: 'call.Call.decline',
};

/** Whether the invited side is shown the incoming call, when the caller states nothing about it. */
const VISIBLE_BY_DEFAULT = true;

export type JwtSignalingContext = {
	/** Uuid of the call - what the actions of this schema address instead of a numeric id. */
	callUuid: string,
	/** Instance sending on behalf of the user; a second device of the same user is told apart by it. */
	callInstanceId: string,
};

export type JwtSignalingGatewayOptions = {
	rest: RestPort,
	context: JwtSignalingContext,
	requestIdFactory: () => string,
};

/**
 * `SignalingGateway` of the jwt schema. Pull-less by construction, and not by a flag it could be
 * asked about: here the channel is a server-to-client broadcast only, the client publishes nothing on
 * it, and a port it never uses would be a dependency held to be ignored.
 *
 * Three intents have a wire - inviting, refusing and finishing - and each of the rest is a no-op with
 * a reason: joining the media server is the answer, leaving it is the hangup, and the keepalive of
 * presence is the connection to it. They send nothing and answer success, so the same schema-agnostic
 * lifecycle runs over both gateways without asking which one it holds.
 */
export class JwtSignalingGateway implements SignalingGateway
{
	#rest: SignalingRestChannel;

	constructor(options: JwtSignalingGatewayOptions)
	{
		this.#rest = new SignalingRestChannel({
			rest: options.rest,
			callFields: { callUuid: options.context.callUuid },
			callInstanceId: options.context.callInstanceId,
			requestIdFactory: options.requestIdFactory,
		});
	}

	sendInvite(invite: InviteArgs): Promise<Result<void, TransportError>>
	{
		return this.#rest.send(ACTIONS.invite, {
			users: invite.recipients,
			video: toWireFlag(invite.isVideo),
			show: toWireFlag(invite.isVisible ?? VISIBLE_BY_DEFAULT),
			repeated: toWireFlag(invite.isRepeated === true),
		});
	}

	/** No-op: this schema publishes nothing on the channel at all. */
	sendAnswerViaPull(): void
	{
	}

	/** No-op: joining the media server is what answering means here, and it is not a presence action. */
	sendAnswerViaRest(): Promise<Result<void, TransportError>>
	{
		return nothingToSend();
	}

	/**
	 * The reason always travels, unlike on the classic path: the action of this schema broadcasts the
	 * code of the request as it stands, and a request that carried none is broadcast as a zero the other
	 * sides cannot tell from an ordinary hangup. So a caller who names no reason has one named here,
	 * where a refusal would otherwise stop being a refusal on the way to the participants.
	 */
	sendDecline(decline: DeclineArgs): Promise<Result<void, TransportError>>
	{
		return this.#rest.send(ACTIONS.decline, { code: decline.code ?? DECLINE_CODE });
	}

	/** No-op: this schema publishes nothing on the channel at all. */
	sendHangupViaPull(): void
	{
	}

	/** No-op: leaving the media server is what hanging up means here - it lives in the media plane. */
	sendHangupViaRest(): Promise<Result<void, TransportError>>
	{
		return nothingToSend();
	}

	/** No-op: this schema publishes nothing on the channel at all. */
	sendPingToPeersViaPull(): void
	{
	}

	/** No-op: presence is kept alive by the connection to the media server, not by an action. */
	sendPingToBackendViaRest(): Promise<Result<void, TransportError>>
	{
		return nothingToSend();
	}

	sendFinish(): Promise<Result<void, TransportError>>
	{
		return this.#rest.send(FINISH_ACTION);
	}
}
