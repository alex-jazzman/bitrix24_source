jn.define('src/is-room-closed-error', (require, exports, module) => {
	const { CallError } = require('call/const');

	/**
	 * True only when a join-by-uuid response proves the room is already closed.
	 * Apply ONLY on mustCreate=false paths (join/answer by uuid) — the outgoing
	 * create path (mustCreate=true) treats CanNotCreateRoom as a genuine
	 * can-not-create, not a closed room. Transport/ambiguous failures carry a
	 * string `code` (MediaServerUnreachable/...) with no numeric `errorCode`, so
	 * they are excluded and never surface a false "call finished".
	 *
	 * Codes are read from the runtime enum BX.Call.ErrorPreventingReconnection
	 * (not copied literals) so the predicate cannot drift from the engine.
	 *
	 * @param {?{ code?: *, errorCode?: * }} error
	 * @returns {boolean}
	 */
	const isRoomClosedError = (error) => {
		if (!error)
		{
			return false;
		}

		const codes = BX.Call.ErrorPreventingReconnection;

		return error.code === CallError.alreadyFinished
			|| error.errorCode === codes.CanNotCreateRoom
			|| error.errorCode === codes.RoomNotFound;
	};

	module.exports = { isRoomClosedError };
});
