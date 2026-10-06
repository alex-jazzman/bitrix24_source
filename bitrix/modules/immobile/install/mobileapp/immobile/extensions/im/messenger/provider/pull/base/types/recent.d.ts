import { RawChat, RawFile, RawMessage, RawUser } from './common';
import { RawReaction } from '../../../../model/messages/src/reactions/types';
import { StickerState } from '../../../../model/sticker-pack/src/types';
import { CopilotSyncData } from '../../../services/sync/types/sync-list-result';
import { DialogId } from '../../../../types/common';

export type RecentConfigSections = Array<SectionRecentValue>;

export type SectionRecentType = {
	default: 'default',
	copilot: 'copilot',
	openChannel: 'openChannel',
	collab: 'collab',
	tasksTask: 'tasksTask',
	lines: 'lines',
	collabDefault: 'collabDefault',
	collabChats: 'collabChats',
	calendar: 'calendar',
}

export type SectionRecentValue = SectionRecentType[keyof SectionRecentType];

declare type RecentUpdateParams = {
	chatId: number,
	dialogId: DialogId,
	chat: RawChat,
	parentChatId: number,
	counterType: string,
	lastActivityDate: string | null,
	message: RawMessage | null,
	ownMessageId?: number,
	ownMessage?: RawMessage | null,
	additionalMessages: RawMessage[],
	users: RawUser[],
	files: RawFile[],
	reactions: RawReaction[],
	stickers: Array<StickerState>,
	copilot: CopilotSyncData | null,
	recentConfig: {
		chatId: number,
		sections: RecentConfigSections,
	},
};
