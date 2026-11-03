/**
 * @module im/messenger/controller/dialog/lib/date-calendar/src/disabled-days
 */
jn.define('im/messenger/controller/dialog/lib/date-calendar/src/disabled-days', (require, exports, module) => {
	const { Color } = require('tokens');
	const { DateNavigationTimezone } = require('im/messenger/lib/date-navigation');

	const MILLISECONDS_IN_DAY = 86_400_000;

	/**
	 * Snapshot of the days the calendar must not let pick.
	 *
	 * Only a day KNOWN to be unavailable gets into it. The future is known without the network, the
	 * ends of the history from the first answer of the server, and everything else solely from the
	 * markup of a loaded month: a snapshot built from "everything not marked yet" would black out
	 * the whole calendar while offline, the native ban would eat the tap before our code, and the
	 * user would see neither the error nor the offer to retry - a refusal indistinguishable from
	 * working software.
	 *
	 * @class DisabledDays
	 */
	class DisabledDays
	{
		/**
		 * @param {Date} visibleMonth - any day of the month the calendar shows
		 * @param {IDateNavigationMarkup} markup
		 * @param {Date} [today]
		 * @return {DisabledDate[]}
		 */
		static buildSnapshot(visibleMonth, markup, today = new Date())
		{
			const todayDay = DateNavigationTimezone.toServerDay(today);
			const { firstAvailableDate, lastAvailableDate, boundariesKnown } = markup.getHistoryBoundaries();
			// the snapshot spans about three months, and the platform is the same for every day of it
			const platform = Application.getPlatform();

			return DisabledDays.getVisibleWindow(visibleMonth)
				.filter((date) => {
					const day = DateNavigationTimezone.toServerDay(date);

					// `Y-m-d` is zero padded, so comparing the strings compares the days
					if (day > todayDay)
					{
						return true;
					}

					// `CalendarView` takes no minimum and no maximum date of its own, so both ends of
					// the history are held by the snapshot alone - and held before the month of the
					// day is known, or a day outside the history would stay tappable until its own
					// month is answered. Unknown boundaries forbid nothing: until the first answer
					// arrives the calendar must not lock itself, offline included.
					if (boundariesKnown && firstAvailableDate !== null && day < firstAvailableDate)
					{
						return true;
					}

					if (boundariesKnown && lastAvailableDate !== null && day > lastAvailableDate)
					{
						return true;
					}

					if (!markup.isMonthLoaded(DateNavigationTimezone.toServerMonth(date)))
					{
						return false;
					}

					return !markup.isDayActive(day);
				})
				.map((date) => {
					const disabledDate = {
						timestamp: DateNavigationTimezone.toComponentTimestamp('setDisabledDates', date, platform),
					};

					// the contract puts the disabled state above `today`, so `textStyle.today` of the
					// widget never reaches a day of the snapshot - and today gets into it on any day
					// the chat has no message of its own. The accent is repeated here to keep the
					// current day recognizable; the day itself stays unpickable
					if (DateNavigationTimezone.toServerDay(date) === todayDay)
					{
						disabledDate.textColor = Color.accentMainPrimary.toHex();
					}

					return disabledDate;
				});
		}

		/**
		 * The shown month and its neighbours - what the component can put on screen at once. The
		 * contract names no limit for the snapshot and the native side converts the whole array
		 * before any check, so the limit is kept here.
		 *
		 * @param {Date} visibleMonth
		 * @return {Date[]}
		 */
		static getVisibleWindow(visibleMonth)
		{
			const year = visibleMonth.getFullYear();
			const month = visibleMonth.getMonth();
			const firstDay = new Date(year, month - 1, 1);
			const lastDay = new Date(year, month + 2, 0);

			// the day of a daylight saving change is an hour shorter, and at the edge of a day an
			// hour is a whole day, so days are built from calendar parts and the width is rounded
			const dayCount = Math.round((lastDay.getTime() - firstDay.getTime()) / MILLISECONDS_IN_DAY) + 1;

			return Array.from({ length: dayCount }, (item, index) => new Date(year, month - 1, index + 1));
		}
	}

	module.exports = { DisabledDays };
});
