import type {
	AdditionalFilter,
	BooleanValue,
	DateValue,
	FieldDescriptor,
	FieldIcon,
	FieldIcons,
	FieldItem,
	FieldValue,
	FilterValues,
	NumberValue,
	SavedFilter,
} from './dto';
import type { FilterFieldItemsLoader, SavedFiltersApi, SavedFiltersHost } from './service';
import type { EntitySelectorMap, FieldFilterHost, ListSorting } from './filter';

export type FieldChangeHandler = (fieldId: string, value: FieldValue) => void;

/**
 * Section of the drawer. Passing `titleAction` at all - even as null - keeps the own title row
 * of the section, see the comment at FilterSection.
 */
export type FilterSectionProps = {
	testId: string,
	title?: string | null,
	titleAction?: unknown,
	isFirst?: boolean,
	divider?: boolean,
};

/**
 * Group of fields inside the section of the form: a row that opens and closes it, and its own
 * rows under it. The children are built only while the group is open.
 */
export type CollapsibleFilterGroupProps = {
	testId: string,
	title: string,
	/** Leading icon of the group; absent leaves the title alone. */
	icon?: FieldIcon | null,
	expanded?: boolean,
	/** The last group of the section draws no hairline after itself. */
	isLast?: boolean,
	onToggle: () => void,
};

/** Which columns the row keeps: its own icon, and the icon column of the list it lives in. */
export type RowLayoutParams = {
	hasIcon?: boolean,
	iconColumn?: boolean,
};

/** Padding of a cell of the filter, as the native layer takes it. */
export type RowStyle = {
	paddingLeft: number,
	paddingRight: number,
	paddingVertical: number,
};

export type RowDividerProps = {
	testId?: string | null,
	iconColumn?: boolean,
};

/**
 * An icon that answers taps in the area of the guidelines. The margins are the gaps the icon keeps
 * from its neighbours - the component adds them to the compensation of its own padding.
 */
export type IconActionProps = {
	testId: string,
	icon: FieldIcon,
	size?: number,
	/** Token of the design system, as `IconView` takes it. */
	color?: unknown,
	marginLeft?: number,
	marginRight?: number,
	/** How far the tap area may grow above and below the icon; the row keeps its height either way. */
	verticalOverhang?: number,
	forwardRef?: (ref: any) => void,
	onClick: () => void,
};

/**
 * The "---" of a field: the conditions on the presence of a value it allows. Draws nothing for a
 * field that allows none, so a consumer may hand it every field it has.
 */
export type AdditionalFilterButtonProps = {
	testId: string,
	descriptor: FieldDescriptor,
	/** The condition the field is under; marks the item of the menu that is chosen. */
	value?: AdditionalFilter | null,
	size?: number,
	marginLeft?: number,
	marginRight?: number,
	/** The tapped condition, the chosen one included: what that means belongs to the field. */
	onSelect: (additional: AdditionalFilter) => void,
};

/** The chosen condition where the value of the field would stand. */
export type AdditionalFilterValueProps = {
	testId: string,
	additional: AdditionalFilter,
	/** Size of the input, as `Input` takes it; the default one of the design system by default. */
	size?: unknown,
	style?: object,
	onClear: () => void,
};

export type SelectableRowProps = {
	testId: string,
	title: string,
	selected?: boolean,
	icon?: FieldIcon,
	/** Keeps the icon column even without an icon: a row of a list that lives under a group title. */
	iconColumn?: boolean,
	divider?: boolean,
	onClick?: () => void,
};

export type NumberOperatorControlProps = {
	testId: string,
	descriptor: FieldDescriptor,
	value?: NumberValue,
	onChange: (value: NumberValue) => void,
};

/**
 * The numbers the chosen period is counted from, standing next to it in the row of the field.
 * Draws nothing for a period that needs none, so a consumer may hand it every date value it has.
 */
export type DateExtrasControlProps = {
	testId: string,
	value?: DateValue,
	/** The whole period back, with the number that changed in it. */
	onChange: (value: DateValue) => void,
};

export type DatePeriodControlProps = {
	testId: string,
	descriptor: FieldDescriptor,
	value?: DateValue,
	onChange: (value: DateValue) => void,
};

export type ListSelectControlProps = {
	testId: string,
	items: FieldItem[],
	value?: string[] | string | BooleanValue | null,
	multiple?: boolean,
	onChange: (value: string[] | string | null) => void,
};

export type FieldPickerProps = {
	descriptor: FieldDescriptor,
	value?: FieldValue,
	/**
	 * Reads the values of a field whose reference book the dictionary left on the server
	 * (`FieldDescriptor.itemsDeferred`). Absent leaves the picker with what the descriptor carries.
	 */
	loadItems?: FilterFieldItemsLoader | null,
	onChange: (value: FieldValue) => void,
	close?: () => void,
};

