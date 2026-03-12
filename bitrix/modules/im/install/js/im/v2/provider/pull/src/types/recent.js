import { RecentType } from 'im.v2.const';

import type { RawSticker, RawCopilot } from 'im.v2.provider.service.types';
import type { RawChat, RawFile, RawUser, RawMessage } from './common';

export type RecentTypeItem = $Values<typeof RecentType>;

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
	counterType: string,
	dialogId: string,
	files: RawFile[],
	messages: RawMessage[],
	recentConfig: {
		chatId: number,
		sections: $Values<typeof RecentType>[],
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
		sections: $Values<typeof RecentType>[],
	}
};

type UserShowInRecentItem = {
	user: RawUser,
	date: string,
};
