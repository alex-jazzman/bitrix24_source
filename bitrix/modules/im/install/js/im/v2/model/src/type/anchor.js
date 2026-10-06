import { type AnchorType, type RecentTypeItem } from 'im.v2.const';

export type Anchor = {
	chatId: number;
	fromUserId: number;
	messageId: number;
	parentChatId: number;
	parentMessageId: number;
	type: AnchorType;
	subType: string | null;
	recentSections: RecentTypeItem[]
};
