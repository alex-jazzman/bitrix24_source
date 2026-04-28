/**
 * @module im/messenger/provider/services/analytics/src/recent
 */
jn.define('im/messenger/provider/services/analytics/src/recent', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');
	const { Analytics, NavigationTabId } = require('im/messenger/const');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const TYPE_BY_TAB_ID = {
		[NavigationTabId.chats]: Analytics.Type.Dialog.chat,
		[NavigationTabId.task]: Analytics.Type.Dialog.tasks,
	};

	const SECTION_BY_TAB_ID = {
		[NavigationTabId.chats]: Analytics.Section.chatTab,
		[NavigationTabId.task]: Analytics.Section.taskTab,
	};

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
			new AnalyticsEvent()
				.setTool(Analytics.Tool.im)
				.setCategory(Analytics.Category.messenger)
				.setEvent(Analytics.Event.showUnread)
				.setType(TYPE_BY_TAB_ID[tabId])
				.setSection(SECTION_BY_TAB_ID[tabId])
				.send()
			;
		}

		/**
		 * @param {string} tabId
		 */
		sendTapReadAll(tabId)
		{
			new AnalyticsEvent()
				.setTool(Analytics.Tool.im)
				.setCategory(Analytics.Category.messenger)
				.setEvent(Analytics.Event.readAll)
				.setType(TYPE_BY_TAB_ID[tabId])
				.setSection(SECTION_BY_TAB_ID[tabId])
				.send()
			;
		}
	}

	module.exports = { RecentAnalytics };
});
