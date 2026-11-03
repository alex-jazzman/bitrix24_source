/**
 * @module im/messenger/provider/services/analytics/navigation-tab
 */
jn.define('im/messenger/provider/services/analytics/navigation-tab', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');
	const {
		Analytics,
		NavigationTabId,
		NavigationTabByFolderCode,
		RecentTabByNavigationTab,
	} = require('im/messenger/const');
	const { AnalyticsHelper } = require('im/messenger/provider/services/analytics/helper');

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
		 * @desc Emits use_chat_filter on a project (collab) nested-tab switch.
		 *       Mirrors web onSelectSection: fired on every real tab change; the
		 *       initial default tab never reaches this path (pre-seeded in the switcher).
		 * @param {object} params
		 * @param {string} params.tabId - NavigationTabId of the selected nested tab
		 */
		sendUseChatFilter({ tabId })
		{
			try
			{
				const type = RecentTabByNavigationTab[tabId];
				if (!type)
				{
					return;
				}

				const analytics = new AnalyticsEvent()
					.setTool(Analytics.Tool.im)
					.setCategory(Analytics.Category.project)
					.setEvent(Analytics.Event.useChatFilter)
					.setSection(Analytics.Section.projectTab)
					.setType(type)
					.setP2(AnalyticsHelper.getP2ByUserType())
				;

				analytics.send();
			}
			catch (e)
			{
				console.error(`${this.constructor.name}.sendUseChatFilter.catch:`, e);
			}
		}

		/**
		 * @desc Emits a creation click from the project menu (click_create_task /
		 *       click_create_event). The project menu carries no chat context, and the
		 *       creation events report neither the chat nor the project, so the label
		 *       has no type, p1, p4 or p5 - only the section tells the source apart.
		 * @param {object} params
		 * @param {string} params.event - Analytics.Event of the entity being created
		 */
		sendProjectTabCreateClick({ event })
		{
			try
			{
				new AnalyticsEvent()
					.setTool(Analytics.Tool.im)
					.setCategory(Analytics.Category.project)
					.setEvent(event)
					.setSection(Analytics.Section.projectTab)
					.setP2(AnalyticsHelper.getP2ByUserType())
					.send();
			}
			catch (e)
			{
				console.error(`${this.constructor.name}.sendProjectTabCreateClick.catch:`, e);
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
