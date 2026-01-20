/**
 * @module im/messenger-v2/lib/read-all-chats
 */
jn.define('im/messenger-v2/lib/read-all-chats', (require, exports, module) => {
	const {
		NavigationTabId,
		DialogType,
	} = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	const readAllChatsCollection = {
		[NavigationTabId.chats]: readAllChats,
		[NavigationTabId.copilot]: readAllChats,
		[NavigationTabId.channel]: readAllChats,
		[NavigationTabId.collab]: readAllChats,
		[NavigationTabId.task]: readAllByDialogType.bind(this, DialogType.tasksTask),
	};

	async function readAllChatsByActiveRecentTab()
	{
		const { RecentManager } = await requireLazy('im:messenger-v2/controller/recent/manager');
		const tabId = RecentManager.getInstance().getActiveRecentId();
		if (readAllChatsCollection[tabId])
		{
			return readAllChatsCollection[tabId]();
		}

		return readAllChatsCollection[NavigationTabId.chats]();
	}

	async function readAllChats()
	{
		return serviceLocator.get('read-service').readAllMessages();
	}

	function readAllByDialogType(dialogType)
	{
		return serviceLocator.get('read-service').readAllMessagesByDialogType(dialogType);
	}

	module.exports = {
		readAllChatsByActiveRecentTab,
	};
});
