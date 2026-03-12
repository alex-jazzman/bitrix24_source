/**
 * @module im/messenger/provider/services/analytics/src/notification
 */
jn.define('im/messenger/provider/services/analytics/src/notification', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');
	const { Analytics } = require('im/messenger/const');

	/**
	 * @class NotificationAnalytics
	 */
	class NotificationAnalytics
	{
		sendOpenNotifications()
		{
			const analytics = new AnalyticsEvent()
				.setTool(Analytics.Tool.im)
				.setCategory(Analytics.Category.messenger)
				.setEvent(Analytics.Event.openNotifications)
				.setSection(Analytics.Section.messenger)
			;

			analytics.send();
		}
	}

	module.exports = {
		NotificationAnalytics,
	};
});
