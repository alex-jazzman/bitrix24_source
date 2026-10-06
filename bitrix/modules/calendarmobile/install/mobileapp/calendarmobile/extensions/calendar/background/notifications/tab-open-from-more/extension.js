/**
 * @module calendar/background/notifications/tab-open-from-more
 */
jn.define('calendar/background/notifications/tab-open-from-more', (require, exports, module) => {
	const { CalendarTabOpenNotification } = require('calendar/background/notifications/tab-open');
	const { NOTIFICATION_EVENTS, SUBSCRIPTION_EVENTS } = require('navigator/more-tab/meta');

	/**
	 * @class CalendarTabOpenFromMoreNotification
	 */
	class CalendarTabOpenFromMoreNotification extends CalendarTabOpenNotification
	{
		getNotificationType()
		{
			return 'MOBILE_OPEN_CALENDAR_TAB_FROM_MORE';
		}

		getNotificationEventName()
		{
			return NOTIFICATION_EVENTS.CALENDAR;
		}

		getSubscriptionEventName()
		{
			return SUBSCRIPTION_EVENTS.CALENDAR;
		}
	}

	module.exports = {
		CalendarTabOpenFromMoreNotification,
	};
});
