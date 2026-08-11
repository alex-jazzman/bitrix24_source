import { type JsonObject } from 'main.core';

import { type SelectorEntityItem } from 'im.v2.const';

import { RoleItem } from './create-chat';

export type ChatUpdateConfig =
	GroupChatUpdateConfig
	| ChannelUpdateConfig
	| CollabChatUpdateConfig
	| CollabUpdateConfig;

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

type BaseUpdateConfig = {
	title: string,
	avatar: File | string,
	ownerId: number,
	description: string,
	manageUsersAdd: RoleItem,
	manageUsersDelete: RoleItem,
	manageUi: RoleItem,
	manageMessages: RoleItem,
	manageGuestInvites: RoleItem,

	addedMemberEntities: SelectorEntityItem[],
	deletedMemberEntities?: SelectorEntityItem[],
	addedManagers?: number[],
	deletedManagers?: number[],
};

type GroupChatUpdateConfig = BaseUpdateConfig & { searchable: boolean };

type ChannelUpdateConfig = BaseUpdateConfig & { searchable: boolean };

type CollabChatUpdateConfig = BaseUpdateConfig;

export type GetMemberEntitiesConfig = {
	memberEntities: Array<[string, number]>,
	userCount: number,
	areUsersCollapsed: boolean,
};
