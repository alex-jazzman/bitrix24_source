/**
 * @module call/calls/layout/src/batch-snapshot
 */
jn.define('src/batch-snapshot', (require, exports, module) => {
	/**
	 * Captures a snapshot of UserModel fields that drive the remote-video subscription delta.
	 * Returns a Map<userId, { state, cameraState, screenState, talking }>.
	 * Values are primitives (copied by value), so the snapshot is decoupled from
	 * subsequent mutations of the original UserModel instances.
	 *
	 * @param {Array<{id, state, cameraState, screenState, talking}>} users
	 * @returns {Map<number, {state, cameraState, screenState, talking}>}
	 */
	const captureBeforeBatchSnapshot = (users) => {
		const snapshot = new Map();
		for (const user of users)
		{
			snapshot.set(user.id, {
				state: user.state,
				cameraState: user.cameraState,
				screenState: user.screenState,
				talking: user.talking,
			});
		}

		return snapshot;
	};

	module.exports = { captureBeforeBatchSnapshot };
});
