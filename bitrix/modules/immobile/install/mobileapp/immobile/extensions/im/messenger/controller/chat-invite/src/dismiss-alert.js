/**
 * @module im/messenger/controller/chat-invite/dismiss-alert
 */
jn.define('im/messenger/controller/chat-invite/dismiss-alert', (require, exports, module) => {
	const { Loc } = require('loc');

	/**
	 * @desc Common dismissAlert config reused by every sub-box opened from the guests tab.
	 * @return {DismissAlertConfig}
	 */
	const buildDismissAlertConfig = () => ({
		title: Loc.getMessage('IMMOBILE_CHAT_INVITE_CLOSE_ALERT_TITLE'),
		description: Loc.getMessage('IMMOBILE_CHAT_INVITE_CLOSE_ALERT_DESCRIPTION'),
		destructiveButtonText: Loc.getMessage('IMMOBILE_CHAT_INVITE_CLOSE_ALERT_DESTRUCTIVE_BUTTON'),
		defaultButtonText: Loc.getMessage('IMMOBILE_CHAT_INVITE_CLOSE_ALERT_CONTINUE_BUTTON'),
	});

	module.exports = { buildDismissAlertConfig };
});
