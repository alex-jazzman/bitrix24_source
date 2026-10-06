/**
 * @module calendar/navigator
 */
jn.define('calendar/navigator', (require, exports, module) => {
	const { BaseNavigator } = require('navigator/base');
	const { NOTIFICATION_EVENTS, SUBSCRIPTION_EVENTS } = require('calendar/navigator/meta');

	/**
	 * @class CalendarNavigator
	 */
	class CalendarNavigator extends BaseNavigator
	{
		subscribeToPushNotifications()
		{
			this.subscribeToCalendarNotification();
		}

		unsubscribeFromPushNotifications()
		{
			BX.removeCustomEvent(NOTIFICATION_EVENTS.CALENDAR, this.onCalendarNotification.bind(this));
		}

		subscribeToCalendarNotification()
		{
			BX.addCustomEvent(NOTIFICATION_EVENTS.CALENDAR, this.onCalendarNotification.bind(this));
			this.onSubscribeToPushNotification(SUBSCRIPTION_EVENTS.CALENDAR);
		}

		onCalendarNotification()
		{
			if (!this.isActiveTab())
			{
				void this.makeTabActive();
			}
		}
	}

	module.exports = {
		CalendarNavigator,
	};
});
