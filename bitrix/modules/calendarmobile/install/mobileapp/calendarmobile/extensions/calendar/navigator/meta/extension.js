/**
 * @module calendar/navigator/meta
 */
jn.define('calendar/navigator/meta', (require, exports, module) => {
	const NOTIFICATION_EVENTS = {
		CALENDAR: 'PushNotifications::CalendarEventsOpen',
	};

	const SUBSCRIPTION_EVENTS = {
		CALENDAR: 'PushNotifications::SubscribeToCalendarEventsOpen',
	};

	module.exports = {
		NOTIFICATION_EVENTS,
		SUBSCRIPTION_EVENTS,
	};
});
