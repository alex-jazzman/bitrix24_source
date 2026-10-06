/**
 * @module im/messenger/provider/services/analytics/navigation-tab
 */
jn.define('im/messenger/provider/services/analytics/navigation-tab', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');
	const { Analytics, NavigationTabId, NavigationTabByFolderCode } = require('im/messenger/const');

	/**
	 * @class NavigationTab
	 */
	class NavigationTab
	{
		sendChangeTab(currentTab, analyticsOptions = {})
		{
			try
			{
				if (currentTab === NavigationTabId.copilot)
				{
					const analytics = new AnalyticsEvent()
						.setTool(Analytics.Tool.ai)
						.setCategory(Analytics.Category.chatOperations)
						.setEvent(Analytics.Event.openTab)
						.setSection(Analytics.Section.copilotTab)
					;

					analytics.send();
				}

				if (currentTab !== NavigationTabId.chats && !this.#isFolderTab(currentTab))
				{
					const analytics = new AnalyticsEvent()
						.setTool(analyticsOptions.tool ?? Analytics.Tool.im)
						.setCategory(analyticsOptions.category ?? Analytics.Category.messenger)
						.setEvent(analyticsOptions.event ?? Analytics.Event.openTab)
						.setType(analyticsOptions.type ?? Analytics.Type.Tab[currentTab])
					;

					analytics.send();
				}
			}
			catch (e)
			{
				console.error(`${this.constructor.name}.sendStartCreation.catch:`, e);
			}
		}

		/**
		 * @param {string} tabId
		 * @returns {boolean}
		 */
		#isFolderTab(tabId)
		{
			if (Object.values(NavigationTabByFolderCode).includes(tabId))
			{
				return true;
			}

			const folderId = Number(tabId);

			return Number.isInteger(folderId) && folderId > 0;
		}
	}

	module.exports = { NavigationTab };
});
