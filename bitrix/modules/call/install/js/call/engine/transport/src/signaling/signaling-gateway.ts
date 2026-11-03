import type { ParticipantId } from '../domain/participant';
import type { Result } from '../error/result';
import type { TransportError } from '../error/transport-error';
import type { DeclineArgs, InviteArgs } from './signaling-protocol';

/**
 * The wire parameter that says whether the server has to carry the message to the peers itself. It is
 * a value of the channel policy, not of presence: the caller sets it from what the pull channel can
 * do right now, which is why it enters the gateway from outside instead of being decided here.
 */
export type RetransmitArgs = {
	retransmit: boolean,
};

/**
 * Encoding and sending of one presence intent under one call schema. The single owner of the wire
 * format: action names, signal names, the shape of a payload and the lifetime of a published message
 * live in an implementation of this interface and reach no caller.
 *
 * The methods are split by channel where a schema has two of them, so which channels an intent takes
 * stays with the protocol - which reads the publishing capability and knows nothing about the schema
 * - while which channels an intent has at all stays here. An intent a schema has no wire for is a
 * documented no-op that sends nothing and answers success: an absent wire is not a failure of the
 * lifecycle.
 *
 * Publishing answers `void` like the channel it goes through: it is best-effort by contract and the
 * caller has already gated it by capability, so there is no outcome to branch on. An action answers a
 * `Result`, including the keepalive - making the keepalive best-effort is the business of its caller,
 * not of the sending.
 */
export interface SignalingGateway
{
	/**
	 * One channel in both schemas: the server sends the invite out to the invited side as a side
	 * effect of the action, so there is no addressed signal to publish.
	 */
	sendInvite(invite: InviteArgs): Promise<Result<void, TransportError>>;

	sendAnswerViaPull(recipients: ParticipantId[]): void;

	sendAnswerViaRest(): Promise<Result<void, TransportError>>;

	/** Outgoing only: a refusal comes back as a code inside a hangup, never as a decline of its own. */
	sendDecline(decline: DeclineArgs): Promise<Result<void, TransportError>>;

	sendHangupViaPull(recipients: ParticipantId[]): void;

	sendHangupViaRest(hangup: RetransmitArgs): Promise<Result<void, TransportError>>;

	sendPingToPeersViaPull(recipients: ParticipantId[]): void;

	sendPingToBackendViaRest(ping: RetransmitArgs): Promise<Result<void, TransportError>>;

	sendFinish(): Promise<Result<void, TransportError>>;
}
