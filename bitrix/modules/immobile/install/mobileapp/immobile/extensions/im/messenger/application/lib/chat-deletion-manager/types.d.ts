import { DialogId } from '../../../types/common';

export type ChatDeletionOrigin = 'local' | 'pull';

export type ChatDeletionReason = 'delete' | 'leave' | 'hide';

// At least one of dialogId / chatId must be provided. The local path passes
// dialogId, the pull path passes chatId (from pull params).
export type ChatDeletionParams = {
	dialogId?: DialogId,
	chatId?: number,
	origin?: ChatDeletionOrigin,
	reason?: ChatDeletionReason,
};

// Params for announceDeleted(): callers that delete data themselves (sync,
// channel leave) supply the chat coordinates and legacy alert flags directly.
export type ChatDeletionAnnounceParams = {
	dialogId: DialogId,
	chatId?: number,
	parentChatId?: number,
	chatType?: string | null,
	children?: DialogId[],
	origin?: ChatDeletionOrigin,
	reason?: ChatDeletionReason,
	shouldShowAlert?: boolean,
	shouldSendDeleteAnalytics?: boolean,
	deleteByCurrentUserFromMobile?: boolean,
};

export type ChatDeletedEvent = {
	dialogId: DialogId,
	chatId: number,
	parentChatId: number,
	chatType: string | null,
	// open child dialogs (snapshot taken BEFORE data deletion)
	children: DialogId[],
	origin: ChatDeletionOrigin,
	reason: ChatDeletionReason,
};
