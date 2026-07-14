/**
 * @module im/messenger/lib/element/dialog/message/banner/const/type
 */
jn.define('im/messenger/lib/element/dialog/message/banner/const/type', (require, exports, module) => {
	const ButtonType = Object.freeze({
		full: 'full',
		short: 'short',
	});

	const ButtonId = Object.freeze({
		planLimitsUnlock: 'id_plan_limits_unlock',
	});

	const ImageNameType = Object.freeze({
		planLimits: 'ic_plan_limits_banner',
		copilotNewUser: 'ic_chat_copilot_new_user',
		videoconf: 'ic_videoconf_chat_banner',
		channel: 'ic_channel_banner',
		generalChat: 'ic_general_chat_banner',
		chat: 'ic_group_chat_banner',
		notes: 'ic_notes_chat_banner',
	});

	module.exports = {
		ButtonType,
		ImageNameType,
		ButtonId,
	};
});
