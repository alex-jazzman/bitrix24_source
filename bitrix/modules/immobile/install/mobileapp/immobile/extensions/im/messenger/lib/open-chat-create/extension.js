/**
 * @module im/messenger/lib/open-chat-create
 */
jn.define('im/messenger/lib/open-chat-create', (require, exports, module) => {
	const { Analytics, NavigationTabId } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { AnalyticsService } = require('im/messenger/provider/services/analytics');
	const { CreateChannel } = require('im/messenger/controller/chat-composer');
	const { Feature } = require('im/messenger/lib/feature');
	const { isProjectsGroupsRestricted, showProjectsGroupsRestrictionIfNeeded } = require('im/messenger/lib/plan-limit');
	const { ProjectCreateManager } = require('layout/socialnetwork/project-v2/create');

	async function openChatCreateByActiveRecentTab()
	{
		const tabId = serviceLocator.get('recent-manager').getActiveRecent().id;
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

	/**
	 * @desc Auto-opens a copilot draft chat when the copilot recent tab is empty.
	 * Fires only when the draft-chat feature is on (otherwise it would create a real
	 * chat) and when copilot is the active recent tab (guards against background preload).
	 * @return {Promise<void>}
	 */
	async function openCopilotDraftChatOnEmpty()
	{
		if (!Feature.isCopilotDraftChatAvailable)
		{
			return;
		}

		const activeRecent = serviceLocator.get('recent-manager').getActiveRecent();
		if (activeRecent?.id !== NavigationTabId.copilot)
		{
			return;
		}

		await directCopilotChatCreate();
	}

	function openChannelCreate()
	{
		sendStartCreation(Analytics.Category.channel, Analytics.Type.channel);

		const createChannel = new CreateChannel();
		void createChannel.open();
	}

	function openCollabCreate()
	{
		if (Feature.isNestedChatAvailable)
		{
			if (isProjectsGroupsRestricted())
			{
				return showProjectsGroupsRestrictionIfNeeded();
			}

			sendStartCreation(Analytics.Category.project, Analytics.Type.Tab.project);

			return ProjectCreateManager.open();
		}

		sendStartCreation(Analytics.Category.collab, Analytics.Type.collab);

		return serviceLocator.get('dialog-creator').createCollab();
	}

	/**
	 * @param {string} category
	 * @param {string} type
	 */
	function sendStartCreation(category, type)
	{
		AnalyticsService.getInstance().sendStartCreation({ category, type });
	}

	module.exports = {
		openChatCreateByActiveRecentTab,
		openChatCreate,
		openCopilotCreate,
		openCopilotDraftChatOnEmpty,
		openChannelCreate,
		openCollabCreate,
	};
});
