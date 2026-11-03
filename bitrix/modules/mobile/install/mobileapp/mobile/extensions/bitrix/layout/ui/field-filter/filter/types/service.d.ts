import type {
	FieldDescriptor,
	FieldIcons,
	FieldItem,
	SavedFilter,
	SavedFiltersData,
	SerializedFields,
} from './dto';
import type { FieldFilterSnapshot } from './filter';

/**
 * How a consumer names the list it is filtering. The core neither reads nor completes it: the
 * pair is `listType`/`groupId` in the task lists and `entityTypeName`/`categoryId` in CRM, so
 * the keys belong to the module that owns the actions.
 */
export type FilterListContext = Record<string, string | number>;

/**
 * Where the unified filters flag of a module is read from and where its answer is mirrored.
 * The action belongs to the module, the cache name separates the mirrors of the consumers.
 */
export type UnifiedFiltersFeatureParams = {
	action: string,
	cacheName: string,
	cacheId?: string,
};

/** Addresses the field dictionary of a list: the action namespace and the list itself. */
export type FilterFieldsParams = {
	actionPrefix: string,
	context: FilterListContext,
};

/** Reads the field dictionary of a list; null when the answer carries no usable one. */
export type FilterFieldsLoader = (params: FilterFieldsParams) => Promise<FilterFields | null>;

/**
 * Addresses the values of one field: the list, the field, and where the answer is kept. The grid id
 * comes with it because the answer lives next to the list in the store, not inside the request.
 */
export type FilterFieldItemsParams = {
	actionPrefix: string,
	context: FilterListContext,
	gridId: string,
	fieldId: string,
};

/**
 * Reads the values of one field of a list, for a field whose reference book the dictionary left on
 * the server. Null when the answer could not be read - the picker then says so instead of offering
 * an empty choice.
 */
export type FilterFieldItemsLoader = (fieldId: string) => Promise<FieldItem[] | null>;

/**
 * Addresses the field list of the form: the list and the fields it is to keep, in display order.
 * An empty list means the fields the provider marks `default`.
 */
export type FilterFieldSetParams = {
	actionPrefix: string,
	context: FilterListContext,
	rows: string[],
};

/**
 * Keeps the fields of the form where the web filter keeps its own. Nothing waits for the answer, so
 * it only says whether the server took the set.
 */
export type FilterFieldSetWriter = (rows: string[]) => Promise<boolean>;

/** Field dictionary of a list as the parser reads it (CONTRACT-DTO-01). */
export type FilterFields = {
	gridId: string,
	fields: FieldDescriptor[],
	/** Groups the fields are drawn in; empty for a list the web does not group. */
	sections: FieldSection[],
	/** Preset the server considers current; null when none is selected. */
	currentPresetId: string | null,
	currentFilter: CurrentFilterState,
	/**
	 * Words of the controls, as the web filter words them. Null means the client keeps what it already
	 * has: either it holds the vocabulary of the current language and the server left it out, or the
	 * server sends none at all - a module still on the older dictionary.
	 */
	dictionary: FilterDictionary | null,
};

/**
 * The filter the list is showing right now, as the storage shared with the web keeps it: the values
 * of the current preset (search folded into `FIND`, as in Options::getFilter()) and the rows it puts
 * on the form. Both empty means no preset is applied.
 */
export type CurrentFilterState = {
	fields: SerializedFields,
	rows: string[],
};

export type SavedFiltersServiceParams = {
	actionPrefix: string,
	context: FilterListContext,
};

/**
 * Saved filter section of the drawer, opt-in: without `actionPrefix` there is no section.
 */
export type SavedFiltersConfig = {
	actionPrefix: string,
};

/** Arguments of a saved filter action beyond the list context every call carries. */
export type SavedFiltersActionParams = Record<string, string | number | string[] | SerializedFields>;

export type SaveFilterParams = {
	presetId: string,
	name: string,
	fields: SerializedFields,
	rows: string[],
};

/**
 * Envelope of a runAction answer as the parser reads it: the code is the one the server sent,
 * turning it into a phrase is the job of the caller.
 */
export type ParsedResponse = {
	success: boolean,
	data: SavedFiltersData | null,
	code: string | null,
};

export type SavedFiltersResult =
	| { success: true, data: SavedFiltersData | null }
	| { success: false, code: string | null, message: string };

/**
 * Saved filter actions the UI calls (CONTRACT-API-02).
 */
export type SavedFiltersApi = {
	load: () => Promise<SavedFiltersResult>,
	save: (params: SaveFilterParams) => Promise<SavedFiltersResult>,
	/** The whole order at once: the position of a preset is what the server keeps as its `sort`. */
	reorder: (presetIds: string[]) => Promise<SavedFiltersResult>,
	remove: (presetId: string) => Promise<SavedFiltersResult>,
	pin: (presetId: string) => Promise<SavedFiltersResult>,
	unpin: () => Promise<SavedFiltersResult>,
	setForAll: (presetId: string) => Promise<SavedFiltersResult>,
	unsetForAll: (presetId: string) => Promise<SavedFiltersResult>,
	restore: () => Promise<SavedFiltersResult>,
};

/**
 * What the saved filter UI needs from the FieldFilter instance. The mutating half is applied to the
 * store before its request is sent, and `getSnapshot`/`restoreSnapshot` take it back when the
 * server refuses - see saved-filters/mutation.
 */
export type SavedFiltersHost = {
	gridId: string,
	getDescriptors: () => FieldDescriptor[],
	getFieldIcons: () => FieldIcons,
	/** Null for a host that reads the values of its fields no way at all - a story of the builder. */
	getFieldItemsLoader?: () => FilterFieldItemsLoader | null,
	applyPreset: (preset: SavedFilter) => void,
	getCurrentFilterId: () => string | null,
	setCurrentFilterId: (currentFilterId: string | null) => void,
	getPresets: () => SavedFilter[],
	getDefaultPresetId: () => string | null,
	arePresetsLoaded: () => boolean,
	setSavedFilters: (data: SavedFiltersData) => void,
	savePreset: (preset: SavedFilter) => void,
	reorderPresets: (presetIds: string[]) => void,
	removePreset: (presetId: string) => void,
	pinPreset: (presetId: string) => void,
	unpinPreset: () => void,
	setPresetForAll: (presetId: string, forAll: boolean) => void,
	getSnapshot: () => FieldFilterSnapshot,
	restoreSnapshot: (snapshot: FieldFilterSnapshot) => void,
	reset: () => void,
};

/**
 * An action of the saved filters as the screens run it: what changes in the store right away, and
 * the request that follows. `onChange` repaints whoever is showing the list - once for the change,
 * once more if it had to be taken back.
 */
export type PresetMutationParams = {
	filter: SavedFiltersHost,
	mutate: () => void,
	request: () => Promise<SavedFiltersResult>,
	onChange?: () => void,
};
