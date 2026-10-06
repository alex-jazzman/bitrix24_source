/* eslint-disable */
type SelectorTag = {
	getEntityId(): string;
	getId(): string | number;
};

type ParsedSelectorItem = {
	entity: SelectorEntity;
	id: number;
	isFlat: boolean;
};

type SelectorEntity = 'user' | 'department' | 'mail_mailbox';

type SelectorPreselectedItem = [string, string | number];

type UserSelectorOptions = {
	intranetUsersOnly: boolean;
	emailUsers: boolean;
	inviteEmployeeLink: boolean;
	inviteGuestLink: boolean;
};

type SelectorEntityConfig = {
	id: SelectorEntity;
	dynamicLoad: boolean;
	dynamicSearch: boolean;
	options: {
		[key: string]: unknown;
	};
};

declare namespace BX.Mail.Lib.EntitySelector {
	function parseSelectorTag(tag: SelectorTag): ParsedSelectorItem | null;

	function buildDepartmentItemId(id: number, isFlat: boolean): string;

	function getSelectorItemByAccessCode(code: string): SelectorPreselectedItem | null;

	function getAccessCodeBySelectorTag(tag: SelectorTag): string | null;

	function getIntranetUserSelectorOptions(): UserSelectorOptions;

	function getUserDepartmentEntities(userOptions?: UserSelectorOptions): SelectorEntityConfig[];
}
