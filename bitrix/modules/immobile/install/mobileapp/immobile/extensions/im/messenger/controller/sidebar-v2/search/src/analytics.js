/**
 * @module im/messenger/controller/sidebar-v2/search/src/analytics
 */
jn.define('im/messenger/controller/sidebar-v2/search/src/analytics', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');
	const { Analytics } = require('im/messenger/const/analytics');

	/**
	 * @class SidebarSearchAnalytics
	 */
	class SidebarSearchAnalytics
	{
		constructor(dialogHelper)
		{
			this.dialogHelper = dialogHelper;
			this.dialogType = this.dialogHelper.dialogModel.type;

			this.analytics = this.getCommonAnalyticsData();
		}

		get isAllowedAnalytics()
		{
			return true;
		}

		sendOpenSearchEvent()
		{
			const event = (new AnalyticsEvent(this.analytics))
				.setEvent(Analytics.Event.openSearch)
			;
			this.sendEvent(event);
		}

		sendStartSearchEvent()
		{
			const event = (new AnalyticsEvent(this.analytics))
				.setEvent(Analytics.Event.startSearch)
			;
			this.sendEvent(event);
		}

		sendSearchResultEventNotFound()
		{
			const event = (new AnalyticsEvent(this.analytics))
				.setEvent(Analytics.Event.searchResult)
				.setStatus(Analytics.Status.notFound)
			;
			this.sendEvent(event);
		}

		sendSearchResultEventSuccess()
		{
			const event = (new AnalyticsEvent(this.analytics))
				.setEvent(Analytics.Event.searchResult)
				.setStatus(Analytics.Status.success)
			;
			this.sendEvent(event);
		}

		sendCancelSearchEvent()
		{
			const event = (new AnalyticsEvent(this.analytics))
				.setEvent(Analytics.Event.cancelSearch)
			;
			this.sendEvent(event);
		}

		sendSelectSearchResultEvent(position)
		{
			const event = (new AnalyticsEvent(this.analytics))
				.setEvent(Analytics.Event.selectSearchResult)
				.setP3(`position_${position}`)
			;
			this.sendEvent(event);
		}

		sendBackToSearchEvent()
		{
			const event = (new AnalyticsEvent(this.analytics))
				.setEvent(Analytics.Event.backToSearch);
			this.sendEvent(event);
		}

		/**
		 * @param {AnalyticsEvent} event
		 */
		sendEvent(event)
		{
			if (this.isAllowedAnalytics)
			{
				event.send();
			}
		}

		getCommonAnalyticsData()
		{
			const analyticsType = this.dialogHelper?.isAiAssistant
				? Analytics.Type.aiAssistant
				: this.dialogType;

			return new AnalyticsEvent()
				.setTool('im')
				.setCategory(this.dialogType)
				.setSection(Analytics.Section.chatSidebar)
				.setType(analyticsType ?? Analytics.Type.custom)
			;
		}
	}

	module.exports = {
		SidebarSearchAnalytics,
		AnalyticsEvent,
	};
});
