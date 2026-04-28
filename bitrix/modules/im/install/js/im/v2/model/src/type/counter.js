import type { RecentType } from 'im.v2.const';

export type CounterItem = {
	chatId: number,
	parentChatId: number,
	counter: number,
	isMarkedAsUnread: boolean,
	isMuted: boolean,
	recentSections: RecentSectionItem[],
};

type RecentSectionItem = $Values<RecentType>;
