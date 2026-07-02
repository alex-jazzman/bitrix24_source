import { type JsonObject } from 'main.core';

import { ChatType, UserRole } from 'im.v2.const';

export type RoleItem = $Keys<typeof UserRole>;
export type MemberEntity = [string, number | string];
export type ChatCreateConfig =
	GroupChatCreateConfig
	| ChannelCreateConfig
	| ConferenceCreateConfig
	| CopilotCreateConfig
	| CollabCreateConfig
	| CollabChatCreateConfig
	| ExtendChatConfig;

type BaseCreateConfig = {
	title: string,
	avatar: File | string,
	memberEntities: MemberEntity[],
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
