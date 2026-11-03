import type {
	FieldDescriptor,
	FieldIcons,
	FieldItem,
	FieldValue,
	FilterValues,
	SavedFilter,
	SerializedFields,
} from './dto';
import type {
	FilterFieldItemsLoader,
	FilterFieldSetWriter,
	FilterListContext,
	SavedFiltersApi,
	SavedFiltersConfig,
	SavedFiltersHost,
} from './service';
import type { FieldOpenHandler, FieldOpenRequest, SortingTypeMap } from './component';

/**
 * Redux entry per consumer grid.
 */
export type FieldFilterEntity = {
	gridId: string,
	values: FilterValues,
	search: string,
	currentFilterId: string | null,
	/** Rows of the current filter; empty means "no preset", see FieldFilter.getRows(). */
	rows: string[],
	presets: SavedFilter[],
	/** The pinned preset - the one the list opens on; null when nothing is pinned. */
	defaultPresetId: string | null,
	/** False only until the first fetch: the one state with nothing to draw. */
	presetsLoaded: boolean,
	/**
	 * Reference books read after the dictionary, keyed by field id: the values of a field the server
	 * left them for (`FieldDescriptor.itemsDeferred`). Emptied when the dictionary of the list is read
	 * again - the values are as old as the dictionary they belong to.
	 */
	deferredItems: Record<string, FieldItem[]>,
};

/**
 * The entry as it stood before an action was applied to it, kept by the caller of that action until
 * the server confirms it. Everything but the grid id: the list of a snapshot is the list of the grid
 * it was taken from.
 */
export type FieldFilterSnapshot = Omit<FieldFilterEntity, 'gridId'>;

/**
 * Result of getData() - the API-01 request shape.
 */
export type FieldFilterData = {
	tmpFields: SerializedFields,
	search: string,
	currentFilterId: string | null,
};

/**
 * Which picker serves which entity of CONTRACT-DTO-01: the canonical entity of a descriptor to a
 * type of `EntitySelectorFactory`. The vocabulary belongs to the consumer, so the component holds
 * no map of its own - an entity that is not here leaves the field unopenable.
 */
export type EntitySelectorMap = Record<string, string>;

/**
 * Public contract of the FieldFilter component (TPL-01).
 */
export type FieldFilterProps = {
	gridId: string,
	/** Named the same way for every request of the filter, see FilterListContext. */
	context: FilterListContext,
	fieldDescriptors: FieldDescriptor[],
	/** Groups the form draws the fields in; empty for a list the web does not group. */
	fieldSections?: FieldSection[],
	fieldIcons?: FieldIcons,
	/** Icons of the group titles, keyed by section id. */
	sectionIcons?: FieldIcons,
	entitySelectors?: EntitySelectorMap,
	initialValues?: FilterValues,
	initialSearch?: string,
	/** Rows of the filter the server considers current, see FieldFilterEntity.rows. */
	initialRows?: string[],
	/** Server pointer to the selected preset; seeds the session state on the first load only. */
	initialCurrentFilterId?: string | null,
	savedFilters?: SavedFiltersConfig,
	/** A ready service instead of a namespace: a story or a suite supplies its own. */
	savedFiltersService?: SavedFiltersApi,
	/**
	 * Reads the values of a field whose reference book the dictionary left on the server; the owner
	 * (`ListFilter`) builds one out of the action namespace, a story supplies its own.
	 */
	loadFieldItems?: FilterFieldItemsLoader,
	/**
	 * Keeps the fields of the form between sessions; the owner (`ListFilter`) builds one out of the
	 * action namespace, a story supplies its own. Without it the set lives as long as the app runs.
	 */
	saveFieldSet?: FilterFieldSetWriter,
	onApply: (data: FieldFilterData) => void,
	/** Takes a field over from the generic controls, see FieldOpenHandler. */
	onOpenField?: FieldOpenHandler,
};

/**
 * Everything a list screen configures about its filter. The owner (`ListFilter`) does the rest -
 * loading, counting, the button and the drawer are the same for every list.
 */
