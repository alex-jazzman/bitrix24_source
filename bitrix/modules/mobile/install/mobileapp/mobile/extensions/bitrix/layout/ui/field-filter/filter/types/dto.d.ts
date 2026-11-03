/**
 * Wire vocabulary of the filter: what the server sends (CONTRACT-DTO-01) and what goes back to
 * it (CONTRACT-API-01/02).
 *
 * The sets of allowed values live in `src/enums/*` and are not repeated here: one definition,
 * one place. The aliases below name the scalars so that a signature says which vocabulary the
 * string belongs to.
 */

/** Value of the `FieldType` enum (src/enums/field-type). */
export type FieldType = string;

/** Value of the `NumberOperator` enum (src/enums/number-operator). */
export type NumberOperator = string;

/** Value of the `AdditionalFilter` enum (src/enums/additional-filter). */
export type AdditionalFilter = string;

/**
 * Value of the `BooleanValue` enum (src/enums/boolean-value).
 * The key is omitted entirely when the field is not set.
 */
export type BooleanValue = string;

/**
 * Entity behind an `entity_selector` field: the descriptor names the entity, the consumer decides
 * which picker serves it (EntitySelectorMap). The vocabulary is open - it grows with every module
 * that plugs its lists in - so the core does not enumerate it.
 */
export type FieldEntity = string;

/**
 * Leading icon of a row: an instance of the `Icon` registry of `assets/icons`. The registry is a
 * runtime one and ships no typings, so the alias names the slot instead of describing it.
 */
export type FieldIcon = unknown;

/**
 * Leading icons of the form, by field id - or by the code of a family of fields, for fields whose
 * id carries the preset they belong to (`RQ_ADDR|1|0|CITY`). A field the map says nothing about
 * gets no icon.
 */
export type FieldIcons = Record<string, FieldIcon>;

/** Choice of a list field: the id travels to the server, the value is shown to the user. */
export type FieldItem = {
	id: string,
	value: string,
};

/**
 * Field description for form rendering (CONTRACT-DTO-01).
 */
export type FieldDescriptor = {
	id: string,
	name: string,
	type: FieldType,
	multiple: boolean,
	items?: FieldItem[],
	/**
	 * Pointer at a reference book several fields of the list share (`FilterFieldsAnswer.itemSets`).
	 * Lives on the wire only: the parser puts the values back into `items`, so nothing above it ever
	 * sees this key.
	 */
	itemsRef?: string,
	/**
	 * The reference book of this field stayed on the server (Bitrix\Mobile\Filter\DeferredItems): no
	 * filter of the list fills the field, so its values are read by `getFilterFieldItems` when the
	 * picker of the field is opened. Absent on a field that came with its values.
	 */
	itemsDeferred?: boolean,
	/**
	 * How many values the field has, said by the dictionary that kept them (`itemsDeferred`). The
	 * sheet of the picker is opened to the height of what it will draw, and that is a row per value:
	 * without the number the sheet takes the whole screen and stays that tall once the rows arrive.
	 * Absent on a field that came with its values - those are counted themselves.
	 */
	itemsCount?: number,
	entity?: FieldEntity,
	/**
	 * What the dialog of the web narrows the entity to: my companies alone for a my-company
	 * requisites field, one catalogue for a product row, the employees of the portal for a
	 * responsible. Given to the search provider of the picker as it stands, so mobile offers what
	 * the web offers; absent means the entity is searched over in full.
	 */
	entityOptions?: Record<string, unknown>,
	/**
	 * Periods the provider of this field takes away from `FilterDictionary.datePresets`; absent
	 * means the field offers every period of the vocabulary. The periods themselves are not
	 * repeated here - two dozen of them per date field is the same list sent over and over.
	 */
	excludedDatePresets?: string[],
	/**
	 * Comparisons the provider of a number field takes away from `FilterDictionary.numberOperators`;
	 * absent means the field offers every one of them.
	 */
	excludedNumberOperators?: string[],
	withTime?: boolean,
	allowYearsSwitcher?: boolean,
	/**
	 * The pair a boolean field travels in when its provider counts the flag in numbers - `1`/`0`
	 * instead of the `Y`/`N` the vocabulary words (`FieldAdapter::CHECKBOX` reads the same key off the
	 * web descriptor). A boolean user field of CRM is such a field. Absent means the default pair, and
	 * only a boolean field carries the key at all.
	 */
	valueType?: string,
	/** Conditions on the presence of a value the field allows; absent means it allows none. */
	additionalFilter?: AdditionalFilter[],
	/** Group of the web filter the field belongs to; absent puts it into the first one. */
	sectionId?: string,
	default: boolean,
	locked: boolean,
};

