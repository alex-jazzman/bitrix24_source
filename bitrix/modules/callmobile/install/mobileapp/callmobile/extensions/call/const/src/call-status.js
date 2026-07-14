/**
 * @module call/const/call-status
 */
jn.define('call/const/call-status', (require, exports, module) => {
	const CallStatus = Object.freeze({
		call: 'call',
		connecting: 'connecting',
		incoming: 'incoming',
		none: 'none',
		outgoing: 'outgoing',
	});

	module.exports = { CallStatus };
});
