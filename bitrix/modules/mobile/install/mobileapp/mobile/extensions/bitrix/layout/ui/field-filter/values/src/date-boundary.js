/**
 * @module layout/ui/field-filter/values/src/date-boundary
 */
/* global dateFormatter */
jn.define('layout/ui/field-filter/values/src/date-boundary', (require, exports, module) => {
	const { Type } = require('type');

	/**
	 * A boundary of a period lives in two worlds. The picker of the form speaks timestamps, while the
	 * storage shared with the web keeps a date the way the site writes it - and the server reads the
	 * boundary with `MakeTimeStamp()`, which knows that format alone: a millisecond timestamp reaches
	 * it as a number it cannot parse, and the condition is dropped instead of narrowing the list.
	 *
	 * Both directions live here so the request and the form cannot drift apart: whatever is written
	 * is read back into the same moment.
	 */

	const DEFAULT_DATE_FORMAT = 'd.m.Y';
	const DEFAULT_DATETIME_FORMAT = 'd.m.Y H:i:s';
	const MS_IN_SECOND = 1000;

	const getFormat = (withTime) => {
		const formats = (typeof dateFormatter === 'undefined' ? null : dateFormatter.formats);

		if (withTime)
		{
			return formats?.FORMAT_DATETIME ?? DEFAULT_DATETIME_FORMAT;
		}

		return formats?.FORMAT_DATE ?? DEFAULT_DATE_FORMAT;
	};

	const pad = (value) => String(value).padStart(2, '0');

	/**
	 * The boundary written in the default format - the one `getFormat()` falls back to - without asking
	 * the formatter of the app for the culture of the portal.
	 *
	 * A boundary has to come out as a date whether the formatter is at hand or not: the server reads it
	 * with `MakeTimeStamp()`, a timestamp left as a number reaches it as something it cannot parse, and
	 * the condition is then dropped instead of narrowing the list.
	 *
	 * @param {number} value timestamp in milliseconds
	 * @param {boolean} [withTime]
	 * @return {string}
	 */
	const writeDefaultDateBoundary = (value, withTime = false) => {
		const date = new Date(value);
		const day = `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;

		if (!withTime)
		{
			return day;
		}

		return `${day} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
	};

	/**
	 * The boundary as the storage keeps it. A value that is already a date of the site is passed
	 * through: a form restored from the storage must write back what it read.
	 *
	 * @param {number|string|null} value timestamp in milliseconds, or an already written date
	 * @param {boolean} [withTime] the field carries a moment and not a day
	 * @return {string|*}
	 */
	const writeDateBoundary = (value, withTime = false) => {
		if (!Type.isNumber(value))
		{
			return value;
		}

		// reading a boundary answers without the formatter (getFormat, readMonthName), so writing one
		// answers too: a throw here would take down the form of a screen that reads the filter, and the
		// default format is the same one the reading falls back to
		if (typeof dateFormatter === 'undefined')
		{
			return writeDefaultDateBoundary(value, withTime);
		}

		return dateFormatter.get(Math.floor(value / MS_IN_SECOND), getFormat(withTime));
	};

	/**
	 * What each token of a php date format holds, as `Date::convertFormatToPhp()` writes them out of a
	 * culture: two spellings of everything (padded and not), twelve hours next to twenty-four, and a
	 * month that may be a word. A letter the list does not name is a separator, and so is any letter
	 * the format escapes with a backslash.
	 * @type {Readonly<Record<string, string>>}
	 */
	const TOKEN_PART = Object.freeze({
		Y: 'year',
		y: 'shortYear',
		m: 'month',
		n: 'month',
		F: 'monthName',
		M: 'shortMonthName',
		d: 'day',
		j: 'day',
		H: 'hours',
		G: 'hours',
		h: 'hours12',
		g: 'hours12',
		i: 'minutes',
		s: 'seconds',
		a: 'meridiem',
		A: 'meridiem',
	});

	/**
	 * The pieces a written boundary is made of: everything between the separators a culture uses. The
	 * same division the server makes in `ParseDateTime()`, and for the same reason - the parts are then
	 * paired with the tokens of the format in the order both were written.
	 * @type {RegExp}
	 */
	const VALUE_PART = /[^\s,./:\\-]+/g;

	const CENTURY = 2000;
	const NOON = 12;
	const MONTHS_IN_YEAR = 12;

	/**
	 * Tokens of the format in the order it writes them.
	 *
	 * @param {string} format
	 * @return {string[]}
	 */
	const readFormatTokens = (format) => {
		const tokens = [];

		for (let index = 0; index < format.length; index++)
		{
			// a php format escapes a letter that stands for itself, and the letter after it is text
			if (format[index] === '\\')
			{
				index++;
				continue;
			}

			if (TOKEN_PART[format[index]] !== undefined)
			{
				tokens.push(format[index]);
			}
		}

		return tokens;
	};

	/** @type {Object<string, string[]>} months as the site words them, asked for once per token */
	const monthNames = {};

	/**
	 * The words the formatter itself writes a month with: a culture may keep the month of a date as a
	 * word, and wording the twelve of them a second time here would drift away from the portal.
	 *
	 * @param {string} token `F` for the full name, `M` for the short one
	 * @return {string[]} lowercase, January first
	 */
	const getMonthNames = (token) => {
		monthNames[token] ??= Array.from({ length: MONTHS_IN_YEAR }).map((item, index) => String(
			dateFormatter.get(Math.floor(new Date(CENTURY, index, 15).getTime() / MS_IN_SECOND), token),
		).toLowerCase());

		return monthNames[token];
	};

	/**
	 * @param {string} token
	 * @param {string} written
	 * @return {?number} 1..12, null when no month of the site is worded that way
	 */
	const readMonthName = (token, written) => {
		if (typeof dateFormatter === 'undefined')
		{
			return null;
		}

		const index = getMonthNames(token).indexOf(written.toLowerCase());

		return index === -1 ? null : index + 1;
	};

	const toNumber = (written) => (
		written !== undefined && /^\d+$/.test(written) ? Number(written) : null
	);

	/**
	 * The hour of the day out of the two spellings a culture writes it in. A marker next to a
	 * twelve-hour clock moves the afternoon where it belongs and midnight back to zero, exactly as
	 * `MakeTimeStamp()` does with the `T` of the culture.
	 *
	 * @param {Object<string, string>} parts
	 * @return {number}
	 */
	const readHours = (parts) => {
		const hours24 = toNumber(parts.hours);
		if (hours24 !== null)
		{
			return hours24;
		}

		const hours = toNumber(parts.hours12);
		if (hours === null)
		{
			return 0;
		}

		const isAfternoon = String(parts.meridiem ?? '').toLowerCase() === 'pm';

		if (isAfternoon)
		{
			return hours < NOON ? hours + NOON : hours;
		}

		return hours === NOON ? 0 : hours;
	};

	/**
	 * @param {Object<string, string>} parts
	 * @return {?number} 1..12, null when the value carries no month the format can read
	 */
	const readMonth = (parts) => {
		const month = toNumber(parts.month);
		if (month !== null)
		{
			return month;
		}

		if (parts.monthName !== undefined)
		{
			return readMonthName('F', parts.monthName);
		}

		if (parts.shortMonthName !== undefined)
		{
			return readMonthName('M', parts.shortMonthName);
		}

		return null;
	};

	/**
	 * @param {Object<string, string>} parts
	 * @return {?number}
	 */
	const readYear = (parts) => {
		const year = toNumber(parts.year);
		if (year !== null)
		{
			return year;
		}

		const shortYear = toNumber(parts.shortYear);

		return shortYear === null ? null : CENTURY + shortYear;
	};

	/**
	 * The moment a boundary written in the given format stands for. The parts are paired with the
	 * tokens of the format in the order both were written - the way the server pairs them in
	 * `ParseDateTime()` - so a portal writing `m/d/Y h:i:s a` is read the same way it is written.
	 *
	 * Kept apart from the boundary of the site so that it can be asked about the culture of any portal
	 * and not of the one it happens to run on.
	 *
	 * @param {string} value
	 * @param {string} format php date format
	 * @return {?number} timestamp in milliseconds, null when the format finds no date in the value
	 */
	const parseDateBoundary = (value, format) => {
		const tokens = readFormatTokens(String(format));
		const written = String(value).match(VALUE_PART) ?? [];

		const parts = {};
		tokens.forEach((token, index) => {
			if (written[index] !== undefined)
			{
				parts[TOKEN_PART[token]] = written[index];
			}
		});

		const year = readYear(parts);
		const month = readMonth(parts);
		const day = toNumber(parts.day);

		if (year === null || month === null || day === null)
		{
			return null;
		}

		return new Date(
			year,
			month - 1,
			day,
			readHours(parts),
			toNumber(parts.minutes) ?? 0,
			toNumber(parts.seconds) ?? 0,
		).getTime();
	};

	/**
	 * Inverse of writeDateBoundary: the moment the picker of the form works with.
	 *
	 * Which of the two formats of the site to read it by is asked of the value itself and not of the
	 * field: the storage is shared with the web, and a boundary of a datetime field is kept there with
	 * a time by one screen and without it by another.
	 *
	 * @param {string|number|null} value
	 * @return {?number} timestamp in milliseconds, null when the boundary carries no date
	 */
	const readDateBoundary = (value) => {
		if (Type.isNumber(value))
		{
			return value;
		}

		if (!Type.isStringFilled(value))
		{
			return null;
		}

		const dateFormat = getFormat(false);
		const carriesTime = (value.match(VALUE_PART) ?? []).length > readFormatTokens(dateFormat).length;

		return parseDateBoundary(value, carriesTime ? getFormat(true) : dateFormat);
	};

	module.exports = { writeDateBoundary, writeDefaultDateBoundary, readDateBoundary, parseDateBoundary };
});
