/**
 * @module im/messenger/const/recent
 */
jn.define('im/messenger/const/recent', (require, exports, module) => {
	const { NavigationTabId } = require('im/messenger/const/navigation-tab');

	const ChatTypes = Object.freeze({
		chat: 'chat',
		open: 'open',
		user: 'user',
		notification: 'notification',
	});

	const RecentTab = Object.freeze({
		chat: 'default',
		copilot: 'copilot',
		openChannel: 'openChannel',
		collab: 'collab',
		tasksTask: 'tasksTask',
		openlines: 'lines',
		// nested navigation tabs — values match NavigationTabId strings sent by backend
		collabDefault: 'collabDefault',
		collabChat: 'collabChat',
		calendar: 'calendar',
	});

	const RecentTabByNavigationTab = Object.freeze({
		[NavigationTabId.chats]: RecentTab.chat,
		[NavigationTabId.copilot]: RecentTab.copilot,
		[NavigationTabId.collab]: RecentTab.collab,
		[NavigationTabId.channel]: RecentTab.openChannel,
		[NavigationTabId.task]: RecentTab.tasksTask,
		[NavigationTabId.openlines]: RecentTab.openlines,
		[NavigationTabId.collabDefault]: RecentTab.collabDefault,
		[NavigationTabId.collabChat]: RecentTab.collabChat,
		// collabCopilot sends recentSection='copilot' to the server (same as root copilot);
		// distinction between global and project scope is done by parentId on the server side.
		[NavigationTabId.collabCopilot]: RecentTab.copilot,
		[NavigationTabId.calendar]: RecentTab.calendar,
	});

	const NavigationTabByRecentTab = Object.freeze({
		[RecentTab.chat]: NavigationTabId.chats,
		[RecentTab.copilot]: NavigationTabId.copilot,
		[RecentTab.collab]: NavigationTabId.collab,
		[RecentTab.openChannel]: NavigationTabId.channel,
		[RecentTab.tasksTask]: NavigationTabId.task,
		[RecentTab.openlines]: NavigationTabId.openlines,
		[RecentTab.collabDefault]: NavigationTabId.collabDefault,
		[RecentTab.collabChat]: NavigationTabId.collabChat,
		[RecentTab.calendar]: NavigationTabId.calendar,
	});

	// System folder.code → NavigationTabId. The Open Lines folder rest-code is
	// 'lines' (backend FolderTable rest-code; domain code is unchanged), which
	// matches RecentTab.openlines ('lines').
	const NavigationTabByFolderCode = Object.freeze({
		default: NavigationTabId.chats,
		copilot: NavigationTabId.copilot,
		collab: NavigationTabId.collab,
		openChannel: NavigationTabId.channel,
		tasksTask: NavigationTabId.task,
		lines: NavigationTabId.openlines,
	});

	const MessageStatus = Object.freeze({
		received: 'received',
		delivered: 'delivered',
		error: 'error',
	});

	const SubTitleIconType = Object.freeze({
		reply: 'reply',
		wait: 'wait',
		error: 'error',
	});

	module.exports = {
		ChatTypes,
		RecentTab,
		RecentTabByNavigationTab,
		NavigationTabByRecentTab,
		NavigationTabByFolderCode,
		MessageStatus,
		SubTitleIconType,
	};
});