export type FieldPickerState = {
	value?: FieldValue,
	/** Values read for a deferred field; null while they are still on their way. */
	items?: FieldItem[] | null,
	/** The values could not be read: the screen says so instead of offering an empty choice. */
	itemsFailed?: boolean,
};

export type FieldPickerOptions = {
	descriptor: FieldDescriptor,
	value?: FieldValue,
	parentWidget?: PageManager,
	loadItems?: FilterFieldItemsLoader | null,
	onChange: (value: FieldValue) => void,
};

/**
 * A field the row is about to open, handed to the consumer before the generic controls get it.
 */
export type FieldOpenRequest = {
	descriptor: FieldDescriptor,
	value?: FieldValue,
	parentWidget?: PageManager,
	onChange: (value: FieldValue) => void,
};

/** True when the consumer opened an editor of its own and the row must not open anything. */
export type FieldOpenHandler = (request: FieldOpenRequest) => boolean;

export type FieldRowProps = {
	testId: string,
	descriptor: FieldDescriptor,
	icon?: FieldIcon,
	value?: FieldValue,
	gridId: string,
	entitySelectors?: EntitySelectorMap,
	isLast?: boolean,
	parentWidget?: PageManager,
	/**
	 * Reads the values of a field whose reference book the dictionary left on the server; null leaves
	 * every field with what its descriptor carries.
	 */
	loadFieldItems?: FilterFieldItemsLoader | null,
	onChange: FieldChangeHandler,
	onOpenField?: FieldOpenHandler,
};

export type FilterFooterProps = {
	/** Test id of the footer itself. */
	testId: string,
	/** Test id of the button standing in it. */
	buttonTestId: string,
	text: string,
	design?: object,
	disabled?: boolean,
	onClick: () => void,
};

/**
 * Fields of the filter as the drawer shows them: the set the user keeps on the form, and the two
 * actions that change that set.
 */
export type SelectedFieldsProps = {
	testId: string,
	descriptors: FieldDescriptor[],
	values: FilterValues,
	/** The set of the filter; empty leaves it to the `default` of the fields. */
	rows?: string[],
	/**
	 * The set the reset of the field list gives back - the rows of the selected preset. Empty leaves
	 * it to the `default` of the fields, the way a filter naming no preset is left.
	 */
	defaultRows?: string[],
	fieldIcons?: FieldIcons,
	entitySelectors?: EntitySelectorMap,
	gridId: string,
	parentWidget?: PageManager,
	/**
	 * Reads the values of a field whose reference book the dictionary left on the server; null leaves
	 * every field with what its descriptor carries.
	 */
	loadFieldItems?: FilterFieldItemsLoader | null,
	isFirst?: boolean,
	onChange: FieldChangeHandler,
	onOpenField?: FieldOpenHandler,
	/** Opens the field selector - the screen the whole dictionary is offered on. */
	onAddFields?: () => void,
	/** Back to the set of the filter; the action is disabled while the form already shows it. */
	onResetFields?: () => void,
};

/**
 * The screen the set of fields is composed on: the whole dictionary, searchable, grouped the way the
 * server groups it. Values are given only to be read: they say which fields the form is showing, and
 * are filled in on the form itself.
 */
export type FieldSelectorProps = {
	descriptors: FieldDescriptor[],
	/** Groups to offer the fields in; empty offers one flat list. */
	sections?: FieldSection[],
	/** Icons of the group titles, keyed by section id. */
	sectionIcons?: FieldIcons,
	/** Icons of the fields, as the list names them: the rows keep the face they have on the form. */
	fieldIcons?: FieldIcons,
	/** The set the form shows now: what the screen opens chosen. */
	rows?: string[],
	/**
	 * Values of the filter: a field carrying one is on the form even when no row names it, so the
	 * screen opens it chosen as well.
	 */
	values?: FilterValues,
	widget?: PageManager,
	close?: () => void,
	/** The set as the form is to keep it, in display order. */
	onApply?: (rows: string[]) => void,
};

export type FieldSelectorState = {
	selectedIds: string[],
	search: string,
	/** Groups the user opened; a group starts closed, a search opens them all. */
	openGroups: Record<string, boolean>,
};

export type FieldSelectorOptions = {
	descriptors: FieldDescriptor[],
	sections?: FieldSection[],
	sectionIcons?: FieldIcons,
	fieldIcons?: FieldIcons,
	rows?: string[],
	values?: FilterValues,
	parentWidget?: PageManager,
	onApply?: (rows: string[]) => void,
};

