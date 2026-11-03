/**
 * @module layout/ui/field-filter/filter/src/model/value-formatter
 */
jn.define('layout/ui/field-filter/filter/src/model/value-formatter', (require, exports, module) => {
	const { Type } = require('type');
	const { Loc } = require('loc');
	const store = require('statemanager/redux/store');
	const { selectFilterDictionary } = require('statemanager/redux/slices/field-filter/selector');
	const { stringify, capitalize } = require('utils/string');
	const {
		FieldType,
		BooleanValue,
		NumberOperator,
		AdditionalFilter,
		CountedDatePreset,
		readAdditional,
		toExtraNumber,
		hasFilledExtras,
		hasPresetExtras,
	} = require('layout/ui/field-filter/values');

	/**
	 * Words of the controls come from the web filter and live in the store (CONTRACT-DTO-01): the portal
	 * words a period of a date once, in `Main\UI\Filter`, and every list of every module is drawn with
	 * those words. A second wording on this side would drift away from the web on the first edit of
	 * either, and every language of it would have to be translated again.
	 *
	 * The store is read rather than taken as an argument: the vocabulary is one for the whole
	 * application, and threading it through every control and every row would say the opposite.
	 *
	 * @return {?FilterDictionary}
	 */
	const getDictionary = () => selectFilterDictionary(store.getState());

	/**
	 * The word the vocabulary has for a value of a control, or an empty string when it has none: a value
	 * no vocabulary words is left unworded rather than shown by its raw id.
	 *
	 * @param {string} group of `FilterDictionary`
	 * @param {string} id
	 * @return {string}
	 */
	const getEntryName = (group, id) => {
		const entries = getDictionary()?.[group];
		if (!Type.isArrayFilled(entries) || !Type.isStringFilled(id))
		{
			return '';
		}

		return entries.find((entry) => entry.id === id)?.name ?? '';
	};

	/**
	 * Phrase per period counted in days: the number is part of the wording there, and Russian counts
	 * days in three forms of it.
	 * @type {Readonly<Record<string, string>>}
	 */
	const COUNTED_PERIOD_PHRASE = Object.freeze({
		PREV_DAYS: 'M_FIELD_FILTER_DATE_PREV_DAYS_VALUE',
		NEXT_DAYS: 'M_FIELD_FILTER_DATE_NEXT_DAYS_VALUE',
	});

	/**
	 * Phrase per condition on the presence of a value, as the chosen state of the field: the web
	 * words it there in full (`ADDITIONAL_FILTER_PLACEHOLDER_*`), because the wording stands alone
	 * once the value slot is given up to it.
	 * @type {Readonly<Record<string, string>>}
	 */
	const ADDITIONAL_FILTER_PHRASE = Object.freeze({
		[AdditionalFilter.IS_EMPTY.getValue()]: 'M_FIELD_FILTER_ADDITIONAL_IS_EMPTY',
		[AdditionalFilter.HAS_ANY_VALUE.getValue()]: 'M_FIELD_FILTER_ADDITIONAL_HAS_ANY_VALUE',
	});

	/**
	 * The same conditions as items of a menu, where the web shortens the wording
	 * (`ADDITIONAL_FILTER_MENU_*`): among two items one word is enough, and the pair reads as a pair.
	 * @type {Readonly<Record<string, string>>}
	 */
	const ADDITIONAL_FILTER_MENU_PHRASE = Object.freeze({
		[AdditionalFilter.IS_EMPTY.getValue()]: 'M_FIELD_FILTER_ADDITIONAL_IS_EMPTY',
		[AdditionalFilter.HAS_ANY_VALUE.getValue()]: 'M_FIELD_FILTER_ADDITIONAL_MENU_HAS_ANY_VALUE',
	});

	/**
	 * The phrase a dictionary names for the value, or an empty string when it names none: a value the
	 * mobile filter does not know is left unworded rather than shown by its raw id.
	 *
	 * @param {Readonly<Record<string, string>>} phrases
	 * @param {string} key
	 * @return {string}
	 */
	const getLabel = (phrases, key) => {
		const phraseId = phrases[key];

		return Type.isStringFilled(phraseId) ? Loc.getMessage(phraseId) : '';
	};

	/**
	 * What the row of a field shows while the field is not set: nothing. A word in the value slot
	 * reads as a chosen value - an "any" word looks like a condition the user picked - and the chevron
	 * already says the row opens. `SettingSelector` drops the text of a parameter row entirely on
	 * an empty string, so the row is left with the chevron alone.
	 * @type {string}
	 */
	const UNSET_ROW_VALUE = '';

	/**
	 * "Any value" as a row of a picker: there it is a choice among the others - the one that
	 * clears the field - and a choice has to be worded. Not for the row of the field, see
	 * UNSET_ROW_VALUE.
	 *
	 * @return {string}
	 */
	function getAnyText()
	{
		return Loc.getMessage('M_FIELD_FILTER_VALUE_ANY');
	}

	/**
	 * Short value of a field for its row in the drawer; empty while the field is not set.
	 *
	 * @param {FieldDescriptor} descriptor
	 * @param {FieldValue} value
	 * @return {string}
	 */
	function formatFieldValue(descriptor, value)
	{
		// a field under a condition on the presence of a value is named by that condition whatever
		// its type: the condition took the place of the value, so it takes its slot in the row too
		const additional = readAdditional(value);
		if (additional !== null)
		{
			return getAdditionalFilterLabel(additional);
		}

		switch (descriptor.type)
		{
			case FieldType.STRING.getValue():
			case FieldType.FULLTEXT.getValue():
				return Type.isStringFilled(value) ? value : UNSET_ROW_VALUE;

			case FieldType.NUMBER.getValue():
				return formatNumber(value);

			case FieldType.DATE.getValue():
				return formatDate(value);

			case FieldType.LIST.getValue():
				return formatList(descriptor, value);

			case FieldType.BOOLEAN.getValue():
				return formatBoolean(value);

			case FieldType.ENTITY_SELECTOR.getValue():
				return formatSelected(Type.isArray(value) ? value.length : 0);

			default:
				return UNSET_ROW_VALUE;
		}
	}

	function formatNumber(value)
	{
		if (!Type.isPlainObject(value))
		{
			return UNSET_ROW_VALUE;
		}

		const from = stringify(value.from);
		const to = stringify(value.to);

		if (value.operator === NumberOperator.RANGE.getValue())
		{
			if (from === '' && to === '')
			{
				return UNSET_ROW_VALUE;
			}

			return `${from || '…'} – ${to || '…'}`;
		}

		if (from === '')
		{
			return UNSET_ROW_VALUE;
		}

		if (value.operator === NumberOperator.EXACT.getValue())
		{
			return from;
		}

		const label = getNumberOperatorLabel(value.operator);

		// the number left alone reads as an equality - another condition, not a missing one - so an
		// operator the vocabulary has no word for leaves the row unworded, the way a period does
		return Type.isStringFilled(label) ? `${label} ${from}` : UNSET_ROW_VALUE;
	}

	/**
	 * A period is named by its preset: the boundaries of RANGE/EXACT are timestamps and
	 * the row has no room for two dates anyway. A period counted from a number is named by that
	 * number instead - see formatCountedPeriod.
	 */
	function formatDate(value)
	{
		if (!Type.isPlainObject(value) || !Type.isStringFilled(value.preset))
		{
			return UNSET_ROW_VALUE;
		}

		const counted = formatCountedPeriod(value);
		if (counted !== null)
		{
			return counted;
		}

		const message = getDatePresetLabel(value.preset);

		return Type.isStringFilled(message) ? message : UNSET_ROW_VALUE;
	}

	/**
	 * A period counted from a number, named by the number itself: "Last N days" says nothing
	 * about what the list is narrowed to, and the number stands next to the period in the web filter
	 * for the same reason.
	 *
	 * @param {DateValue} value
	 * @return {?string} null when the period is counted from today, or its number is not given yet
	 */
	function formatCountedPeriod(value)
	{
		if (!hasPresetExtras(value.preset) || !hasFilledExtras(value))
		{
			return null;
		}

		const year = toExtraNumber(value.year);

		switch (value.preset)
		{
			case CountedDatePreset.PREV_DAYS:
			case CountedDatePreset.NEXT_DAYS:
			{
				const days = toExtraNumber(value.days);

				return Loc.getMessagePlural(COUNTED_PERIOD_PHRASE[value.preset], days, {
					'#VALUE#': String(days),
				});
			}

			case CountedDatePreset.MONTH:
				return Loc.getMessage('M_FIELD_FILTER_DATE_MONTH_VALUE', {
					'#MONTH#': getMonthName(toExtraNumber(value.month)),
					'#YEAR#': String(year),
				});

			case CountedDatePreset.QUARTER:
				return Loc.getMessage('M_FIELD_FILTER_DATE_QUARTER_VALUE', {
					'#QUARTER#': String(toExtraNumber(value.quarter)),
					'#YEAR#': String(year),
				});

			default:
				return String(year);
		}
	}

	/**
	 * The month by its number, the way a month standing on its own is written: the dictionary of the
	 * application keeps the names in lower case, for the dates they are read inside.
	 *
	 * @param {number} month 1-12, as the web filter counts them
	 * @return {string} the number itself for a month there is no such thing as
	 */
	function getMonthName(month)
	{
		const name = getEntryName('months', String(month));

		return name === '' ? String(month) : capitalize(name);
	}

	/**
	 * @param {string} preset
	 * @return {string} empty when the preset is unknown to the mobile filter
	 */
	function getDatePresetLabel(preset)
	{
		return getEntryName('datePresets', preset);
	}

	/**
	 * Periods of a date the portal offers, in the order the web filter shows them. A field narrows this
	 * list by the ones its provider excludes (`excludedDatePresets`).
	 *
	 * @return {string[]} empty while the vocabulary has not arrived
	 */
	function getDatePresetIds()
	{
		const presets = getDictionary()?.datePresets;

		return Type.isArrayFilled(presets) ? presets.map(({ id }) => id) : [];
	}

	function formatList(descriptor, value)
	{
		// most rows of the form are empty, and an empty one has nothing to look for among the items
		if (Type.isNil(value) || (Type.isArray(value) && value.length === 0))
		{
			return UNSET_ROW_VALUE;
		}

		const items = Type.isArrayFilled(descriptor.items) ? descriptor.items : [];
		const selectedIds = new Set(Type.isArray(value) ? value : [value]);
		const selected = items.filter((item) => selectedIds.has(item.id));

		if (selected.length === 0)
		{
			return UNSET_ROW_VALUE;
		}

		return selected.length === 1 ? selected[0].value : formatSelected(selected.length);
	}

	function formatBoolean(value)
	{
		if (!BooleanValue.isDefined(value))
		{
			return UNSET_ROW_VALUE;
		}

		const name = getEntryName('booleanValues', value);

		return name === '' ? UNSET_ROW_VALUE : name;
	}

	function formatSelected(count)
	{
		if (count === 0)
		{
			return UNSET_ROW_VALUE;
		}

		return Loc.getMessage('M_FIELD_FILTER_ENTITY_SELECTED', { '#COUNT#': String(count) });
	}

	function getNumberOperatorLabel(operator)
	{
		return getEntryName('numberOperators', operator);
	}

	/**
	 * Values of a boolean field as a picker offers them - the pair the web checkbox control is worded
	 * with. Empty while the vocabulary has not arrived: a two-row picker with no words is worse than a
	 * row that opens nothing.
	 *
	 * @return {FieldItem[]}
	 */
	function getBooleanItems()
	{
		return [BooleanValue.YES.getValue(), BooleanValue.NO.getValue()]
			.map((id) => ({ id, value: getEntryName('booleanValues', id) }))
			.filter(({ value }) => value !== '');
	}

	/**
	 * The word of the "count the year in" switcher of the date control.
	 *
	 * @return {string}
	 */
	function getYearsSwitcherLabel()
	{
		return getDictionary()?.yearsSwitcher ?? '';
	}

	/**
	 * @param {AdditionalFilter} additional
	 * @return {string} empty when the condition is unknown to the mobile filter
	 */
	function getAdditionalFilterLabel(additional)
	{
		return getLabel(ADDITIONAL_FILTER_PHRASE, additional);
	}

	/**
	 * @param {AdditionalFilter} additional
	 * @return {string} empty when the condition is unknown to the mobile filter
	 */
	function getAdditionalFilterMenuLabel(additional)
	{
		return getLabel(ADDITIONAL_FILTER_MENU_PHRASE, additional);
	}

	module.exports = {
		formatFieldValue,
		getAnyText,
		getBooleanItems,
		getYearsSwitcherLabel,
		getNumberOperatorLabel,
		getAdditionalFilterLabel,
		getAdditionalFilterMenuLabel,
		getDatePresetLabel,
		getDatePresetIds,
		getMonthName,
	};
});
