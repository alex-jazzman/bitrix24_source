/**
 * @module im/messenger/lib/date-navigation/src/timezone
 */
jn.define('im/messenger/lib/date-navigation/src/timezone', (require, exports, module) => {
	const MILLISECONDS_IN_SECOND = 1000;
	const SECONDS_IN_MINUTE = 60;
	const MONTH_KEY_LENGTH = 'YYYY-MM'.length;
	const MIDDAY_HOUR = 12;
	const IOS_PLATFORM = 'ios';

	/**
	 * How the calendar component reads a timestamp.
	 *
	 * Android builds every date with `Calendar.getInstance()`, so a timestamp names the day it falls
	 * into in the timezone of the device. iOS keeps an ISO-8601 calendar pinned to UTC
	 * (`CalendarView+Style.swift`), so the very same day is addressed by its UTC midnight.
	 */
	const DayConvention = Object.freeze({
		device: 'device',
		utc: 'utc',
	});

	const Direction = Object.freeze({
		toComponent: 'toComponent',
		fromComponent: 'fromComponent',
	});

	/**
	 * The convention belongs to a method and not to the component: it is written out per method so
	 * that a platform diverging on a single method stays one row here instead of a special case at
	 * the place of the call.
	 */
	const TIMEZONE_CONVENTION = Object.freeze({
		setDisabledDates: Object.freeze({
			direction: Direction.toComponent,
			android: DayConvention.device,
			ios: DayConvention.utc,
		}),
		setDate: Object.freeze({
			direction: Direction.toComponent,
			android: DayConvention.device,
			ios: DayConvention.utc,
		}),
		initialDate: Object.freeze({
			direction: Direction.toComponent,
			android: DayConvention.device,
			ios: DayConvention.utc,
		}),
		onDateSelected: Object.freeze({
			direction: Direction.fromComponent,
			android: DayConvention.device,
			ios: DayConvention.utc,
		}),
		onMonthSwitched: Object.freeze({
			direction: Direction.fromComponent,
			android: DayConvention.device,
			ios: DayConvention.utc,
		}),
	});

	const getConvention = (method, direction, platform) => {
		const row = TIMEZONE_CONVENTION[method];
		if (!row)
		{
			throw new Error(`DateNavigationTimezone: ${method} has no timezone convention`);
		}

		if (row.direction !== direction)
		{
			throw new Error(`DateNavigationTimezone: ${method} is a ${row.direction} method`);
		}

		return platform === IOS_PLATFORM ? row.ios : row.android;
	};

	/**
	 * Whole time handling of the date navigation, both ways.
	 *
	 * A day is converted through its calendar parts and never through an offset taken at the moment
	 * of the call: the offset of `new Date()` applied to another day misses by an hour across a
	 * daylight saving change, and at the boundary of a day an hour is a whole day.
	 */
	class DateNavigationTimezone
	{
		/**
		 * @param {string} method - key of TIMEZONE_CONVENTION
		 * @param {Date} date - any moment of the day, in the timezone of the user
		 * @param {string} [platform] - defaults to the platform of the application
		 * @return {number} Unix seconds
		 */
		static toComponentTimestamp(method, date, platform = Application.getPlatform())
		{
			const convention = getConvention(method, Direction.toComponent, platform);
			const year = date.getFullYear();
			const month = date.getMonth();
			const day = date.getDate();

			const milliseconds = convention === DayConvention.utc
				? Date.UTC(year, month, day)
				: new Date(year, month, day).getTime();

			return Math.round(milliseconds / MILLISECONDS_IN_SECOND);
		}

		/**
		 * @param {string} method - key of TIMEZONE_CONVENTION
		 * @param {number} timestamp - Unix seconds as the component reports them
		 * @param {string} [platform] - defaults to the platform of the application
		 * @return {Date} start of the day in the timezone of the user
		 */
		static fromComponentTimestamp(method, timestamp, platform = Application.getPlatform())
		{
			const convention = getConvention(method, Direction.fromComponent, platform);
			const moment = new Date(timestamp * MILLISECONDS_IN_SECOND);

			return convention === DayConvention.utc
				? new Date(moment.getUTCFullYear(), moment.getUTCMonth(), moment.getUTCDate())
				: new Date(moment.getFullYear(), moment.getMonth(), moment.getDate());
		}

		/**
		 * The server has no idea of the user day and cuts the history by the offset this client sends
		 * alongside the date.
		 *
		 * @param {Date} date
		 * @return {string} `Y-m-d` of the day in the timezone of the user
		 */
		static toServerDay(date)
		{
			const year = date.getFullYear();
			const month = `0${date.getMonth() + 1}`.slice(-2);
			const day = `0${date.getDate()}`.slice(-2);

			return `${year}-${month}-${day}`;
		}

		/**
		 * The month a day belongs to - the key the markup of the calendar is kept and asked by.
		 *
		 * @param {Date} date
		 * @return {DateNavigationMonth} `Y-m` of the day in the timezone of the user
		 */
		static toServerMonth(date)
		{
			return DateNavigationTimezone.toServerDay(date).slice(0, MONTH_KEY_LENGTH);
		}

		/**
		 * @param {string} day - `Y-m-d`
		 * @return {Date} the same day at midnight in the timezone of the user
		 */
		static fromServerDay(day)
		{
			const [year, month, date] = String(day).split('-').map((part) => Number.parseInt(part, 10));

			return new Date(year, month - 1, date);
		}

		/**
		 * @param {Date} [date] - the day the offset is asked for; across a daylight saving change the
		 * offset of the shown month differs from the offset of today
		 * @return {number} seconds east of UTC, the sign the server expects
		 */
		static getServerOffset(date = new Date())
		{
			const offset = -date.getTimezoneOffset() * SECONDS_IN_MINUTE;

			// in UTC the product is -0, and -0 is not 0 under Object.is
			return offset === 0 ? 0 : offset;
		}

		/**
		 * The offset of a day is read at its midday and not at its midnight: a zone switching at
		 * midnight has no local 00:00 that day at all, and the engine answers such a moment by the
		 * offset of the other side of the switch.
		 *
		 * @param {DateNavigationDay} day - `Y-m-d`
		 * @return {number} seconds east of UTC, the sign the server expects
		 */
		static getServerOffsetForDay(day)
		{
			const midnight = DateNavigationTimezone.fromServerDay(day);
			const midday = new Date(midnight.getFullYear(), midnight.getMonth(), midnight.getDate(), MIDDAY_HOUR);

			return DateNavigationTimezone.getServerOffset(midday);
		}

		/**
		 * The timezone identifier of the device, when the application reports one. The field is
		 * served by the native side behind a feature flag and is absent altogether from the builds
		 * released before it, so having none is a normal answer and not a failure.
		 *
		 * @return {string|null}
		 */
		static getTimezoneId()
		{
			const timezoneId = typeof device === 'undefined' ? null : device?.timeZoneId;

			return typeof timezoneId === 'string' && timezoneId !== '' ? timezoneId : null;
		}

		/**
		 * How a request names the time its days are cut by. The identifier is sent whenever the
		 * device knows it: it carries the offset of every date of the request, while a single offset
		 * describes a whole window by one number and a window crossing a clock change has no such
		 * number. The offset stays for the builds reporting no identifier.
		 *
		 * The markup of a day and its resolution read this the same way on purpose - answered apart,
		 * a day marked active leads to a message the feed keeps under the neighbouring day.
		 *
		 * @param {DateNavigationDay} day - the day the offset is read for when there is no identifier
		 * @return {DateNavigationRequestTimezone}
		 */
		static getRequestTimezone(day)
		{
			const timezoneId = DateNavigationTimezone.getTimezoneId();

			return timezoneId === null
				? { timezoneOffset: DateNavigationTimezone.getServerOffsetForDay(day) }
				: { timezoneId }
			;
		}
	}

	module.exports = { DateNavigationTimezone };
});
