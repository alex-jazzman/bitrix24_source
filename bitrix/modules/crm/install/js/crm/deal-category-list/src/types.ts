export type DealCategoryDto = {
	id: number,
	name: string,
	sort: number,
	createdDate: string | null,
	isDefault: boolean,
	stageEditorUrl: string,
};

export type DealCategoryListActionIds = {
	edit: string,
	editStages: string,
	delete: string,
};

export type DealCategoryListOptions = {
	gridId: string,
	openEditId: number | null,
	categoryCount: number,
	quantityLimit: number,
	infoHelperId: string,
	actionIds: DealCategoryListActionIds,
};

export type DealCategoryListAction = {
	actionId: string,
	id: number,
};

export type DealCategoryBulkDeleteAction = {
	actionId: 'bulk-delete',
	controller: 'crm.api.dealcategory.grid',
	method: 'POST',
};

export type DealCategoryMutationFields = {
	name: string,
	sort: string,
};

export type DealCategoryGridRow = {
	getNode: () => HTMLTableRowElement,
	select: () => void,
};

export type DealCategoryGrid = {
	getRows: () => {
		getById: (id: string | number) => DealCategoryGridRow | null,
		getSelectedIds: () => number[],
		unselectAll: () => void,
	},
	getActionsPanel?: () => {
		getForAllCheckbox?: () => { checked: boolean } | null,
	} | null,
	editSelected: () => void,
	reload: (url?: string) => void,
};

export type DealCategorySlider = {
	close: () => boolean,
};

export type DealCategoryBatchDeleteItemError = {
	id: number,
	name: string,
	code: string,
	message: string,
};

export type DealCategoryBatchDeleteResult = {
	STATUS?: 'PROGRESS' | 'COMPLETED',
	PROCESSED_ITEMS?: number,
	TOTAL_ITEMS?: number,
	SUMMARY_HTML?: string,
	WARNING?: string | null,
	successCount?: number,
	errorCount?: number,
	itemErrors?: DealCategoryBatchDeleteItemError[],
};
