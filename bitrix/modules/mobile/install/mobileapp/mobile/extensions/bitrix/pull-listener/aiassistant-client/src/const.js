/**
 * @module pull-listener/aiassistant-client/src/const
 */
jn.define('pull-listener/aiassistant-client/src/const', (require, exports, module) => {
	const PullEventId = {
		AI_OPEN_CHAT_MOBILE: 'aiassistant:openChatMobile',
		AI_SHOW_FEEDBACK_FORM_MOBILE: 'aiassistant:showFeedbackFormMobile',
	};

	module.exports = {
		PullEventId,
	};
});
