/**
 * @module im/messenger/lib/read-all-chats
 */
jn.define('im/messenger/lib/read-all-chats', (require, exports, module) => {
	const { isOnline } = require('device/connection');
	const {
		NavigationTabId,
		RecentTab,
	} = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { Notification } = require('im/messenger/lib/ui/notification');
	const { AnalyticsService } = require('im/messenger/provider/services/analytics');
	const { getLogger } = require('im/messenger/lib/logger');

	const logger = getLogger('recent--read-all-chats');

	const readAllChatsCollection = {
		// The composite tab is made of several recent sections, and readAllByRecentSection takes only one,
		// so "All" is read portal-wide: there is no read by the composition of a folder.
		[NavigationTabId.all]: () => readAllChats(),
		[NavigationTabId.chats]: () => readAllChats(),
		[NavigationTabId.copilot]: () => readAllChats(),
		[NavigationTabId.channel]: () => readAllChats(),
		[NavigationTabId.collab]: () => readAllChats(),
		[NavigationTabId.task]: (parentChatId) => readAllByRecentSection(RecentTab.tasksTask, parentChatId),
		[NavigationTabId.vibecodeApp]: (parentChatId) => readAllByRecentSection(RecentTab.vibecodeApp, parentChatId),
		[NavigationTabId.collabDefault]: (parentChatId) => readChatWithChildren(parentChatId),
		[NavigationTabId.collabChat]: (parentChatId) => readAllByRecentSection(RecentTab.collabChat, parentChatId),
		// The project BitrixGPT tab shares recentSection 'copilot' with the root one; the project scope
		// is set by parentChatId, so the server reads only the project's copilot chats.
		[NavigationTabId.collabCopilot]: (parentChatId) => readAllByRecentSection(RecentTab.copilot, parentChatId),
		[NavigationTabId.calendar]: (parentChatId) => readAllByRecentSection(RecentTab.calendar, parentChatId),
	};

	async function readAllChatsByActiveRecentTab()
	{
		const tabId = serviceLocator.get('recent-manager').getActiveRecentId();

		return readAllChatsByRecentTab(tabId);
	}

	async function readAllChatsByRecentTab(tabId, parentChatId = null)
	{
		AnalyticsService.getInstance().recentAnalytics.sendTapReadAll(tabId);

		if (readAllChatsCollection[tabId])
		{
			return readAllChatsCollection[tabId](parentChatId);
		}

		// A nested tab is always scoped to its parent, so the read-everything fallback is wrong for it:
		// an unmapped nested tab must not silently read the whole portal.
		if (parentChatId)
		{
			logger.error('readAllChatsByRecentTab: nested tab is not mapped, read skipped', tabId);

			return Promise.resolve({});
		}

		return readAllChatsCollection[NavigationTabId.chats]();
	}

	async function readAllChats()
	{
		if (!isOnline())
		{
			Notification.showOfflineToast();

			return Promise.resolve({});
		}

		return serviceLocator.get('read-service').readAllMessages();
	}

	async function readAllByRecentSection(recentSection, parentChatId = null)
	{
		if (!isOnline())
		{
			Notification.showOfflineToast();

			return;
		}

		await serviceLocator.get('read-service').readAllMessagesByRecentSection(recentSection, parentChatId);
	}

	async function readChatWithChildren(parentChatId)
	{
		if (!isOnline())
		{
			Notification.showOfflineToast();

			return;
		}

		await serviceLocator.get('read-service').readChatWithChildren(parentChatId);
	}

	module.exports = {
		readAllChatsByActiveRecentTab,
		readAllChatsByRecentTab,
	};
});
