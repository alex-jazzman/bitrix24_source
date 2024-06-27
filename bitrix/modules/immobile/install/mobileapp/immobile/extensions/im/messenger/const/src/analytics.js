/**
 * @module im/messenger/const/analytics
 */
jn.define('im/messenger/const/analytics', (require, exports, module) => {
	const CopilotChatType = Object.freeze({
		private: 'chatType_private',
		multiuser: 'chatType_multiuser',
	});

	const Event = Object.freeze({
		openChat: 'open_chat',
		openExisting: 'open_existing',
		openComments: 'open_comments',
		createNewChat: 'create_new_chat',
		clickCreateNew: 'click_create_new',
		submitCreateNew: 'submit_create_new',
		audioUse: 'audio_use',
		openTab: 'open_tab',
		openMessenger: 'open_messenger',
		sendMessage: 'send_message',
	});

	const Tool = Object.freeze({
		ai: 'ai',
		im: 'im',
	});

	const Category = Object.freeze({
		chatOperations: 'chat_operations',
		messenger: 'messenger',
		channel: 'channel',
		chat: 'chat',
		videoconf: 'videoconf',
	});

	const Type = Object.freeze({
		ai: 'ai',
		chat: 'chat',
		user: 'private',
		general: 'general',
		open: 'group_open',
		groupOpen: 'group_open',
		groupClosed: 'group_closed',
		copilot: 'copilot',

		channel: 'channel',
		channelOpen: 'channel_open',
		openChannel: 'channel_open',
		channelClosed: 'channel_closed',
		closedChannel: 'channel_closed',
		generalChannel: 'channel_general',
		comment: 'comment',
		post: 'post',

		notifications: 'notifications',
		openlines: 'openlines',
		tasks: 'tasks',
		call: 'call',
		crm: 'crm',
		mail: 'mail',
		videoconf: 'videoconf',
		calendar: 'calendar',
		sonetGroup: 'sonet_group',
		none: 'none',
	});

	const Section = Object.freeze({
		copilotTab: 'copilot_tab',
		chatTab: 'chat_tab',
		channelTab: 'channel_tab',
		notificationTab: 'notification_tab',
	});

	const Element = Object.freeze({
		push: 'push',
	});

	const P3 = Object.freeze({
		isMemberY: 'isMember_Y',
		isMemberN: 'isMember_N',
	});

	const P1 = Object.freeze({
		openChannel: 'chatType_channelOpen',
		closedChannel: 'chatType_channelClosed',
		generalChannel: 'chatType_channelGeneral',
		comment: 'chatType_comments',
		user: 'chatType_private',
		open: 'chatType_groupOpen' ,
		chat: 'chatType_groupClosed',
		general: 'chatType_general',
		tasks: 'chatType_tasks',
		calendar: 'chatType_calendar',
		videoconf: 'chatType_videoconf',
		call: 'chatType_call',
		crm: 'chatType_crm',
		mail: 'chatType_mail',
		sonetGroup: 'chatType_sonetGroup',
	});

	const Analytics = Object.freeze({
		CopilotChatType,
		Event,
		Tool,
		Category,
		Type,
		Section,
		Element,
		P3,
		P1,
	});

	module.exports = { Analytics };
});
