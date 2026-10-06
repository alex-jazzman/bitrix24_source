export type SelectorTag = {
	getEntityId(): string;
	getId(): string | number;
};

export type SelectorPreselectedItem = [string, string | number];

export type SelectorEntity = 'user' | 'department' | 'mail_mailbox';

export type ParsedSelectorItem = {
	entity: SelectorEntity,
	id: number,
	isFlat: boolean,
};

export type UserSelectorOptions = {
	intranetUsersOnly: boolean,
	emailUsers: boolean,
	inviteEmployeeLink: boolean,
	inviteGuestLink: boolean,
};

export type SelectorEntityConfig = {
	id: SelectorEntity,
	dynamicLoad: boolean,
	dynamicSearch: boolean,
	options: { [key: string]: unknown },
};
