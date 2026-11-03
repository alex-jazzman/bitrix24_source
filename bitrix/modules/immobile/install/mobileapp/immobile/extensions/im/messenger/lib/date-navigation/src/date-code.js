/**
 * @module im/messenger/lib/date-navigation/src/date-code
 */
jn.define('im/messenger/lib/date-navigation/src/date-code', (require, exports, module) => {
	const { MessageIdType } = require('im/messenger/const');

	const SEPARATOR_PREFIX = `${MessageIdType.templateSeparatorDate}-`;

	/**
	 * The unread and the marked separators wear the very same prefix, so a third service separator
	 * must not turn into a date silently: the known ones are named here and not guessed by format.
	 */
	const SERVICE_CODES = new Set(
		[MessageIdType.templateSeparatorUnread, MessageIdType.templateSeparatorMarked]
			.map((separatorId) => separatorId.slice(SEPARATOR_PREFIX.length)),
	);

	/** `Y-m-d` of the server: the month and the date are always padded to two digits. */
	const SERVER_DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

	/** Code of the feed: the month is numbered from zero and nothing is padded at all. */
	const DATE_CODE_PATTERN = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;

	const pad = (value) => `0${value}`.slice(-2);

	/**
	 * A part of the code that carries a leading zero is a part of a server date, not of a code: the
	 * feed pads nothing, so `2026-02-19` read as a code would silently mean March.
	 *
	 * @param {string} part
	 * @return {number|null}
	 */
	const toUnpaddedNumber = (part) => {
		const value = Number(part);

		return String(value) === part ? value : null;
	};

	/**
	 * @param {number} year
	 * @param {number} monthIndex
	 * @param {number} date
	 * @return {boolean}
	 */
	const isDayOfCalendar = (year, monthIndex, date) => {
		const day = new Date(year, monthIndex, date);

		// a month out of range and a date the month has not got both roll over into another day
		return day.getFullYear() === year && day.getMonth() === monthIndex && day.getDate() === date;
	};

	/**
	 * The day of the server and the code of the feed are not the same string, and telling them apart
	 * is the whole point of this module: 19 March 2026 is `2026-03-19` for the server and `2026-2-19`
	 * for the feed, because the feed numbers the months from zero and pads nothing.
	 *
	 * Both sides of the feature read the conversion from here - the highlight of the separator after
	 * a jump and the calendar opened by a tap on that same separator.
	 *
	 * @class DateCode
	 */
	class DateCode
	{
		/**
		 * @param {DateNavigationDay} day - `Y-m-d` as the server speaks it
		 * @return {string|null} code of the feed; null when the day is not a day
		 */
		static fromServerDay(day)
		{
			const parts = SERVER_DAY_PATTERN.exec(String(day ?? ''));
			if (!parts)
			{
				return null;
			}

			const [, year, month, date] = parts;
			const monthIndex = Number(month) - 1;

			if (!isDayOfCalendar(Number(year), monthIndex, Number(date)))
			{
				return null;
			}

			return `${year}-${monthIndex}-${Number(date)}`;
		}

		/**
		 * @param {string} code - code of the feed
		 * @return {DateNavigationDay|null} `Y-m-d` for the server; null when the code is not a code
		 */
		static toServerDay(code)
		{
			const parts = DATE_CODE_PATTERN.exec(String(code ?? ''));
			if (!parts)
			{
				return null;
			}

			const [, year, month, date] = parts;
			const monthIndex = toUnpaddedNumber(month);
			const dateOfMonth = toUnpaddedNumber(date);

			if (monthIndex === null || dateOfMonth === null || !isDayOfCalendar(Number(year), monthIndex, dateOfMonth))
			{
				return null;
			}

			return `${year}-${pad(monthIndex + 1)}-${pad(dateOfMonth)}`;
		}

		/**
		 * @param {DateNavigationDay} day
		 * @return {string|null} id of the date separator row of the feed
		 */
		static toSeparatorId(day)
		{
			const code = DateCode.fromServerDay(day);

			return code === null ? null : `${SEPARATOR_PREFIX}${code}`;
		}

		/**
		 * A date separator is told by the format of its code and never by the prefix alone.
		 *
		 * @param {string|number} separatorId
		 * @return {DateNavigationDay|null} the day of the separator; null for anything else
		 */
		static fromSeparatorId(separatorId)
		{
			const id = String(separatorId ?? '');
			if (!id.startsWith(SEPARATOR_PREFIX))
			{
				return null;
			}

			const code = id.slice(SEPARATOR_PREFIX.length);

			return SERVICE_CODES.has(code) ? null : DateCode.toServerDay(code);
		}
	}

	module.exports = { DateCode };
});
