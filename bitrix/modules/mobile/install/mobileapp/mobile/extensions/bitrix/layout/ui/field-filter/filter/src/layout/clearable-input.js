/**
 * @module layout/ui/field-filter/filter/src/layout/clearable-input
 */
jn.define('layout/ui/field-filter/filter/src/layout/clearable-input', (require, exports, module) => {
	const { isFilledScalar } = require('utils/type');
	const { Icon } = require('ui-system/blocks/icon');

	/**
	 * The cross at the right edge of an input, offered while there is something to erase. Without it a
	 * text is cleared character by character, and a value taken from a screen of its own - a date, a
	 * number typed in behind a keyboard of digits - cannot be given back at all.
	 *
	 * "Something to erase" is what the serializer counts as a value, so a zero keeps the cross: it is a
	 * condition of the filter like any other, and only an empty input drops the field out of it.
	 *
	 * @param {*} value
	 * @param {Function} onClear
	 * @return {Object} props to spread into the input
	 */
	const getClearProps = (value, onClear) => ({
		rightContent: isFilledScalar(value) ? Icon.CROSS : null,
		onClickRightContent: onClear,
	});

	module.exports = { getClearProps };
});
