import { Core } from 'im.v2.application.core';
import { Utils } from 'im.v2.lib.utils';
import { type ImModelChat, type ImModelRecentItem } from 'im.v2.model';

import { type CollabTransitionCandidate } from '../types/transition';

export const collectCollabTransitionCandidates = (parentChatId: number): CollabTransitionCandidate[] => {
	const chatIds: number[] = Core.getStore().getters['counters/getTreeChatIdsWithUnread'](parentChatId);
	const parentDialogId = Utils.dialog.buildChatDialogId(parentChatId);
	const shownChatId: number = Core.getStore().getters['recent/getShownChatId'](parentDialogId);

	return chatIds.map((chatId: number): CollabTransitionCandidate => {
		const dialogId = Utils.dialog.buildChatDialogId(chatId);

		return {
			chatId,
			dialogId,
			lastMessageId: getLastMessageId(dialogId),
			isParent: chatId === parentChatId,
			isShownInRecent: chatId === shownChatId,
		};
	});
};

function getLastMessageId(dialogId: string): number
{
	const chat: ?ImModelChat = Core.getStore().getters['chats/get'](dialogId);
	if (chat?.lastMessageId > 0)
	{
		return chat.lastMessageId;
	}

	const recentItem: ?ImModelRecentItem = Core.getStore().getters['recent/get'](dialogId);

	return Number(recentItem?.ownMessageId) || 0;
}
