import { RecentType } from 'im.v2.const';

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
