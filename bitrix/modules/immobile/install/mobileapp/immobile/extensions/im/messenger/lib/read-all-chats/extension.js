/**
 * @module im/messenger/lib/read-all-chats
 */
jn.define('im/messenger/lib/read-all-chats', (require, exports, module) => {
	const { isOnline } = require('device/connection');
	const {
		NavigationTabId,
		DialogType,
	} = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { Notification } = require('im/messenger/lib/ui/notification');
	const { AnalyticsService } = require('im/messenger/provider/services/analytics');

	const readAllChatsCollection = {
		[NavigationTabId.chats]: readAllChats,
		[NavigationTabId.copilot]: readAllChats,
		[NavigationTabId.channel]: readAllChats,
		[NavigationTabId.collab]: readAllChats,
		[NavigationTabId.task]: readAllByDialogType.bind(this, DialogType.tasksTask),
	};

	async function readAllChatsByActiveRecentTab()
	{
		const { RecentManager } = await requireLazy('im:messenger/controller/recent/manager');
		const tabId = RecentManager.getInstance().getActiveRecentId();

		AnalyticsService.getInstance().recentAnalytics.sendTapReadAll(tabId);

		if (readAllChatsCollection[tabId])
		{
			return readAllChatsCollection[tabId]();
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

	async function readAllByDialogType(dialogType)
	{
		if (!isOnline())
		{
			Notification.showOfflineToast();

			return;
		}

		await serviceLocator.get('read-service').readAllMessagesByDialogType(dialogType);
	}

	module.exports = {
		readAllChatsByActiveRecentTab,
	};
});
