import { ChatType, UserRole } from 'im.v2.const';

export type RoleItem = $Keys<typeof UserRole>;
export type ChatConfig = {
	title: string,
	avatar: File,
	members: number[],
	ownerId: number,
	managers: number[],
	manageUsersAdd: RoleItem,
	manageUsersDelete: RoleItem,
	manageUi: RoleItem,
	manageSettings: RoleItem,
	manageMessages: RoleItem,
	isAvailableInSearch: boolean,
	description: string,
	entityType?: string,
	type?: string,
	conferencePassword: string,
	copilotMainRole: string,
};

type ChatTypeItem = $Keys<typeof ChatType>
export type RestChatConfig = {
	users: number[],
	type?: ChatTypeItem,
	entityType?: ChatTypeItem,
	title?: string,
	avatar?: string,
	description?: string,
	managers?: number[],
	ownerId?: number,
	searchable?: 'Y' | 'N',
	manageUsersAdd?: RoleItem,
	manageUsersDelete?: RoleItem,
	manageUi?: RoleItem,
	manageSettings?: RoleItem,
	manageMessages?: RoleItem,
	conferencePassword?: string,
};
