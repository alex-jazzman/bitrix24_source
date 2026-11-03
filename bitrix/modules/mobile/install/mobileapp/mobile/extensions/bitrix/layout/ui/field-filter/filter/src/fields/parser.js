/**
 * @module layout/ui/field-filter/filter/src/fields/parser
 */
jn.define('layout/ui/field-filter/filter/src/fields/parser', (require, exports, module) => {
	const { Type } = require('type');
	const { parsePresetPointer } = require('layout/ui/field-filter/filter/src/saved-filters/parser');

	/**
	 * Reads the answer of `getFilterFields` (CONTRACT-DTO-01). Without a grid id there is no list
	 * to address, so the whole answer is refused: a filter built on a missing id would write its
	 * state into a shared store entry.
	 *
	 * @param {unknown} data
	 * @return {FilterFields|null}
	 */
	const parseFilterFields = (data) => {
		if (!Type.isPlainObject(data) || !Type.isStringFilled(data.gridId))
		{
			return null;
		}

		return {
			gridId: data.gridId,
			fields: withSharedItems(Type.isArray(data.fields) ? data.fields : [], data.itemSets),
			sections: parseSections(data.sections),
			currentPresetId: parsePresetPointer(data.currentPresetId),
			currentFilter: parseCurrentFilter(data.currentFilter),
			dictionary: parseDictionary(data.dictionary),
		};
	};

	/**
	 * Puts back the reference books several fields of the list share. The server sends such a set once
	 * and leaves a pointer in the fields (`itemsRef`, see ItemSetIndex) - the stages of a deal describe
	 * four of its fields, and on the wire that would otherwise be the same list four times.
	 *
	 * The pointer ends here: a descriptor comes out of the parser carrying its values the way it always
	 * did, so no control and no formatter above knows the sets were shared.
	 *
	 * @param {Array} fields
	 * @param {unknown} rawSets
	 * @return {FieldDescriptor[]}
	 */
	const withSharedItems = (fields, rawSets) => {
		const sets = parseItemSets(rawSets);
		if (sets === null)
		{
			return fields;
		}

		return fields.map((field) => {
			if (!Type.isPlainObject(field) || !Type.isStringFilled(field.itemsRef))
			{
				return field;
			}

			const { itemsRef, ...rest } = field;

			// a pointer at a set the answer does not hold leaves the field with nothing to choose from:
			// drawing the raw ids of an undescribed set would be worse than an empty picker
			return { ...rest, items: sets.get(itemsRef) ?? [] };
		});
	};

	/**
	 * @param {unknown} rawSets
	 * @return {?Map<string, FieldItem[]>} null when the server shares no sets
	 */
	const parseItemSets = (rawSets) => {
		if (!Type.isArrayFilled(rawSets))
		{
			return null;
		}

		const sets = new Map();
		rawSets.forEach((set) => {
			if (Type.isPlainObject(set) && Type.isStringFilled(set.id) && Type.isArray(set.items))
			{
				sets.set(set.id, set.items);
			}
		});

		return sets;
	};

	/**
	 * Groups of the vocabulary, all read the same way: a list of `{id, name}` in the order the web
	 * shows them.
	 * @type {readonly string[]}
	 */
	const DICTIONARY_GROUPS = Object.freeze([
		'datePresets',
		'numberOperators',
		'booleanValues',
		'months',
	]);

	/**
	 * Words of the controls as the web filter words them. A null here means one of two things, and both
	 * end the same way: the client keeps what it has. Either the client already holds the vocabulary of
	 * the current language and the server left it out of the answer, or the server sends none at all -
	 * a module still on the older dictionary.
	 *
	 * @param {unknown} raw
	 * @return {FilterDictionary|null}
	 */
	const parseDictionary = (raw) => {
		if (!Type.isPlainObject(raw))
		{
			return null;
		}

		const dictionary = {
			yearsSwitcher: Type.isStringFilled(raw.yearsSwitcher) ? raw.yearsSwitcher : '',
			// the language the words were read in: the client sends it back, and the server answers with
			// the words again only when the portal words its filter differently now
			langId: Type.isStringFilled(raw.langId) ? raw.langId : '',
		};

		DICTIONARY_GROUPS.forEach((group) => {
			dictionary[group] = parseDictionaryEntries(raw[group]);
		});

		return dictionary;
	};

	/**
	 * An entry with no id addresses nothing and an entry with no word draws an empty row, so neither
	 * reaches the form.
	 *
	 * @param {unknown} raw
	 * @return {DictionaryEntry[]}
	 */
	const parseDictionaryEntries = (raw) => {
		if (!Type.isArray(raw))
		{
			return [];
		}

		return raw
			.filter((entry) => (
				Type.isPlainObject(entry) && Type.isStringFilled(entry.id) && Type.isStringFilled(entry.name)
			))
			.map((entry) => ({ id: entry.id, name: entry.name }));
	};

	/**
	 * Groups the fields are drawn in, in the order the server sent them. A list the web does not
	 * group - and a module still on the older dictionary - sends none, and the form stays the flat
	 * list of fields it was.
	 *
	 * @param {unknown} raw
	 * @return {FieldSection[]}
	 */
	const parseSections = (raw) => {
		if (!Type.isArray(raw))
		{
			return [];
		}

		return raw
			.filter((section) => Type.isPlainObject(section) && Type.isStringFilled(section.id))
			.map((section) => ({
				id: section.id,
				name: Type.isStringFilled(section.name) ? section.name : '',
			}));
	};

	/**
	 * State of the filter the list is showing right now. A server that does not send it at all -
	 * a module still on the older dictionary - leaves the client where it was: no values and no
	 * rows of a preset, so the form falls back to the fields of the provider.
	 *
	 * @param {unknown} raw
	 * @return {CurrentFilterState}
	 */
	const parseCurrentFilter = (raw) => {
		if (!Type.isPlainObject(raw))
		{
			return { fields: {}, rows: [] };
		}

		return {
			fields: Type.isPlainObject(raw.fields) ? raw.fields : {},
			rows: Type.isArray(raw.rows) ? raw.rows.filter((row) => Type.isStringFilled(row)) : [],
		};
	};

	/**
	 * Reads the answer of `getFilterFieldItems`: the values of one field the dictionary left on the
	 * server (DeferredItems). The answer is checked against the field that was asked about - an answer
	 * about another field would fill the picker with values of a foreign one.
	 *
	 * An empty list is an answer and not a failure: the portal has no values of that kind yet, and the
	 * picker then draws the row that clears the field alone.
	 *
	 * @param {unknown} data
	 * @param {string} fieldId
	 * @return {?FieldItem[]} null when the answer names another field or carries no values at all
	 */
	const parseFieldItems = (data, fieldId) => {
		if (!Type.isPlainObject(data) || data.fieldId !== fieldId || !Type.isArray(data.items))
		{
			return null;
		}

		return data.items
			.filter((item) => (
				Type.isPlainObject(item) && Type.isStringFilled(item.id) && Type.isStringFilled(item.value)
			))
			.map((item) => ({ id: item.id, value: item.value }));
	};

	module.exports = { parseFilterFields, parseFieldItems };
});
