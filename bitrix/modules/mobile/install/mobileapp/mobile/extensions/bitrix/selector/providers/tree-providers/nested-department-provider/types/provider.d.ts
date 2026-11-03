type NestedDepartmentScope = {
	id: string,
	title: string,
};

type NestedDepartmentScopeId = string | Record<string, never>;

type NestedDepartmentProviderOptions = {
	enabledTabs: Record<string, NestedDepartmentScope>,
	addMetaUser?: boolean,
	disableUserSearch?: boolean,
	allowFlatDepartments?: boolean,
	allowSelectRootDepartment?: boolean,
	onlyManagedHierarchy?: boolean,
	unselectableDepartmentButtons?: boolean,
	allowedDepartmentIds?: Array<NestedDepartmentEntityId>,
	userOptions?: NestedDepartmentUserOptions,
	useLettersForEmptyAvatar?: boolean,
	useRestrictedVirtualRoot?: boolean,
	restrictedVirtualRootTitle?: string,
	recentItemsLimit?: number,
	entities?: Array<Record<string, unknown>> | Record<string, Record<string, unknown>>,
	getScopeId: () => NestedDepartmentScopeId,
	onItemsLoadedFromServer?: (items: Array<NestedDepartmentSelectorItem>) => void,
	onInitialItemsLoad?: (items: Array<NestedDepartmentSelectorItem>) => void,
};

type NestedDepartmentProviderEntity = {
	constructor: { getId: () => string },
	getEntityForDialog: () => NestedDepartmentEntityDialog,
	prepareItemForDrawing: (
		item: NestedDepartmentSelectorItem,
		initialEntity: NestedDepartmentSelectorItem,
	) => NestedDepartmentSelectorItem,
	findItem: (
		id: NestedDepartmentEntityId,
		items: Array<NestedDepartmentSelectorItem>,
	) => NestedDepartmentSelectorItem | null | undefined,
	setRoot?: (root: NestedDepartmentSelectorItem | null) => void,
};

type NestedDepartmentDialogData = {
	items: Array<NestedDepartmentSelectorItem>,
	recentItems?: Array<[string, NestedDepartmentEntityId]>,
	preselectedItems?: Array<[string, NestedDepartmentEntityId]>,
};

type NestedDepartmentLoadResponse = {
	data: {
		dialog: NestedDepartmentDialogData,
	},
};

type NestedDepartmentAjaxDialog = {
	id: 'mobile',
	context: string,
	preselectedItems: Array<[string, NestedDepartmentEntityId]>,
	entities: Array<NestedDepartmentEntityDialog>,
	recentItemsLimit?: number,
};
