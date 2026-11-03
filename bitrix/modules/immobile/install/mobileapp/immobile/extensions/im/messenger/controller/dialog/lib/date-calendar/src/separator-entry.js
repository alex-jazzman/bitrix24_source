/**
 * @module im/messenger/controller/dialog/lib/date-calendar/src/separator-entry
 */
jn.define('im/messenger/controller/dialog/lib/date-calendar/src/separator-entry', (require, exports, module) => {
	const { DateCode } = require('im/messenger/lib/date-navigation');

	/**
	 * Second entry point of the calendar: a tap on the date separator of the feed.
	 *
	 * The service separators `template-separator-unread` and `template-separator-marked` wear the
	 * same prefix as the date ones, so a row is recognized by the format of its date code and never
	 * by the prefix (`DateCode.fromSeparatorId`). That is what also leaves every other
	 * consumer of the tap untouched: they do not parse as a day.
	 *
	 * @class DateCalendarSeparatorEntry
	 */
	class DateCalendarSeparatorEntry
	{
		#openCalendar;

		/**
		 * @param {DateCalendarSeparatorEntryOptions} options
		 */
		constructor({ openCalendar })
		{
			this.#openCalendar = openCalendar;
		}

		/**
		 * Handler of `messageTap` of the feed.
		 *
		 * @param {number} index
		 * @param {{ id: string|number }} [message]
		 */
		onMessageTap = (index, message) => {
			const day = DateCode.fromSeparatorId(message?.id);
			if (day === null)
			{
				return;
			}

			this.#openCalendar(day);
		};
	}

	module.exports = { DateCalendarSeparatorEntry };
});
