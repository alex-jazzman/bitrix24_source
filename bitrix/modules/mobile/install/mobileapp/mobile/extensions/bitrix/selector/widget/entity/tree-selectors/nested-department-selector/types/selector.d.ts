type NestedDepartmentSelectorScopeId = NestedDepartmentScopeId;

type NestedDepartmentSelectorScope = {
	id: string;
	title: string;
};

type NestedDepartmentSelectorTabConfig = Record<string, NestedDepartmentSelectorScope>;

type NestedDepartmentSelectorTreeItem = {
	id: string | number;
	entityId: string;
	title: string;
	type?: string | null;
	children?: Array<NestedDepartmentSelectorTreeItem>;
	[key: string]: unknown;
};

type NestedDepartmentSelectorPreparedOptions = NestedDepartmentSelectorOptions & {
	shouldAnimate: true;
};

type NestedDepartmentSelectorSearchOptions = NonNullable<NestedDepartmentSelectorOptions['searchOptions']>;

type NestedDepartmentSelectorScopeChangeParams = {
	text?: string;
	scope: NestedDepartmentSelectorScope;
	shouldResetSearch?: boolean;
};

type NestedDepartmentSelectorSearchQueryData = {
	text: string;
};

type NestedDepartmentSelectorSearchCancelledData = {
	scope: NestedDepartmentSelectorScope;
};
