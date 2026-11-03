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
		vibecodeApp: 'vibecodeApp',
		openlines: 'lines',
		// nested navigation tabs — values match NavigationTabId strings sent by backend
		collabDefault: 'collabDefault',
		collabChat: 'collabChat',
		calendar: 'calendar',
	});

	// Server-side recent section codes that have no navigation tab of their own.
	// They are composition sections: a chat may belong to them in addition to its tab
	// section. Values differ from RecentTab on purpose: RecentSectionCode.chat is 'chat',
	// while RecentTab.chat is 'default'.
	const RecentSectionCode = Object.freeze({
		chat: 'chat',
		channel: 'channel',
	});

	const RecentTabByNavigationTab = Object.freeze({
		[NavigationTabId.chats]: RecentTab.chat,
		[NavigationTabId.copilot]: RecentTab.copilot,
		[NavigationTabId.collab]: RecentTab.collab,
		[NavigationTabId.channel]: RecentTab.openChannel,
		[NavigationTabId.task]: RecentTab.tasksTask,
		[NavigationTabId.vibecodeApp]: RecentTab.vibecodeApp,
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
		[RecentTab.vibecodeApp]: NavigationTabId.vibecodeApp,
		[RecentTab.openlines]: NavigationTabId.openlines,
		[RecentTab.collabDefault]: NavigationTabId.collabDefault,
		[RecentTab.collabChat]: NavigationTabId.collabChat,
		[RecentTab.calendar]: NavigationTabId.calendar,
	});

	// System folder.code → NavigationTabId. The Open Lines folder rest-code is
	// 'lines' (backend FolderTable rest-code; domain code is unchanged), which
	// matches RecentTab.openlines ('lines').
	// The "All" folder has a tab of its own but no recent section: its content is
	// resolved into a SET of member sections, so it is absent from RecentTab.
	const NavigationTabByFolderCode = Object.freeze({
		all: NavigationTabId.all,
		default: NavigationTabId.chats,
		copilot: NavigationTabId.copilot,
		collab: NavigationTabId.collab,
		openChannel: NavigationTabId.channel,
		tasksTask: NavigationTabId.task,
		vibecodeApp: NavigationTabId.vibecodeApp,
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
		RecentSectionCode,
		RecentTabByNavigationTab,
		NavigationTabByRecentTab,
		NavigationTabByFolderCode,
		MessageStatus,
		SubTitleIconType,
	};
});
