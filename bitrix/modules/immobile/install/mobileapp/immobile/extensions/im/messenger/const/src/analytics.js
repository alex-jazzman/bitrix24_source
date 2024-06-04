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
		createNewChat: 'create_new_chat',
		audioUse: 'audio_use',
		openTab: 'open_tab',
	});

	const Tool = Object.freeze({
		ai: 'ai',
	});

	const Category = Object.freeze({
		chatOperations: 'chat_operations',
	});

	const Type = Object.freeze({
		ai: 'ai',
	});

	const Section = Object.freeze({
		copilotTab: 'copilot_tab',
	});

	const Analytics = Object.freeze({
		CopilotChatType,
		Event,
		Tool,
		Category,
		Type,
		Section,
	});

	module.exports = { Analytics };
});
