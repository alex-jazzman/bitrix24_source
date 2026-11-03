/**
 * @module layout/ui/field-filter/values
 */
jn.define('layout/ui/field-filter/values', (require, exports, module) => {
	const { SEARCH_FIELD_ID, NO_PRESET_ID } = require('layout/ui/field-filter/values/src/web-keys');
	const { FieldType } = require('layout/ui/field-filter/values/src/enums/field-type');
	const { BooleanValue } = require('layout/ui/field-filter/values/src/enums/boolean-value');
	const { NumberOperator } = require('layout/ui/field-filter/values/src/enums/number-operator');
	const {
		DateBoundaryPreset,
	} = require('layout/ui/field-filter/values/src/enums/date-boundary-preset');
	const {
		AdditionalFilter,
	} = require('layout/ui/field-filter/values/src/enums/additional-filter');
	const {
		readAdditional,
		stripAdditional,
		withAdditional,
	} = require('layout/ui/field-filter/values/src/additional-value');
	const {
		DateExtra,
		CountedDatePreset,
		getPresetExtras,
		hasPresetExtras,
		toExtraNumber,
		hasFilledExtras,
	} = require('layout/ui/field-filter/values/src/date-preset-extras');
	const {
		isFieldActive,
		serializeField,
		serializeValues,
		deserializeField,
		deserializeValues,
		buildRows,
	} = require('layout/ui/field-filter/values/src/serializer');

	/**
	 * The values of the filter and the words they are written in. The payload of a list request, a
	 * cached list matched offline and a task inserted optimistically all speak the serialized shape
	 * (CONTRACT-API-01) with no form on the screen - the form is the one that needs the drawer, not
	 * the values.
	 *
	 * Kept apart from `layout/ui/field-filter/entry` so that a screen asking only whether the filter
	 * is on, or only for the icon of a row, does not load the serializer and the date arithmetic
	 * behind it.
	 */
	module.exports = {
		SEARCH_FIELD_ID,
		NO_PRESET_ID,
		FieldType,
		BooleanValue,
		NumberOperator,
		DateBoundaryPreset,
		AdditionalFilter,
		readAdditional,
		stripAdditional,
		withAdditional,
		DateExtra,
		CountedDatePreset,
		getPresetExtras,
		hasPresetExtras,
		toExtraNumber,
		hasFilledExtras,
		isFieldActive,
		serializeField,
		serializeValues,
		deserializeField,
		deserializeValues,
		buildRows,
	};
});
