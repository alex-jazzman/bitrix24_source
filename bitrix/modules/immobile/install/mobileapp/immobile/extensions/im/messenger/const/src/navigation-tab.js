/**
 * @module im/messenger/const/navigation-tab
 */
jn.define('im/messenger/const/navigation-tab', (require, exports, module) => {
	const NavigationTabId = {
		all: 'all',
		chats: 'chats',
		copilot: 'copilot',
		channel: 'channel',
		collab: 'collab',
		openlines: 'openlines',
		task: 'task',
		vibecodeApp: 'vibecodeApp',
		collabDefault: 'collabDefault',
		collabChat: 'collabChat',
		collabCopilot: 'collabCopilot',
		calendar: 'calendar',
	};

	const NonSelectableNavigationTabId = {
		folderList: 'folderList',
	};

	const ROOT_PARENT_CHAT_ID = 0;

	module.exports = {
		NavigationTabId,
		NonSelectableNavigationTabId,
		ROOT_PARENT_CHAT_ID,
	};
});
