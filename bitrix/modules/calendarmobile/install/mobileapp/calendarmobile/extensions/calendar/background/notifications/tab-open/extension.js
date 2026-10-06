/**
 * @module calendar/background/notifications/tab-open
 */
jn.define('calendar/background/notifications/tab-open', (require, exports, module) => {
	const { BaseNotificationHandler } = require('background/notifications/base');
	const { AnalyticsEvent } = require('analytics');
	const { SUBSCRIPTION_EVENTS, NOTIFICATION_EVENTS } = require('calendar/navigator/meta');

	/**
	 * @class CalendarTabOpenNotification
	 */
	class CalendarTabOpenNotification extends BaseNotificationHandler
	{
		getNotificationType()
		{
			return 'MOBILE_OPEN_CALENDAR_TAB';
		}

		getNotificationEventName()
		{
			return NOTIFICATION_EVENTS.CALENDAR;
		}

		getSubscriptionEventName()
		{
			return SUBSCRIPTION_EVENTS.CALENDAR;
		}

		getAnalytics()
		{
			return new AnalyticsEvent()
				.setEvent('push_mobile_1-8d_calendar')
				.setCategory('1-8d')
				.setTool('mobile');
		}
	}

	module.exports = {
		CalendarTabOpenNotification,
	};
});
