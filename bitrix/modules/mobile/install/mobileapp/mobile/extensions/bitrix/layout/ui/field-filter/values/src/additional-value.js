/**
 * @module layout/ui/field-filter/values/src/additional-value
 */
jn.define('layout/ui/field-filter/values/src/additional-value', (require, exports, module) => {
	const { Type } = require('type');
	const { AdditionalFilter } = require('layout/ui/field-filter/values/src/enums/additional-filter');

	/**
	 * A condition on the presence of a value stands in the place of the value itself - the web filter
	 * replaces the control of the field with a tag saying so - and the form keeps it the same way: the
	 * value of a field under a condition is `{ additional, previous }` whatever the type of the field.
	 *
	 * `previous` is the value the field held before, kept for the way back: dropping the condition
	 * gives the field back with what was already chosen in it, the way the tag of the web gives the
	 * control back with its own value still in it.
	 *
	 * The number control is the one field that needs none of this: its comparison and bounds live in a
	 * value object of their own, so it writes the condition into that object next to them (NumberValue).
	 * `previous` is what tells the two apart - a number value never carries it.
	 *
	 * @param {FieldValue} value
	 * @return {?AdditionalFilter} null when the field is not under a condition
	 */
	const readAdditional = (value) => (
		Type.isPlainObject(value) && AdditionalFilter.isDefined(value.additional)
			? value.additional
			: null
	);

	/**
	 * The value of the field itself: what a picker of the field is opened with and what it is left
	 * with once the condition is dropped.
	 *
	 * @param {FieldValue} value
	 * @return {FieldValue}
	 */
	const stripAdditional = (value) => (
		Type.isPlainObject(value) && 'previous' in value ? value.previous : value
	);

	/**
	 * Puts the field under a condition, keeping what it held for the way back. Choosing another
	 * condition over an already chosen one keeps that same value: the conditions replace each other,
	 * not the value under them.
	 *
	 * @param {FieldValue} value
	 * @param {AdditionalFilter} additional
	 * @return {AdditionalValue}
	 */
	const withAdditional = (value, additional) => ({
		additional,
		previous: stripAdditional(value) ?? null,
	});

	module.exports = { readAdditional, stripAdditional, withAdditional };
});
