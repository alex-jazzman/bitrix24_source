/* eslint-disable */
type SelectorItem = {
	getEntityId: () => string;
	getId: () => string | number;
};

type SelectorItemId = [string, string];

type DialogEntity = {
	id: string;
	options?: DialogEntityOptions;
	dynamicLoad?: boolean;
	dynamicSearch?: boolean;
};

type DialogEntityOptions = {
	selectMode?: string;
	allowSelectRootDepartment?: boolean;
	allowFlatDepartments?: boolean;
	emailUsers?: boolean;
	inviteEmployeeLink?: boolean;
	inviteGuestLink?: boolean;
};

declare namespace BX.Disk.Rights {
	function getAccessCodeByItem(item: SelectorItem): string | null;

	function getItemIdByAccessCode(accessCode: string): SelectorItemId | null;

	function getDialogEntities(isBitrix24: boolean): DialogEntity[];
}
