import { type JsonObject } from 'main.core';

import { MemberEntity, RoleItem } from './create-chat';

export type ChatUpdateConfig =
	GroupChatUpdateConfig
	| ChannelUpdateConfig
	| CollabChatUpdateConfig
	| CollabUpdateConfig;

type BaseUpdateConfig = {
	title: string,
	avatar: File | string,
	ownerId: number,
	description: string,
	manageUsersAdd: RoleItem,
	manageUsersDelete: RoleItem,
	manageUi: RoleItem,
	manageMessages: RoleItem,

	addedMemberEntities: MemberEntity[],
	deletedMemberEntities?: MemberEntity[],
	addedManagers?: number[],
	deletedManagers?: number[],
};

type GroupChatUpdateConfig = BaseUpdateConfig & { searchable: boolean };

type ChannelUpdateConfig = BaseUpdateConfig & { searchable: boolean };

type CollabChatUpdateConfig = BaseUpdateConfig;

export type CollabUpdateConfig = {
	title: string,
	avatar: File | string,
	description: string,
	groupSettings: {
		ownerId: number,
		addModeratorMembers: number[],
		deleteModeratorMembers: number[],
		permissions: JsonObject,
		options: JsonObject
	},
};

export type GetMemberEntitiesConfig = {
	memberEntities: Array<[string, number]>,
	userCount: number,
	areUsersCollapsed: boolean,
};
