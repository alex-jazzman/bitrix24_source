/**
 * @module im/messenger/provider/services/analytics/src/recent
 */
jn.define('im/messenger/provider/services/analytics/src/recent', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');
	const { Analytics, NavigationTabId } = require('im/messenger/const');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { AnalyticsHelper } = require('im/messenger/provider/services/analytics/helper');

	// The 'all' tab replaces the hidden 'chats' one and reports its event type: the type names the
	// chat being read, not the folder it is listed in.
	const TYPE_BY_TAB_ID = {
		[NavigationTabId.all]: Analytics.Type.Dialog.chat,
		[NavigationTabId.chats]: Analytics.Type.Dialog.chat,
		[NavigationTabId.task]: Analytics.Type.Dialog.tasks,
	};

	// The section is the folder of the tab, the same value chat opening reports there: one screen must
	// not answer the context question differently across its events. A tab standing for no folder of
	// the label table keeps its historical value, and the 'Chats' tab is the one such tab these two
	// labels reach. The search is a third value still: it answers by a scope of its own, see
	// SEARCH_SECTION_BY_TAB_ID in ./search.js.
	const HISTORICAL_SECTION_BY_TAB_ID = {
		[NavigationTabId.chats]: Analytics.Section.chatTab,
	};

	function getSectionByTabId(tabId)
	{
		return AnalyticsHelper.getFolderSectionByTabId(tabId) ?? HISTORICAL_SECTION_BY_TAB_ID[tabId];
	}

	/**
	 * @class RecentAnalytics
	 */
	class RecentAnalytics
	{
		constructor()
		{
			/** @private */
			this.logger = getLoggerWithContext('analytics-service', this);
		}

		/**
		 * @param {string} tabId
		 */
		sendTapShowUnread(tabId)
		{
			this.#sendRecentListEvent(Analytics.Event.showUnread, tabId);
		}

		/**
		 * @param {string} tabId
		 */
		sendTapReadAll(tabId)
		{
			this.#sendRecentListEvent(Analytics.Event.readAll, tabId);
		}

		/**
		 * @desc Inside a project's nested navigation the list belongs to one project: the event
		 *       reports c_section project and carries no tab type. Outside it only the chats and
		 *       the tasks tab have a markup of their own, the rest report neither field.
		 * @param {string} event
		 * @param {string} tabId
		 */
		#sendRecentListEvent(event, tabId)
		{
			const analytics = new AnalyticsEvent()
				.setTool(Analytics.Tool.im)
				.setCategory(Analytics.Category.messenger)
				.setEvent(event)
			;

			if (AnalyticsHelper.isInsideProjectNavigation())
			{
				analytics.setSection(Analytics.Section.project).send();

				return;
			}

			if (TYPE_BY_TAB_ID[tabId])
			{
				analytics.setType(TYPE_BY_TAB_ID[tabId]);
			}

			const section = getSectionByTabId(tabId);
			if (section)
			{
				analytics.setSection(section);
			}

			analytics.send();
		}
	}

	module.exports = { RecentAnalytics };
});
