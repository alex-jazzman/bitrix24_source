/**
 * @module call/const/call-error
 */
jn.define('call/const/call-error', (require, exports, module) => {
	const CallError = Object.freeze({
		alreadyFinished: 'ALREADY_FINISHED',
	});

	module.exports = { CallError };
});
