/**
 * @module call/calls/controller/connection-error-status
 */
jn.define('call/calls/controller/connection-error-status', (require, exports, module) => {
	const CALL_ALREADY_FINISHED_STATUS = 'call_already_finished';

	/**
	 * Status of a connect / start_call analytics event that ended in a failure.
	 *
	 * Sent as an outcome (`call_already_finished`), not as an `error_*` code: a closed room is
	 * a normal result, alongside success/busy/decline/no_answer. An `error_` prefix would put it
	 * back on the connection-errors dashboard next to real transport failures.
	 * Agreed with analytics; do not "unify" it with the CamelCase error_* server codes.
	 *
	 * Whitespace of a server code collapses into an underscore: 'internal error' and 'internal_error'
	 * are one code, and the dashboard must show them as one status.
	 *
	 * @param {*} errorCode
	 * @param {boolean} isRoomClosed
	 * @returns {string}
	 */
	const getConnectionErrorStatus = (errorCode, isRoomClosed) => (
		isRoomClosed ? CALL_ALREADY_FINISHED_STATUS : `error_${errorCode}`.replaceAll(/\s+/g, '_')
	);

	module.exports = { getConnectionErrorStatus };
});
