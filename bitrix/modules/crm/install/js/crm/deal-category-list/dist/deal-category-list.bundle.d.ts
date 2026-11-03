/* eslint-disable */
type DealCategoryListOptions = {
	gridId: string;
	openEditId: number | null;
	categoryCount: number;
	quantityLimit: number;
	infoHelperId: string;
	actionIds: DealCategoryListActionIds;
};

type DealCategoryListActionIds = {
	edit: string;
	editStages: string;
	delete: string;
};

type DealCategoryDto = {
	id: number;
	name: string;
	sort: number;
	createdDate: string | null;
	isDefault: boolean;
	stageEditorUrl: string;
};

declare namespace BX.Crm {
	class DealCategoryList extends BX.Event.EventEmitter {
		static init(options: DealCategoryListOptions): DealCategoryList;
		private constructor();
	}
}
