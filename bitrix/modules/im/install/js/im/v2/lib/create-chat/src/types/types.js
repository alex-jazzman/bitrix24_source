import { UserRole, SelectorEntity } from 'im.v2.const';

type UserRoleItem = $Values<typeof UserRole>;

export type CreateChatFields = {
	chatTitle: string,
	avatarFile: ?File,
	chatMembers: number[],
	settings: {
		isAvailableInSearch: boolean,
		description: string,
	},
	rights: {
		ownerId: number,
		managerIds: number[],
		manageUsers: UserRoleItem,
		manageSettings: UserRoleItem,
		manageUi: UserRoleItem,
	},
	parentChatId: number,
};

export type PreselectedMemberItem = {
	type: SelectorEntity.user | SelectorEntity.department,
	id: number | string,
};

export type OpenChatCreationParams = {
	preselectedMembers?: PreselectedMemberItem[],
	ownerId?: number,
	includeCurrentUser?: boolean,
	clearCurrentCreation?: boolean,
	parentChatId?: number,
};
