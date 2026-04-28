import type { RecentTypeItem } from 'im.v2.const';
import type { RawSticker, RawCopilot } from 'im.v2.provider.service.types';
import type { RawChat, RawFile, RawUser, RawMessage } from './common';

export type RecentUpdateParams = {
	additionalMessages: RawMessage[],
	chat: RawChat,
	counter: number,
	lastActivityDate: string,
	messages: RawMessage[],
	files: RawFile[],
	users: RawUser[],
};

export type RecentPinChatParams = {
	active: boolean,
	additionalMessages: RawMessage[],
	chat: RawChat,
	copilot: RawCopilot,
	dialogId: string,
	files: RawFile[],
	messages: RawMessage[],
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
