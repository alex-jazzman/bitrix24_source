/**
 * @module layout/ui/field-filter/values/src/date-preset-extras
 */
jn.define('layout/ui/field-filter/values/src/date-preset-extras', (require, exports, module) => {
	const { Type } = require('type');
	const { FieldSuffix } = require('layout/ui/field-filter/values/src/enums/field-suffix');

	/**
	 * A number a period is counted from. Named after the key it is written into, so the value of the
	 * field, the request built out of it and the control filling it in all say one word.
	 * @type {Readonly<Record<string, string>>}
	 */
	const DateExtra = Object.freeze({
		DAYS: 'days',
		MONTH: 'month',
		QUARTER: 'quarter',
		YEAR: 'year',
	});

	/**
	 * Presets of the web filter that carry no boundaries of their own and are counted from a number
	 * instead (main UI\Filter\DateType).
	 * @type {Readonly<Record<string, string>>}
	 */
	const CountedDatePreset = Object.freeze({
		PREV_DAYS: 'PREV_DAYS',
		NEXT_DAYS: 'NEXT_DAYS',
		MONTH: 'MONTH',
		QUARTER: 'QUARTER',
		YEAR: 'YEAR',
	});

	/**
	 * What each of them needs beyond its own name, in the order the web filter puts the controls in.
	 * A preset absent here needs nothing: its boundaries are counted from today.
	 *
	 * `Options::calcDates()` builds no boundaries without these numbers, and a date field left with
	 * no boundaries is dropped from the filter entirely - so they are part of the value, not a
	 * decoration of the control.
	 * @type {Readonly<Record<string, string[]>>}
	 */
	const PRESET_EXTRAS = Object.freeze({
		[CountedDatePreset.PREV_DAYS]: [DateExtra.DAYS],
		[CountedDatePreset.NEXT_DAYS]: [DateExtra.DAYS],
		[CountedDatePreset.MONTH]: [DateExtra.MONTH, DateExtra.YEAR],
		[CountedDatePreset.QUARTER]: [DateExtra.QUARTER, DateExtra.YEAR],
		[CountedDatePreset.YEAR]: [DateExtra.YEAR],
	});

	const EXTRA_SUFFIX = Object.freeze({
		[DateExtra.DAYS]: FieldSuffix.DAYS.getValue(),
		[DateExtra.MONTH]: FieldSuffix.MONTH.getValue(),
		[DateExtra.QUARTER]: FieldSuffix.QUARTER.getValue(),
		[DateExtra.YEAR]: FieldSuffix.YEAR.getValue(),
	});

	/** One array for every preset that needs nothing: the answer is read, never written into. */
	const NO_EXTRAS = Object.freeze([]);

	/**
	 * @param {?string} preset
	 * @return {string[]} empty for a period counted from today alone
	 */
	const getPresetExtras = (preset) => (
		Type.isStringFilled(preset) ? (PRESET_EXTRAS[preset] ?? NO_EXTRAS) : NO_EXTRAS
	);

	/**
	 * @param {?string} preset
	 * @return {boolean}
	 */
	const hasPresetExtras = (preset) => getPresetExtras(preset).length > 0;

	/**
	 * @param {string} extra
	 * @return {string} empty for a number the filter has no such thing as
	 */
	const getExtraSuffix = (extra) => EXTRA_SUFFIX[extra] ?? '';

	/**
	 * The number as a number. The storage answers with text - a preset saved by the web keeps `_days`
	 * as a string - so a numeric string is a number here too.
	 *
	 * @param {*} value
	 * @return {?number} null for anything that is not a number
	 */
	const toExtraNumber = (value) => {
		if (Type.isNumber(value))
		{
			return Number.isFinite(value) ? value : null;
		}

		if (Type.isStringFilled(value))
		{
			const number = Number(value);

			return Number.isFinite(number) ? number : null;
		}

		return null;
	};

	/**
	 * Whether the web filter can count a period from the number given. Days are counted from today,
	 * so a period of no days is a period all the same; a month, a quarter and a year are ordinals,
	 * and a zero there is what the web reads as "not given" (`!empty()`).
	 *
	 * @param {string} extra
	 * @param {*} value
	 * @return {boolean}
	 */
	const isExtraFilled = (extra, value) => {
		const number = toExtraNumber(value);

		if (number === null)
		{
			return false;
		}

		return extra === DateExtra.DAYS ? number >= 0 : number > 0;
	};

	/**
	 * Whether the value carries every number its period is counted from.
	 *
	 * @param {DateValue} value
	 * @return {boolean}
	 */
	const hasFilledExtras = (value) => {
		if (!Type.isPlainObject(value))
		{
			return false;
		}

		return getPresetExtras(value.preset).every((extra) => isExtraFilled(extra, value[extra]));
	};

	module.exports = {
		DateExtra,
		CountedDatePreset,
		getPresetExtras,
		hasPresetExtras,
		getExtraSuffix,
		toExtraNumber,
		isExtraFilled,
		hasFilledExtras,
	};
});
