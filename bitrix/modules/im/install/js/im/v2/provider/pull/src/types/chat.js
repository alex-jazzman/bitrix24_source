import { type JsonObject } from 'main.core';

import { type InputActionType } from 'im.v2.lib.input-action';
import { type RecentTypeItem, type ParentChatIdType } from 'im.v2.const';

import { type RawChat, type RawFile, type RawMessage, type RawUser } from './common';

export type ChatOwnerParams = {
	chatId: number,
	dialogId: string,
	userId: number
};

export type ChatManagersParams = {
	chatId: number,
	dialogId: string,
	list: number[]
};

export type ChatUserAddParams = {
	chatId: number,
	dialogId: string,
	chatTitle: string,
	chatOwner: number,
	chatExtranet: boolean,
	containsCollaber: boolean,
	users: {[userId: string]: RawUser},
	newUsers: number[],
	userCount: number,
	guestCount: number,
	relations: Relation[],
};

export type ChatUserLeaveParams = {
	chatId: number,
	chatTitle: string,
	dialogId: string,
	message: string,
	userCount: number,
	guestCount: number,
	userId: number,
	chatExtranet: boolean,
	containsCollaber: boolean,
	relations: Relation[],
};

export type StartWritingParams = {
	dialogId: string,
	userId: number,
	userName: string
};

export type InputActionNotifyParams = {
	dialogId: string,
	userId: number,
	userName: string,
	type: InputActionType,
	statusMessageCode: string | null,
	userFirstName: string | null,
	duration: number | null,
};

export type ChatUnreadParams = {
	chatId: number,
	dialogId: string,
	chat: RawChat,
	message: RawMessage,
	files: RawFile[],
	users: RawUser[],
	active: boolean,
	muted: boolean,
	counter: number,
	markedId: number | "0",
	lines: boolean,
	parentChatId: number,
	recentConfig: {
		chatId: number,
		sections: RecentTypeItem[],
	},
};

export type ChatMuteNotifyParams = {
	chatId: number,
	dialogId: string,
	chat: RawChat,
	message: RawMessage,
	files: RawFile[],
	users: RawUser[],
	muted: boolean,
	mute: boolean,
	counter: number,
	lines: boolean,
	unread: boolean,
	recentConfig: {
		chatId: number,
		sections: RecentTypeItem[],
	},
};

export type ChatRenameParams = {
	chatId: number,
	name: string
};

export type ChatAvatarParams = {
	chatId: number,
	avatar: string
};

export type ChatHideParams = {
	dialogId: string,
	chatId: string,
	lines: Object | false,
};

export type ChatConvertParams = {
	dialogId: string,
	oldType: string,
	newType: string,
	newPermissions: JsonObject,
	newTypeParams: ?JsonObject,
};

export type ChatDeleteParams = {
	dialogId: string,
	chatId: number,
	userId: string,
	type: string,
	parentChatId: number,
};

export type MessagesAutoDeleteDelayParams = {
	chatId: number,
	dialogId: string,
	delay: number,
};

export type ChatReadAllParams = {
	recentSection: RecentTypeItem,
	parentChatId: ParentChatIdType,
};
