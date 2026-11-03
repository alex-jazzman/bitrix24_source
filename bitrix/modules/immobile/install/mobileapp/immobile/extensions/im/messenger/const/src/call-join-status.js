/**
 * @module im/messenger/const/call-join-status
 */
jn.define('im/messenger/const/call-join-status', (require, exports, module) => {
	/**
	 * @readonly
	 */
	const CallJoinStatus = Object.freeze({
		local: 'local',
		none: 'none',
		remote: 'remote',
	});

	module.exports = { CallJoinStatus };
});
