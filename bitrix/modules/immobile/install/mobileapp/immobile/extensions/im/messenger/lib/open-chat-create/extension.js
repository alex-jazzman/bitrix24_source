/**
 * @module im/messenger/lib/open-chat-create
 */
jn.define('im/messenger/lib/open-chat-create', (require, exports, module) => {
	const { NavigationTabId } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { CreateChannel } = require('im/messenger/controller/chat-composer');

	async function openChatCreateByActiveRecentTab()
	{
		const { RecentManager } = await requireLazy('im:messenger/controller/recent/manager');

		const tabId = RecentManager.getInstance().getActiveRecent().id;
		const openChatCreateCollection = {
			[NavigationTabId.chats]: openChatCreate,
			[NavigationTabId.copilot]: directCopilotChatCreate,
			[NavigationTabId.channel]: openChannelCreate,
			[NavigationTabId.collab]: openCollabCreate,
		};

		if (openChatCreateCollection[tabId])
		{
			return openChatCreateCollection[tabId]();
		}

		return openChatCreateCollection[NavigationTabId.chats]();
	}

	function openChatCreate()
	{
		void serviceLocator.get('dialog-creator').open();
	}

	function openCopilotCreate()
	{
		return serviceLocator.get('dialog-creator').createCopilotDialog();
	}

	function directCopilotChatCreate()
	{
		return serviceLocator.get('dialog-creator').createCopilotDialogWithoutSelector();
	}

	function openChannelCreate()
	{
		const createChannel = new CreateChannel();
		void createChannel.open();
	}

	function openCollabCreate()
	{
		return serviceLocator.get('dialog-creator').createCollab();
	}

	module.exports = {
		openChatCreateByActiveRecentTab,
		openChatCreate,
		openCopilotCreate,
		openChannelCreate,
		openCollabCreate,
	};
});
