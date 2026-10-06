/**
 * @module calendar/background/notifications
 */
jn.define('calendar/background/notifications', (require, exports, module) => {
	const { CalendarTabOpenNotification } = require('calendar/background/notifications/tab-open');
	const { CalendarTabOpenFromMoreNotification } = require('calendar/background/notifications/tab-open-from-more');

	module.exports = () => {
		new CalendarTabOpenNotification();
		new CalendarTabOpenFromMoreNotification();
	};
});
