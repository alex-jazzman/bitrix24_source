/**
 * @module call/const/call-error
 */
jn.define('call/const/call-error', (require, exports, module) => {
	const CallError = Object.freeze({
		alreadyFinished: 'ALREADY_FINISHED',
		// Another call replaced the one we were working with: unlike
		// alreadyFinished it says nothing about the room being gone.
		answerSuperseded: 'ANSWER_SUPERSEDED',
	});

	module.exports = { CallError };
});