export type FieldFilterFormProps = {
	testId: string,
	/** Title of the section, worded by the screen the form stands in. */
	title?: string,
	descriptors: FieldDescriptor[],
	/** Groups to draw the fields in; empty draws one flat section. */
	sections?: FieldSection[],
	/** Icons of the group titles, keyed by section id. */
	sectionIcons?: FieldIcons,
	values: FilterValues,
	/** Rows of the current filter; empty leaves the visible set to the `default` of the fields. */
	rows?: string[],
	fieldIcons?: FieldIcons,
	entitySelectors?: EntitySelectorMap,
	gridId: string,
	parentWidget?: PageManager,
	/**
	 * Reads the values of a field whose reference book the dictionary left on the server; null leaves
	 * every field with what its descriptor carries.
	 */
	loadFieldItems?: FilterFieldItemsLoader | null,
	isFirst?: boolean,
	onChange: FieldChangeHandler,
	onOpenField?: FieldOpenHandler,
};

/** Both maps are keyed by group id; the flat section of an ungrouped list keys on an empty string. */
export type FieldFilterFormState = {
	/** Groups whose "show all fields" was tapped. */
	expandedGroups: Record<string, boolean>,
	/** Groups the user opened; a group starts closed. */
	openGroups: Record<string, boolean>,
};

/**
 * A sorting type as its consumer declares it: the label and the leading icon of the row.
 */
export type SortingType = {
	label: string,
	icon?: FieldIcon,
};

/** Sorting types the consumer offers, by sorting code. */
export type SortingTypeMap = Record<string, SortingType>;

export type SortingSectionProps = {
	testId: string,
	sorting: ListSorting,
	/** The selected type: the section is pure, so what it draws comes down as a prop. */
	sortType?: string,
	types: SortingTypeMap,
	isFirst?: boolean,
	onChange?: () => void,
};

export type FieldFilterDrawerProps = {
	filter: FieldFilterHost,
	widget?: PageManager,
	parentWidget?: PageManager,
	sorting?: ListSorting | null,
	sortTypes?: SortingTypeMap,
	onApply?: () => void,
};

export type FieldFilterDrawerState = {
	revision: number,
};

export type SavedFiltersSectionProps = {
	testId: string,
	filter: SavedFiltersHost,
	service: SavedFiltersApi,
	/** The strip as it is drawn, and the chip that is filled: both come down as props. */
	presets?: SavedFilter[],
	currentFilterId?: string | null,
	parentWidget?: PageManager,
	isFirst?: boolean,
	onChange?: () => void,
};

/** Presets and the selected one live in the filter and arrive as props: no copy is kept here. */
export type SavedFiltersSectionState = {
	loading: boolean,
};

export type SavedFilterBuilderProps = {
	filter: SavedFiltersHost,
	service: SavedFiltersApi,
	preset?: SavedFilter | null,
	widget?: PageManager,
	close?: () => void,
	/** The preset as it went into the store, handed over the moment the form closes. */
	onSaved?: (preset: SavedFilter) => void,
	/** Repaint of the screen behind the form: the save may still be taken back. */
	onChanged?: () => void,
};

export type SavedFilterBuilderState = {
	name: string,
	values: FilterValues,
	nameError: boolean,
	saving: boolean,
};

export type SavedFilterBuilderOptions = {
	filter: SavedFiltersHost,
	service: SavedFiltersApi,
	preset?: SavedFilter | null,
	parentWidget?: PageManager,
	onSaved?: (preset: SavedFilter) => void,
	onChanged?: () => void,
};

export type SavedFiltersEditProps = {
	filter: SavedFiltersHost,
	service: SavedFiltersApi,
	widget?: PageManager,
	/** The list changed in the store: the caller draws the same one and has to repaint it. */
	onChanged?: () => void,
	close?: () => void,
};

/** Projection of the store: the rows this screen is drawing right now. */
export type SavedFiltersEditState = {
	presets: SavedFilter[],
	defaultPresetId: string | null,
	loading: boolean,
};

export type SavedFiltersEditOptions = {
	filter: SavedFiltersHost,
	service: SavedFiltersApi,
	parentWidget?: PageManager,
	onChanged?: () => void,
};

/**
 * One screen of the filter as a sheet: every one of them is opened the same way, see
 * src/layout/sheet.
 */
export type FilterSheetOptions = {
	title: string,
	/** Wide title at the left edge instead of the centered dialog one. */
	largeTitle?: boolean,
	parentWidget?: PageManager,
	component: (params: FilterSheetSlot) => FilterSheetContent,
};

/** What the sheet hands to the screen it holds: its widget and the way to close it. */
export type FilterSheetSlot = {
	widget: PageManager,
	close: () => void,
};

/**
 * A mounted JaNative component. The framework ships no typings for one, so the alias names the
 * slot instead of describing it - same as FieldIcon in dto.d.ts.
 */
export type FilterSheetContent = unknown;
