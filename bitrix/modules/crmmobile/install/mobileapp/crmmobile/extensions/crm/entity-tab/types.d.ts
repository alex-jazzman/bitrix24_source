/**
 * What the tab tells the unified filter about its list. The rest of the configuration is the same
 * for every CRM list and lives in `crm/entity-tab/unified-filter`.
 */
export type CrmUnifiedFilterParams = {
	entityTypeName: string,
	categoryId?: number | null,
	/** Runs when the user applies the drawer: the tab reloads its list. */
	onApply: () => void,
	/** Hands the tab the filter itself once the drawer graph is loaded, see ListFilterEntry. */
	onResolve: (filter: ListFilterInstance) => void,
	/** The entity type the list shows at the moment of an event: a funnel switch may change it. */
	getEntityTypeName: () => string,
	/** The view of the tab at the moment of an event: `list` or `kanban`. */
	getView: () => string,
	/** Mode of the portal (`SIMPLE`, `CLASSIC`) from the tabs response. */
	getCrmMode: () => string | null,
};

/** The list of a tab as the filter addresses it: an entity type and a funnel. */
export type CrmListContext = {
	entityTypeName: string,
	categoryId: number,
};

/**
 * Conditions of a list request, keyed the way the filter storage shared with the web keys them
 * (`CLOSEDATE_datesel`, `OPPORTUNITY_from`).
 */
export type CrmFilterConditions = Record<string, string | number | Array<string | number>>;

/** Half of the list request the filter fills: the conditions, the search string and the preset. */
export type CrmListLoadExtra = {
	search?: string,
	filter?: CrmFilterConditions,
	filterParams: { FILTER_PRESET_ID: string },
};

/**
 * Params of the list action as the tab hands them to `StatefulList`. The filter writes its own half
 * and returns the whole, so the tab passes on what it received.
 */
export type CrmListActionParams = {
	loadItems: { extra: CrmListLoadExtra },
};

/** What the search bar of the tab has just said. */
export type EntityTabSearchEvent = {
	text?: string,
	/** The user has closed the search instead of searching. */
	isCancel?: boolean,
	/** The counter the row of the search bar stands for, when a counter was tapped. */
	counter?: { code?: string } | null,
	params?: CrmListActionParams,
};

/**
 * One of the two filters of a CRM list, as the tab asks it: saved presets behind the search bar, or
 * the unified drawer. Everything the two do differently is answered through this interface - what a
 * search means, what the request carries, which buttons and menu items the tab shows, whether the
 * cached list still answers.
 *
 * The mode is replaced and not switched: the answer of the server about the flag may arrive when the
 * list is already drawn (`syncUnifiedFiltersMode`), and a tab that has changed its mind builds the
 * other mode instead of teaching this one both.
 */
export interface EntityTabFilterMode {
	applySearch(event: EntityTabSearchEvent): void;
	showSearchBar(): void;
	/** The list is narrowed by something. */
	isActive(): boolean;
	/** Buttons of the navigation bar the filter owns. */
	getMenuButtons(): ListFilterButton[];
	/** The counters are offered as items of the "---" menu. */
	hasCounterMenu(): boolean;
	/** What has to be read before a counter is applied. */
	prepareCounter(): Promise<void>;
	applyActionParams(actionParams: CrmListActionParams): CrmListActionParams;
	/** A reload has to carry the params of the request again. */
	needsFreshActionParams(): boolean;
	/** The list has been renamed - a funnel switch. */
	setContext(context: CrmListContext): void;
	/** Conditions for the actions of the tab that are not the list: the sums of the stages. */
	getConditions(): CrmFilterConditions | null;
	/** The filter the view writes over the request, when the mode has one of its own. */
	getViewFilter(): EntityTabLegacyFilter | null;
	/** The order of the list is picked in the drawer and not in the "---" menu. */
	hasDrawerSorting(): boolean;
	canUseCache(): boolean;
}

/**
 * The filter of the previous generation (`crm/entity-tab/filter`), typed by what the tab and its
 * views call of it. Owned by the tab: it is rebuilt when the filter is cleared or the funnel changes.
 */
export type EntityTabLegacyFilter = {
	isActive: () => boolean,
	hasSearchText: () => boolean,
	getSearchString: () => string,
	getPresetId: () => string | null,
	getCounterId: () => string | null,
	getEmptyFilterPresetId: () => string,
	getData: () => CrmFilterConditions,
	hasSelectedNotDefaultPreset: (searchRef?: string) => boolean,
	set: (state: { presetId?: string | null, counterId?: string | null, search?: string }) => EntityTabLegacyFilter,
	setWasShown: () => EntityTabLegacyFilter,
	unsetWasShown: () => EntityTabLegacyFilter,
};

/** What the mode of saved presets needs from the tab. */
export type EntityTabPresetFilterModeParams = {
	/** Read and not held: the tab builds a new filter when it is cleared or the funnel changes. */
	getFilter: () => EntityTabLegacyFilter,
	searchBarId: string,
	searchRef: string,
	/** Preset the tab opens under, as its entity type names it. */
	getTabPresetId: () => string,
	onCounterSearch: (params?: CrmListActionParams) => void,
	onPresetSearch: (params?: CrmListActionParams) => void,
};

/** What the mode of the unified drawer needs from the tab. */
export type EntityTabUnifiedFilterModeParams = {
	entityTypeName: string,
	categoryId: number,
	searchBarId: string,
	getLayout: () => PageManager,
	/** The order of the list, offered in the drawer only where the list has one. */
	getSortManager: () => ListSorting | null,
	/** Conditions the selected counter of the "---" menu stands for. */
	getCounterFields: () => CrmFilterConditions,
	hasSelectedCounter: () => boolean,
	/** The view of the tab, read by the analytics of the filter at the moment of an event. */
	getView: () => string,
	getCrmMode: () => string | null,
	onApply: () => void,
	onSearchApplied: (params?: CrmListActionParams) => void,
};
