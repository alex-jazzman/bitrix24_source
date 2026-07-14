import { type JsonObject } from 'main.core';

import { ChatType, UserRole, type SelectorEntityItem } from 'im.v2.const';

export type RoleItem = $Keys<typeof UserRole>;
export type ChatCreateConfig =
	GroupChatCreateConfig
	| ChannelCreateConfig
	| ConferenceCreateConfig
	| CopilotCreateConfig
	| CollabChatCreateConfig
	| CollabCreateConfig
	| ExtendChatConfig;

export type CollabCreateConfig = {
	title: string,
	description?: string,
	avatar?: File | string,
	ownerId: number,
	moderatorMembers: number[],
	permissions: JsonObject,
	options: JsonObject,
	messagesAutoDeleteDelay: number,
};

type BaseCreateConfig = {
	title: string,
	avatar: File | string,
	memberEntities: SelectorEntityItem[],
	ownerId: number,
	managers: number[],
	description: string,
	manageUsersAdd: RoleItem,
	manageUsersDelete: RoleItem,
	manageUi: RoleItem,
	manageMessages: RoleItem,
	manageSettings: RoleItem,
};

type GroupChatCreateConfig = BaseCreateConfig & {
	searchable: boolean,
	messagesAutoDeleteDelay: number,
};

type ChannelCreateConfig = BaseCreateConfig & {
	type: ChatType.channel,
	searchable: boolean,
};

type ConferenceCreateConfig = BaseCreateConfig & {
	entityType: ChatType.videoconf,
	conferencePassword: string,
};

type CollabChatCreateConfig = BaseCreateConfig & {
	messagesAutoDeleteDelay: number,
	parentChatId: number,
};

type CopilotCreateConfig = {
	type: ChatType.copilot,
	copilotMainRole: string,
};

type ExtendChatConfig = {
	title: null,
	description: null,
	users: number[],
	ownerId: number,
};
