/**
 * @module layout/ui/field-filter/filter/src/saved-filters/parser
 */
jn.define('layout/ui/field-filter/filter/src/saved-filters/parser', (require, exports, module) => {
	const { Type } = require('type');
	const { isTruthyFlag } = require('utils/type');
	const { PseudoPreset } = require('layout/ui/field-filter/filter/src/enums/pseudo-preset');

	/**
	 * A pseudo preset as the current or default pointer means "no preset selected".
	 *
	 * @param {unknown} value
	 * @return {string|null}
	 */
	const parsePresetPointer = (value) => {
		if (!Type.isStringFilled(value) || PseudoPreset.isDefined(value))
		{
			return null;
		}

		return value;
	};

	/**
	 * @param {unknown} raw
	 * @return {SavedFilter|null} null for anything that must not reach the strip
	 */
	const parseSavedFilter = (raw) => {
		const id = Type.isStringFilled(raw?.id) ? raw.id : null;

		if (id === null || PseudoPreset.isDefined(id))
		{
			return null;
		}

		return {
			id,
			name: Type.isStringFilled(raw.name) ? raw.name : id,
			fields: Type.isPlainObject(raw.fields) ? raw.fields : {},
			rows: Type.isArray(raw.rows) ? raw.rows.filter((row) => Type.isStringFilled(row)) : [],
			pinned: isTruthyFlag(raw.pinned),
			forAll: isTruthyFlag(raw.forAll),
		};
	};

	/**
	 * @param {unknown} data payload of `getSavedFilters` (CONTRACT-API-02)
	 * @return {SavedFiltersData}
	 */
	const parseSavedFiltersData = (data) => {
		const rawPresets = Type.isArray(data?.presets) ? data.presets : [];

		return {
			presets: rawPresets
				.map((preset) => parseSavedFilter(preset))
				.filter((preset) => preset !== null),
			currentPresetId: parsePresetPointer(data?.currentPresetId),
			defaultPresetId: parsePresetPointer(data?.defaultPresetId),
			// one right per list and not per preset: the server weighs the same operation of the portal
			// for every one of them (SavedFilterStorage::changeForAll)
			canEditForAll: isTruthyFlag(data?.canEditForAll),
		};
	};

	/**
	 * Reads the runAction envelope. The error code is returned as it came: turning it into
	 * a phrase is a decision of the caller, not of the parser.
	 *
	 * @param {unknown} response
	 * @return {ParsedResponse}
	 */
	const parseResponse = (response) => {
		const errors = Type.isArrayFilled(response?.errors) ? response.errors : [];

		if (response?.status === 'success' && errors.length === 0)
		{
			return { success: true, data: response.data ?? null, code: null };
		}

		return {
			success: false,
			data: null,
			code: Type.isStringFilled(errors[0]?.code) ? errors[0].code : null,
		};
	};

	module.exports = {
		parsePresetPointer,
		parseSavedFilter,
		parseSavedFiltersData,
		parseResponse,
	};
});
