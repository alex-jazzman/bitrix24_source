/**
 * @module im/messenger/const/navigation-tab
 */
jn.define('im/messenger/const/navigation-tab', (require, exports, module) => {
	const NavigationTabId = {
		chats: 'chats',
		copilot: 'copilot',
		channel: 'channel',
		collab: 'collab',
		openlines: 'openlines',
		task: 'task',
		collabDefault: 'collabDefault',
		collabChat: 'collabChat',
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
