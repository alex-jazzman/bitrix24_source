import { type RecentTypeItem } from 'im.v2.const';
import { type RawSticker, type RawCopilot } from 'im.v2.provider.service.types';

import { type RawChat, type RawFile, type RawUser, type RawMessage } from './common';
import { type RawReaction } from './message';

type RecentChat = RawChat & { dialogId: string };

export type RecentUpdateParams = {
	dialogId: string,
	additionalMessages: RawMessage[],
	chat: RecentChat,
	counter: number,
	lastActivityDate: string,
	message: RawMessage,
	files: RawFile[],
	users: RawUser[],
	reactions: RawReaction[],
	stickers: RawSticker[],
	recentConfig: {
		chatId: number,
		sections: RecentTypeItem[],
	},
};

export type RecentPinChatParams = {
	active: boolean,
	additionalMessages: RawMessage[],
	chat: RecentChat,
	copilot: RawCopilot,
	dialogId: string,
	files: RawFile[],
	message: RawMessage,
	recentConfig: {
		chatId: number,
		sections: RecentTypeItem[],
	},
	stickers: RawSticker[],
	users: RawUser[],
};

export type UserShowInRecentParams = {
	items: UserShowInRecentItem[],
};

export type RecentHideParams = {
	chatId: number,
	dialogId: string,
	lines: boolean,
	recentConfigToHide: {
		chatId: number,
		sections: RecentTypeItem[],
	}
};

type UserShowInRecentItem = {
	user: RawUser,
	date: string,
};
