/**
 * @module call/const/call-presence
 */
jn.define('call/const/call-presence', (require, exports, module) => {
	const CallPresence = Object.freeze({
		Unknown: 'unknown',
		Active: 'active',
		Inactive: 'inactive',
	});

	module.exports = { CallPresence };
});
