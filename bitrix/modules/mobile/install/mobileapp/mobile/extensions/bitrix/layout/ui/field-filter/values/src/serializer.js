/**
 * @module layout/ui/field-filter/values/src/serializer
 */
jn.define('layout/ui/field-filter/values/src/serializer', (require, exports, module) => {
	const { Type } = require('type');
	const { isFilledScalar } = require('utils/type');
	const { FieldType } = require('layout/ui/field-filter/values/src/enums/field-type');
	const { BooleanValue } = require('layout/ui/field-filter/values/src/enums/boolean-value');
	const { NumberOperator } = require('layout/ui/field-filter/values/src/enums/number-operator');
	const { DateBoundaryPreset } = require('layout/ui/field-filter/values/src/enums/date-boundary-preset');
	const {
		writeDateBoundary,
		readDateBoundary,
	} = require('layout/ui/field-filter/values/src/date-boundary');
	const { FieldSuffix } = require('layout/ui/field-filter/values/src/enums/field-suffix');
	const { AdditionalFilter } = require('layout/ui/field-filter/values/src/enums/additional-filter');
	const { readAdditional } = require('layout/ui/field-filter/values/src/additional-value');
	const {
		getPresetExtras,
		getExtraSuffix,
		toExtraNumber,
		isExtraFilled,
	} = require('layout/ui/field-filter/values/src/date-preset-extras');
	const { SEARCH_FIELD_ID } = require('layout/ui/field-filter/values/src/web-keys');

	/**
	 * What the web writes into an additional filter key; the key itself carries the condition, so
	 * the value only has to be there.
	 * @type {string}
	 */
	const ADDITIONAL_FILTER_FLAG = 'y';

	/**
	 * How the web says "no date chosen" (main UI\Filter\DateType::NONE). It stands on every date row
	 * of a preset the web saves - the CRM presets ship with `CLOSEDATE_datesel: 'NONE'` - and
	 * `Options::calcDates()` answers an empty filter for it, so it narrows nothing and is not a
	 * condition of the filter.
	 * @type {string}
	 */
	const NO_DATE_PRESET = 'NONE';

	const isBoundaryPreset = (preset) => DateBoundaryPreset.isDefined(preset);

	const isBooleanValue = (value) => BooleanValue.isDefined(value);

	/**
	 * A boolean field whose provider counts the flag in numbers, as the descriptor names it after the
	 * web control (`FieldAdapter::CHECKBOX` reads the same `valueType`).
	 * @type {string}
	 */
	const NUMERIC_VALUE_TYPE = 'numeric';

	/**
	 * The pair such a field travels in. The form keeps one vocabulary for every boolean - the words of
	 * `FilterDictionary.booleanValues` are keyed by Y/N - so the numbers are put on at the wire
	 * boundary alone.
	 * @type {Readonly<Record<string, string>>}
	 */
	const NUMERIC_BOOLEAN = Object.freeze({
		[BooleanValue.YES.getValue()]: '1',
		[BooleanValue.NO.getValue()]: '0',
	});

	const isNumericBoolean = (descriptor) => descriptor?.valueType === NUMERIC_VALUE_TYPE;

	/**
	 * @param {FieldDescriptor} descriptor
	 * @param {BooleanValue} value
	 * @return {string}
	 */
	const writeBoolean = (descriptor, value) => (
		isNumericBoolean(descriptor) ? NUMERIC_BOOLEAN[value] : value
	);

	/**
	 * Inverse of writeBoolean. The Y/N of the vocabulary is read whatever the field says: that is what
	 * a client which did not know the pair yet has already written into a stored preset.
	 *
	 * @param {FieldDescriptor} descriptor
	 * @param {*} raw
	 * @return {BooleanValue|null} null when the value belongs to neither pair
	 */
	const readBoolean = (descriptor, raw) => {
		if (isBooleanValue(raw))
		{
			return raw;
		}

		if (!isNumericBoolean(descriptor))
		{
			return null;
		}

		// a preset shipped with a module keeps such a flag as a number, the way it keeps list ids
		const written = Type.isNumber(raw) ? String(raw) : raw;

		return Object.keys(NUMERIC_BOOLEAN).find((value) => NUMERIC_BOOLEAN[value] === written) ?? null;
	};

	/**
	 * The boundaries of a range as the web filter writes them: `_from` and `_to` next to the field,
	 * and only the ones that carry a value - an empty boundary is an open end, not a condition. A
	 * range open at both ends is no range at all, and the field is left out of the filter entirely.
	 *
	 * @param {string} id
	 * @param {*} from
	 * @param {*} to
	 * @return {?SerializedFields} null when neither boundary carries a value
	 */
	const writeRange = (id, from, to) => {
		if (!isFilledScalar(from) && !isFilledScalar(to))
		{
			return null;
		}

		const range = {};

		if (isFilledScalar(from))
		{
			range[`${id}${FieldSuffix.FROM.getValue()}`] = from;
		}

		if (isFilledScalar(to))
		{
			range[`${id}${FieldSuffix.TO.getValue()}`] = to;
		}

		return range;
	};

	/**
	 * Inverse of writeRange: the boundaries the fields hold, under the names a value object gives
	 * them. Kept symmetrical on purpose - the request and the form have to read one range the same way.
	 *
	 * @param {string} id
	 * @param {SerializedFields} fields
	 * @return {?{from?: *, to?: *}} null when the field holds no boundary
	 */
	const readRange = (id, fields) => {
		const from = fields[`${id}${FieldSuffix.FROM.getValue()}`];
		const to = fields[`${id}${FieldSuffix.TO.getValue()}`];

		if (!isFilledScalar(from) && !isFilledScalar(to))
		{
			return null;
		}

		const range = {};

		if (isFilledScalar(from))
		{
			range.from = from;
		}

		if (isFilledScalar(to))
		{
			range.to = to;
		}

		return range;
	};

	/**
	 * Serializes a single field value into `tmpFields` fragments per ALG-01 (NORMATIVE).
	 * Returns an empty object when the value is inactive.
	 *
	 * @param {FieldDescriptor} descriptor
	 * @param {FieldValue} value
	 * @return {SerializedFields}
	 */
	const serializeField = (descriptor, value) => {
		if (!descriptor || !Type.isStringFilled(descriptor.id))
		{
			return {};
		}

		const { id, type, multiple, destination } = descriptor;

		// a condition on the presence of a value replaces the value of the field, not joins it, so it
		// is answered before the type of the field is looked at - every type wears it the same way
		const additional = readAdditional(value);
		if (additional !== null)
		{
			return serializeAdditional(id, additional);
		}

		switch (type)
		{
			case FieldType.STRING.getValue():
			case FieldType.FULLTEXT.getValue():
				return isFilledScalar(value) ? { [id]: value } : {};

			case FieldType.LIST.getValue():
				return serializeList(id, value, multiple);

			case FieldType.BOOLEAN.getValue():
				return isBooleanValue(value) ? { [id]: writeBoolean(descriptor, value) } : {};

			case FieldType.ENTITY_SELECTOR.getValue():
				return serializeEntity(id, value, multiple, destination);

			case FieldType.NUMBER.getValue():
				return serializeNumber(id, value);

			case FieldType.DATE.getValue():
				return serializeDate(descriptor, value);

			default:
				return {};
		}
	};

	/**
	 * @param {string} id
	 * @param {FieldValue} value
	 * @param {boolean} multiple
	 * @return {SerializedFields}
	 */
	const serializeList = (id, value, multiple) => {
		if (multiple)
		{
			return Type.isArrayFilled(value) ? { [id]: value } : {};
		}

		return isFilledScalar(value) ? { [id]: value } : {};
	};

	/**
	 * The selector control always keeps an array (single choice is enforced by
	 * allowMultipleSelection), while the web store holds a non-multiple dest field as a
	 * scalar - the wire shape follows the store, not the control.
	 *
	 * @param {string} id
	 * @param {FieldValue} value
	 * @param {boolean} multiple
	 * @return {SerializedFields}
	 */
	const serializeEntity = (id, value, multiple, destination = null) => {
		if (!Type.isArrayFilled(value))
		{
			return {};
		}

		if (Type.isStringFilled(destination))
		{
			return { [id]: writeDestination(destination, value) };
		}

		return { [id]: (multiple ? value : value[0]) };
	};

	/**
	 * The value of a field served by the selector of the previous generation: a map of destinations in
	 * JSON, the way `Crm\UI\Filter\EntityHandler::internalize()` reads it. A plain list of ids is
	 * dropped there together with the key, so such a field must be written this way or it narrows
	 * nothing.
	 *
	 * @param {string} destination
	 * @param {Array} ids
	 * @return {string}
	 */
	const writeDestination = (destination, ids) => JSON.stringify({ [destination]: ids });

	/**
	 * Inverse of writeDestination: the ids the picker of the form works with.
	 *
	 * @param {string} destination
	 * @param {*} raw
	 * @return {?Array}
	 */
	const readDestination = (destination, raw) => {
		const parts = (Type.isArray(raw) ? raw : [raw]);
		const ids = [];

		parts.forEach((part) => {
			if (!Type.isStringFilled(part))
			{
				return;
			}

			try
			{
				const parsed = JSON.parse(part);
				if (Type.isArrayFilled(parsed?.[destination]))
				{
					ids.push(...parsed[destination]);
				}
			}
			catch
			{
				// a value written by an older client, or by hand: nothing to restore from it
			}
		});

		return (ids.length > 0 ? ids : null);
	};

	/**
	 * A condition on the presence of a value: one key named after the condition itself, exactly as
	 * `BX.Filter.AdditionalFilter.getFilter()` writes it.
	 *
	 * @param {string} id
	 * @param {AdditionalFilter} additional
	 * @return {SerializedFields}
	 */
	const serializeAdditional = (id, additional) => {
		if (!AdditionalFilter.isDefined(additional))
		{
			return {};
		}

		return { [`${id}_${additional}`]: ADDITIONAL_FILTER_FLAG };
	};

	/**
	 * Inverse of serializeAdditional. Both conditions are mutually exclusive, so the first one
	 * present wins, the way `fetchAdditionalFilter()` resolves them in the web filter.
	 *
	 * @param {string} id
	 * @param {SerializedFields} fields
	 * @return {AdditionalFilter|null}
	 */
	const deserializeAdditional = (id, fields) => {
		if (!Type.isPlainObject(fields))
		{
			return null;
		}

		return AdditionalFilter.getValues().find((additional) => `${id}_${additional}` in fields) ?? null;
	};

	const isRangeOperator = (operator) => operator === NumberOperator.RANGE.getValue();

	const isLessOperator = (operator) => operator === NumberOperator.LESS.getValue();

	/**
	 * The bounds a comparison speaks, as the web control renders its inputs (`main.ui.filter`,
	 * fields.js) and the server reads them (`NumberType::getLogicFilter`, `Crm\Filter\ListFilter`): a
	 * range writes both, "less" writes the upper one, the rest write the lower one. Everything else the
	 * form still holds is left out - a bound the web would never post narrows the list behind the back
	 * of the row that shows the condition.
	 *
	 * The form keeps the value of its single input in `from` whatever the comparison is, so the name of
	 * the bound is given here and nowhere else.
	 *
	 * @param {string} id
	 * @param {NumberValue} value
	 * @return {?SerializedFields} null when the comparison is left with no bound to compare by
	 */
	const writeBounds = (id, value) => {
		const { operator, from, to } = value;

		if (isRangeOperator(operator))
		{
			return writeRange(id, from, to);
		}

		return isLessOperator(operator) ? writeRange(id, null, from) : writeRange(id, from, null);
	};

	/**
	 * Inverse of writeBounds: the bound the single input of the form works with. `exact` falls back to
	 * the upper bound the way the web does for a preset that carries no lower one.
	 *
	 * @param {string} id
	 * @param {string} operator
	 * @param {SerializedFields} fields
	 * @return {?{from?: *, to?: *}} null when the comparison finds no bound of its own
	 */
	const readBounds = (id, operator, fields) => {
		const range = readRange(id, fields);

		if (range === null)
		{
			return null;
		}

		if (isRangeOperator(operator))
		{
			return range;
		}

		const single = isLessOperator(operator) ? range.to : (range.from ?? range.to);

		return isFilledScalar(single) ? { from: single } : null;
	};

	/**
	 * @param {string} id
	 * @param {NumberValue} value
	 * @return {SerializedFields}
	 */
	const serializeNumber = (id, value) => {
		if (!Type.isPlainObject(value))
		{
			return {};
		}

		if (!Type.isStringFilled(value.operator))
		{
			return {};
		}

		const range = writeBounds(id, value);

		if (range === null)
		{
			return {};
		}

		return { [`${id}${FieldSuffix.NUMBER_SELECT.getValue()}`]: value.operator, ...range };
	};

	/**
	 * The numbers a period is counted from, under the keys the web filter reads them by (`_days`,
	 * `_month`, `_quarter`, `_year`). All or nothing: a period missing one of them is a period the
	 * web builds no boundaries out of.
	 *
	 * @param {string} id
	 * @param {string} preset
	 * @param {DateValue} value
	 * @return {?SerializedFields} null when the period needs a number the value does not carry
	 */
	const writeExtras = (id, preset, value) => {
		const extras = getPresetExtras(preset);

		if (!extras.every((extra) => isExtraFilled(extra, value[extra])))
		{
			return null;
		}

		const written = {};

		extras.forEach((extra) => {
			written[`${id}${getExtraSuffix(extra)}`] = toExtraNumber(value[extra]);
		});

		return written;
	};

	/**
	 * Inverse of writeExtras: the numbers as the control of the form works with them.
	 *
	 * @param {string} id
	 * @param {string} preset
	 * @param {SerializedFields} fields
	 * @return {?Object} null when the preset kept a number it needs out of the storage
	 */
	const readExtras = (id, preset, fields) => {
		const extras = getPresetExtras(preset);
		const read = {};
		const complete = extras.every((extra) => {
			const raw = fields[`${id}${getExtraSuffix(extra)}`];

			if (!isExtraFilled(extra, raw))
			{
				return false;
			}

			read[extra] = toExtraNumber(raw);

			return true;
		});

		return complete ? read : null;
	};

	/**
	 * @param {FieldDescriptor} descriptor
	 * @param {DateValue} value
	 * @return {SerializedFields}
	 */
	const serializeDate = (descriptor, value) => {
		if (!Type.isPlainObject(value) || !Type.isStringFilled(value.preset))
		{
			return {};
		}

		// same answer as a period left without its boundaries below: a date that narrows nothing is no
		// condition, and one written here is counted as one - by the badge of the button above all
		if (value.preset === NO_DATE_PRESET)
		{
			return {};
		}

		const { id, allowYearsSwitcher, withTime } = descriptor;
		const { preset, from, to, allowYear } = value;

		if (isBoundaryPreset(preset))
		{
			// the storage keeps a date of the site, the picker of the form keeps a timestamp
			const range = writeRange(
				id,
				writeDateBoundary(from, withTime),
				// a period of one date is closed by the server itself; a second boundary written here
				// is read by nobody and the form has no input for it
				DateBoundaryPreset.hasUpperBoundary(preset) ? writeDateBoundary(to, withTime) : null,
			);

			if (range === null)
			{
				return {};
			}

			return { [`${id}${FieldSuffix.DATE_SELECT.getValue()}`]: preset, ...range };
		}

		const extras = writeExtras(id, preset, value);

		if (extras === null)
		{
			// `Options::calcDates()` counts no boundaries for such a period without its number, and a
			// date field left with no boundaries is dropped from the filter - a field that narrows
			// nothing has no business standing in the request as a condition
			return {};
		}

		const result = { [`${id}${FieldSuffix.DATE_SELECT.getValue()}`]: preset, ...extras };

		// The years switcher exists on boundary-free presets only, same as in the web control.
		if (allowYearsSwitcher)
		{
			result[`${id}${FieldSuffix.ALLOW_YEAR.getValue()}`] = allowYear ? '1' : '0';
		}

		return result;
	};

	/**
	 * Whether the field is in the filter at all - the question the form asks to show a row, the badge
	 * asks to count conditions and the offline matcher asks to test a task. It is answered by the
	 * serializer alone, so all three agree with what the request actually carries.
	 *
	 * @param {FieldDescriptor} descriptor
	 * @param {FieldValue} value
	 * @return {boolean}
	 */
	const isFieldActive = (descriptor, value) => Object.keys(serializeField(descriptor, value)).length > 0;

	/**
	 * Serializes the whole form into `tmpFields` (API-01), search folded into `FIND`.
	 *
	 * @param {FieldDescriptor[]} descriptors
	 * @param {FilterValues} values
	 * @param {string} [search]
	 * @return {SerializedFields}
	 */
	const serializeValues = (descriptors, values, search = '') => {
		const tmpFields = {};

		if (Type.isArrayFilled(descriptors) && Type.isPlainObject(values))
		{
			descriptors.forEach((descriptor) => {
				const fragment = serializeField(descriptor, values[descriptor.id]);
				Object.assign(tmpFields, fragment);
			});
		}

		if (Type.isStringFilled(search))
		{
			tmpFields[SEARCH_FIELD_ID] = search;
		}

		return tmpFields;
	};

	const toFilledArray = (value) => {
		if (Type.isArray(value))
		{
			return value.length > 0 ? value : null;
		}

		return isFilledScalar(value) ? [value] : null;
	};

	/**
	 * An item id as the dictionary of the field spells it - a string. A stored preset may keep the
	 * same id as a number: the task presets the module ships with hold `STATUS: [2, 3]`, while the
	 * items of the descriptor, the pickers over them and the row of the form all compare ids
	 * strictly. A number left as it came leaves the field looking unset.
	 *
	 * @param {*} value
	 * @return {*}
	 */
	const toItemId = (value) => (Type.isNumber(value) ? String(value) : value);

	/**
	 * A list value as its control works with it: an array for a multiple field, a scalar for a
	 * single one.
	 *
	 * @param {*} raw
	 * @param {boolean} [multiple]
	 * @return {string[]|string|null}
	 */
	const deserializeList = (raw, multiple) => {
		if (multiple)
		{
			return toFilledArray(raw)?.map(toItemId) ?? null;
		}

		return isFilledScalar(raw) ? toItemId(raw) : null;
	};

	/**
	 * Restores a single form value from the flat `fields` map of a saved preset (CONTRACT-API-02).
	 * Inverse of serializeField.
	 *
	 * `null` is the answer "the preset does not set this field": an absent value is a case the
	 * callers act on - they skip the field - so it is returned as a value of its own rather than
	 * left to a bare `return`.
	 *
	 * @param {FieldDescriptor} descriptor
	 * @param {SerializedFields} fields
	 * @return {FieldValue|null}
	 */
	const deserializeField = (descriptor, fields) => {
		if (!descriptor || !Type.isStringFilled(descriptor.id) || !Type.isPlainObject(fields))
		{
			return null;
		}

		const { id, type, multiple, destination } = descriptor;
		const raw = fields[id];

		// inverse of the condition serializeField writes before the type of the field: the key carries
		// the condition alone, so the field comes back under it with nothing to give back to the value
		const additional = deserializeAdditional(id, fields);
		if (additional !== null)
		{
			return { additional, previous: null };
		}

		switch (type)
		{
			case FieldType.STRING.getValue():
			case FieldType.FULLTEXT.getValue():
				return isFilledScalar(raw) ? raw : null;

			case FieldType.LIST.getValue():
				return deserializeList(raw, multiple);

			case FieldType.BOOLEAN.getValue():
				return readBoolean(descriptor, raw);

			case FieldType.ENTITY_SELECTOR.getValue():
			{
				const ids = (
					Type.isStringFilled(destination)
						? readDestination(destination, raw)
						: toFilledArray(raw)
				);

				if (ids === null)
				{
					return null;
				}

				// back to the control shape: an array either way, trimmed for a single field
				// in case the shared store holds several ids from an earlier configuration
				return (multiple ? ids : ids.slice(0, 1));
			}

			case FieldType.NUMBER.getValue():
				return deserializeNumber(id, fields);

			case FieldType.DATE.getValue():
				return deserializeDate(descriptor, fields);

			default:
				return null;
		}
	};

	/**
	 * @param {string} id
	 * @param {SerializedFields} fields
	 * @return {NumberValue|null}
	 */
	const deserializeNumber = (id, fields) => {
		const operator = fields[`${id}${FieldSuffix.NUMBER_SELECT.getValue()}`];
		if (!Type.isStringFilled(operator))
		{
			return null;
		}

		const range = readBounds(id, operator, fields);

		return range === null ? null : { operator, ...range };
	};

	/**
	 * @param {FieldDescriptor} descriptor
	 * @param {SerializedFields} fields
	 * @return {DateValue|null}
	 */
	const deserializeDate = (descriptor, fields) => {
		const { id, allowYearsSwitcher } = descriptor;
		const preset = fields[`${id}${FieldSuffix.DATE_SELECT.getValue()}`];

		if (!Type.isStringFilled(preset))
		{
			return null;
		}

		if (isBoundaryPreset(preset))
		{
			const range = readRange(id, fields);

			if (range === null)
			{
				return null;
			}

			const boundaries = {};
			if ('from' in range)
			{
				boundaries.from = readDateBoundary(range.from);
			}

			// a preset of the web may carry an upper boundary the server does not read either
			if ('to' in range && DateBoundaryPreset.hasUpperBoundary(preset))
			{
				boundaries.to = readDateBoundary(range.to);
			}

			// a boundary that could not be read is not a period the form can show: the row would stand
			// with a period and no date - `isFieldActive` counts no condition there either, so the badge
			// of the button shows none - and apply would send the field without that boundary and
			// take it out of the storage shared with the web. Answered the same way as a period that
			// arrived with no boundaries at all: there is nothing here to restore
			if (Object.values(boundaries).includes(null))
			{
				return null;
			}

			return { preset, ...boundaries };
		}

		const extras = readExtras(id, preset, fields);

		if (extras === null)
		{
			// the preset narrowed nothing without it, so there is no period to restore
			return null;
		}

		const value = { preset, ...extras };

		if (allowYearsSwitcher)
		{
			value.allowYear = fields[`${id}${FieldSuffix.ALLOW_YEAR.getValue()}`] === '1';
		}

		return value;
	};

	/**
	 * Restores the whole form from a saved preset: `FIND` goes back to the search string.
	 *
	 * @param {FieldDescriptor[]} descriptors
	 * @param {SerializedFields} fields
	 * @return {DeserializedForm}
	 */
	const deserializeValues = (descriptors, fields) => {
		const values = {};

		if (Type.isArrayFilled(descriptors) && Type.isPlainObject(fields))
		{
			descriptors.forEach((descriptor) => {
				const value = deserializeField(descriptor, fields);
				if (value !== null)
				{
					values[descriptor.id] = value;
				}
			});
		}

		const search = (Type.isPlainObject(fields) && Type.isStringFilled(fields[SEARCH_FIELD_ID]))
			? fields[SEARCH_FIELD_ID]
			: '';

		return { values, search };
	};

	/**
	 * Field ids of a preset in display order (`rows` of CONTRACT-API-02). Derived from the
	 * descriptors rather than from the serialized keys: stripping key suffixes the way
	 * Options::getRowsFromFields() does turns `_allow_year` into a bogus `_allow` row.
	 *
	 * @param {FieldDescriptor[]} descriptors
	 * @param {FilterValues} values
	 * @param {string} [search]
	 * @return {string[]}
	 */
	const buildRows = (descriptors, values, search = '') => {
		const rows = [];

		if (Type.isArrayFilled(descriptors) && Type.isPlainObject(values))
		{
			descriptors.forEach((descriptor) => {
				if (isFieldActive(descriptor, values[descriptor.id]))
				{
					rows.push(descriptor.id);
				}
			});
		}

		if (Type.isStringFilled(search) && !rows.includes(SEARCH_FIELD_ID))
		{
			rows.push(SEARCH_FIELD_ID);
		}

		return rows;
	};

	module.exports = {
		SEARCH_FIELD_ID,
		isFieldActive,
		serializeField,
		serializeValues,
		deserializeField,
		deserializeValues,
		buildRows,
	};
});
