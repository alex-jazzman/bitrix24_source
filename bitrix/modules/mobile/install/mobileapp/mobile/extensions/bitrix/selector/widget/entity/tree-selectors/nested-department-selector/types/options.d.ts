type NestedDepartmentSelectorOptions = {
	initSelectedIds?: Array<[string, string | number]> | null;
	undeselectableIds?: Array<[string, string | number]> | null;
	widgetParams: {
		backdrop?: {
			mediumPositionPercent?: number;
			horizontalSwipeAllowed?: boolean;
		};
		sendButtonName?: string;
		title?: string;
	};
	allowMultipleSelection?: boolean;
	closeOnSelect?: boolean;
	events?: {
		onClose?: (selectedItems: Array<Record<string, unknown>>) => void;
	};
	createOptions?: {
		enableCreation?: boolean;
	};
	selectOptions?: {
		canUnselectLast?: boolean;
		onUnselectLast?: () => void;
		singleEntityByType?: boolean;
	};
	canUseRecent?: boolean;
	provider: {
		context: string;
		options: {
			useLettersForEmptyAvatar?: boolean;
			allowFlatDepartments?: boolean;
			allowSelectRootDepartment?: boolean;
			onlyManagedHierarchy?: boolean;
			unselectableDepartmentButtons?: boolean;
			addMetaUser?: boolean;
			useRestrictedVirtualRoot?: boolean;
			restrictedVirtualRootTitle?: string;
			allowedDepartmentIds?: Array<string | number>;
			disableUserSearch?: boolean;
			recentItemsLimit?: number;
			userOptions?: {
				emailUsers?: boolean;
				inviteEmployeeLink?: boolean;
			};
			enabledTabs?: NestedDepartmentSelectorTabConfig;
			onItemsLoadedFromServer?: (items: Array<NestedDepartmentSelectorTreeItem>) => void;
			onInitialItemsLoad?: (items: Array<NestedDepartmentSelectorTreeItem>) => void;
			getScopeId?: () => NestedDepartmentSelectorScopeId;
			findInTree?: (
				root: NestedDepartmentSelectorTreeItem,
				predicate: (item: NestedDepartmentSelectorTreeItem) => boolean,
			) => NestedDepartmentSelectorTreeItem | null;
		};
	};
	customTabsConfig?: Array<string> | null;
	searchOptions?: {
		searchPlaceholderWithoutCreation?: string;
		onSearchCancelled?: (data: NestedDepartmentSelectorSearchCancelledData) => void;
		onSearch?: (data: NestedDepartmentSelectorSearchQueryData) => void;
	};
	leftButtons?: Array<Record<string, unknown>>;
};
