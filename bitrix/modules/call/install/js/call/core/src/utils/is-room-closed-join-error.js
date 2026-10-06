import { JoinRequestFailedCodes } from '../sdk/const';

/**
 * True only when a join response proves the room is already closed: a
 * mustCreate=false join-by-uuid answered with RoomNotFound / CanNotCreateRoom.
 * Transport/ambiguous codes are excluded on purpose — under overload the server
 * returns HTML-5xx (UnexpectedResponse / FailedRequest / ...), which may be
 * transient and must NOT be reported to the user as "call finished".
 *
 * @param {{ mustCreate: boolean, callUuid: ?string, errorCode: * }} params
 * @returns {boolean}
 */
export function isRoomClosedJoinError({ mustCreate, callUuid, errorCode })
{
	return (
		mustCreate === false
		&& Boolean(callUuid)
		&& (
			errorCode === JoinRequestFailedCodes.RoomNotFound
			|| errorCode === JoinRequestFailedCodes.CanNotCreateRoom
		)
	);
}
