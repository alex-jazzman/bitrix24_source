import type { CallScheme, RoomType } from './connection-descriptor';
import type { TransportVariators } from './variators';

/**
 * Input of connection acquisition: what kind of connection is needed. It is the pass-through
 * variators plus the few fields acquisition itself acts on - `mustCreate` decides create-vs-join on
 * the wire, `parentUuid` names the call an escalation comes from, `isVideo` travels to the server as
 * the intent of the caller.
 *
 * `scheme` and `roomType` are narrowed to the vocabularies the descriptor is discriminated by; that
 * is a type of the value, not knowledge about the call: the transport still branches on none of these
 * fields and forwards them as payload.
 *
 * The variators the wire has no place for stay out of the request body rather than being reshaped:
 * `usersLimit` and `userRoles` are encoded by the server into the call token, so acquisition never
 * sends them.
 */
export type ConnectionRequest = TransportVariators & {
	scheme: CallScheme,
	roomType: RoomType,
	/** Call an escalation comes from, when this connection continues an existing one. */
	parentUuid?: string,
	isVideo: boolean,
	/** Whether a room must be created; the transport passes it on and reads nothing into it. */
	mustCreate: boolean,
};