/**
 * A reference book more than one field of the list holds - the stages of a deal describe four of its
 * fields. Sent once per answer instead of once per field (ItemSetIndex); the fields point at it by id.
 */
export type ItemSet = {
	id: string,
	items: FieldItem[],
};

/** An entry of the vocabulary: the id travels to the server, the name is shown to the user. */
export type DictionaryEntry = {
	id: string,
	name: string,
};

/**
 * Words of the filter controls, sent once per answer of the dictionary (CONTRACT-DTO-01) and kept in
 * the store: they belong to no list and come from the web filter itself (Main\UI\Filter), so neither
 * a module nor the client words them a second time.
 *
 * Order is the order the web shows: the periods of a date are a list, not a set.
 */
export type FilterDictionary = {
	datePresets: DictionaryEntry[],
	numberOperators: DictionaryEntry[],
	booleanValues: DictionaryEntry[],
	months: DictionaryEntry[],
	/** The single word of the "count the year in" switcher of the date control. */
	yearsSwitcher: string,
	/**
	 * Language the words were read in. Sent back with the next request for a dictionary of any list, so
	 * that the server repeats the words only when the portal words its filter differently now.
	 */
	langId: string,
};

/**
 * Group the fields of a list are drawn in, as the web filter groups them: the entity of the list,
 * its client entities, its activity search. A list the web does not group declares none.
 */
export type FieldSection = {
	id: string,
	name: string,
};

/**
 * Value of a single field as the form keeps it: the shape depends on the type of the field,
 * which is why the union is open at the scalar end.
 */
export type FieldValue = string
	| number
	| boolean
	| string[]
	| NumberValue
	| DateValue
	| AdditionalValue
	| null;

/**
 * A field put under a condition on the presence of a value by the "---" menu. The condition stands
 * in the place of the value whatever the type of the field, so this is the value of the field while
 * it holds; `previous` is what the field held before, given back when the condition is dropped.
 *
 * The number control writes its condition into `NumberValue` next to its comparison instead, and
 * `previous` is what tells the two shapes apart.
 */
export type AdditionalValue = {
	additional: AdditionalFilter,
	previous: FieldValue,
};

/** Form state: value per field id. A field the map says nothing about is not set. */
export type FilterValues = Record<string, FieldValue>;

/**
 * Flat `field -> value` map of the wire format: the same shape in `tmpFields` of a request and
 * in `fields` of a saved preset. Compound values are spread over suffixed keys (ALG-01), so the
 * map is not the form state.
 */
export type SerializedFields = Record<string, string | number | Array<string | number>>;

/**
 * Value collected from the number+operator control. A condition on the presence of a value
 * (`additional`) replaces the comparison on the wire, the way it replaces the control in the web
 * filter; the comparison and its bounds stay in the value so that choosing it again costs one tap.
 * Nothing is set at all while `operator` and `additional` are both null.
 */
export type NumberValue = {
	operator: NumberOperator | null,
	from?: string | number,
	to?: string | number,
	additional?: AdditionalFilter | null,
};

/**
 * Serialized value collected from the date-period control.
 *
 * `days`, `month`, `quarter` and `year` are the numbers a period is counted from: the presets that
 * need them carry no boundaries of their own, and the web filter builds none without them
 * (`Options::calcDates()`). They are filled in next to the period, in the row of the field.
 */
export type DateValue = {
	preset: string,
	from?: string | number,
	to?: string | number,
	allowYear?: boolean,
	days?: string | number | null,
	month?: string | number | null,
	quarter?: string | number | null,
	year?: string | number | null,
};

/** The form restored from a saved preset: the search string is a field of its own on the wire. */
export type DeserializedForm = {
	values: FilterValues,
	search: string,
};

/**
 * Saved filter of the shared web storage (CONTRACT-API-02). `pinned` is the preset the list opens
 * on, `forAll` - the one published to everyone on the portal.
 */
export type SavedFilter = {
	id: string,
	name: string,
	fields: SerializedFields,
	rows: string[],
	pinned: boolean,
	forAll: boolean,
};

/** Conditions of a preset plus their display order - what a write to the server carries. */
export type SavedFilterPayload = {
	fields: SerializedFields,
	rows: string[],
};

/**
 * Parsed answer of getSavedFilters. Both pointers are null when no preset is selected.
 */
export type SavedFiltersData = {
	presets: SavedFilter[],
	currentPresetId: string | null,
	defaultPresetId: string | null,
	/** whether the user may make a filter of this list common to everyone */
	canEditForAll: boolean,
};