export type ListFilterConfig = {
	/** Namespace of the filter actions of the module, e.g. `tasksmobile.Filter`. */
	actionPrefix: string,
	context: FilterListContext,
	/** Defaults to `loadFilterFields`; a screen that already has the dictionary supplies its own. */
	loadFields?: FilterFieldsLoader,
	/** Defaults to `loadFilterFieldItems`; a story or a suite reads the values its own way. */
	loadFieldItems?: FilterFieldItemsLoader,
	/** Defaults to `saveFilterFieldSet`; a story or a suite keeps the set of fields its own way. */
	saveFieldSet?: FilterFieldSetWriter,
	fieldIcons?: FieldIcons,
	/** Icons of the group titles, keyed by the section id the server sends. */
	sectionIcons?: FieldIcons,
	entitySelectors?: EntitySelectorMap,
	/** Badge code of the button in the navigation bar; onboarding points its hint at it. */
	buttonRef?: string,
	/** Omitted means the section is not shown: the list has no sorting. See setSorting(). */
	sorting?: ListSorting | null,
	sortTypes?: SortingTypeMap,
	/** Drops the fields the screen shows elsewhere, e.g. the counters of the project list. */
	prepareDescriptors?: (fields: FieldDescriptor[]) => FieldDescriptor[],
	/** Search string the stand-in collected before the drawer was loaded, see ListFilterEntry. */
	search?: string,
	/**
	 * Loads `layout/ui/field-filter` for the screen: the drawer graph is not in the bundle of a
	 * list, and the module of the screen is the one that may load a foreign extension. Omitted
	 * means the drawer never opens and the list filters by its search string.
	 */
	loadListFilter?: () => Promise<{ ListFilter?: Function } | undefined>,
	/** Hands the loaded filter to a screen that started with the stand-in. */
	onResolve?: (filter: ListFilterInstance) => void,
	onApply?: () => void,
	onOpenField?: FieldOpenHandler,
};

/**
 * Request payload of a list action. Same as FieldFilterData except that "no preset" is an empty
 * string: this crosses the wire, and the actions read the parameter as a string.
 */
export type ListFilterData = {
	tmpFields: SerializedFields,
	search: string,
	currentFilterId: string,
};

/**
 * The filter as a list screen holds it: `ListFilterEntry` before the drawer is loaded and
 * `ListFilter` after. Typed by what a screen calls of it - the same way `ListSorting` is typed by
 * what the drawer calls of the sorting it is given.
 */
export type ListFilterInstance = {
	setSorting: (sorting: ListSorting | null, sortTypes?: SortingTypeMap) => void,
	setContext: (context: FilterListContext) => void,
	invalidate: () => void,
	getSearch: () => string,
	setSearch: (text: string) => void,
	isSearchEmpty: () => boolean,
	getData: () => ListFilterData,
	getPresetId: () => string,
	getFieldValues: () => FilterValues,
	/** Everything a list request carries about the filter, read in one go. */
	getRequestFields: () => ListFilterRequestFields,
	getActiveFieldsCount: () => number,
	hasActiveFields: () => boolean,
	isActive: () => boolean,
	reset: () => void,
	getMenuButton: (callback?: () => void) => ListFilterButton,
	open: (parentWidget?: PageManager) => Promise<void>,
	/** True once the dictionary of the list is read; false while this is the stand-in. */
	isReady: () => boolean,
	/** Fields of the list as the dictionary describes them; empty until it is read. */
	getDescriptors: () => FieldDescriptor[],
	/** Values of the form; empty until the state of the list is read. */
	getValues: () => FilterValues,
	/** Reads the state of the list without opening the drawer, see ListFilterEntry::readState(). */
	readState: () => Promise<void>,
};

/** The three answers a list request needs, read out of one state of the filter. */
export type ListFilterRequestFields = {
	tmpFields: SerializedFields,
	search: string,
	presetId: string,
};

/** Button of the navigation bar as the native layer takes it. */
export type ListFilterButton = {
	id: string,
	type: string,
	testId?: string,
	badgeCode?: string,
	badgeValue?: string,
	accent: boolean,
	callback: () => void,
};

/**
 * Sorting is optional and belongs to the consumer list, so the drawer takes it from the outside
 * together with the wording of its types.
 */
export type FieldFilterOpenOptions = {
	sorting?: ListSorting | null,
	sortTypes?: SortingTypeMap,
};

/**
 * The list sorting the drawer drives: an instance of `BaseListSorting`
 * (`layout/ui/list/base-sorting`) owned by the consumer, typed by what the drawer uses of it.
 */
export type ListSorting = {
	getType: () => string,
	setType: (type: string) => void,
	/** False hides the section: a list may know no order of its own. */
	isSupported?: () => boolean,
};

/**
 * What the drawer and its sections need from the FieldFilter instance. The saved filter part of
 * the contract is shared with the section that owns it.
 */
export type FieldFilterHost = SavedFiltersHost & {
	getValues: () => FilterValues,
	getRows: () => string[],
	/** The set of fields the form shows; an empty one means the fields of the provider. */
	setRows: (rows: string[]) => void,
	setValue: (fieldId: string, value: FieldValue) => void,
	getEntitySelectors: () => EntitySelectorMap,
	/** True when the consumer took the field over; the row then only displays the value. */
	openField: (params: FieldOpenRequest) => boolean,
	getSavedFiltersService: () => SavedFiltersApi | null,
	apply: () => void,
};
