/**
 * @module layout/ui/field-filter/filter/src/fields/controls/date-units
 */
jn.define('layout/ui/field-filter/filter/src/fields/controls/date-units', (require, exports, module) => {
	const { Type } = require('type');
	const { Moment } = require('utils/date');

	/**
	 * A boundary of a period is a millisecond timestamp everywhere in the filter - the value of the
	 * field, the request it is written into and the value read back from the storage all speak that.
	 * `DateTimeInput` speaks seconds, both in what it draws and in what its calendar gives back, so
	 * the two units meet here and nowhere else.
	 *
	 * A value that is not a moment (a date already written by the site) is passed through: converting
	 * it would lose it.
	 *
	 * @param {?number|string} value milliseconds
	 * @return {?number|string} seconds
	 */
	const toSeconds = (value) => (Type.isNumber(value) ? new Moment(value).timestamp : value);

	/**
	 * @param {?number|string} value seconds
	 * @return {?number|string} milliseconds
	 */
	const toMilliseconds = (value) => (
		Type.isNumber(value) ? Moment.createFromTimestamp(value).date.getTime() : value
	);

	module.exports = { toSeconds, toMilliseconds };
});
