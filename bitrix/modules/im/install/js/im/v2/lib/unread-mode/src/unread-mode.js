import { Core } from 'im.v2.application.core';
import { type RecentTypeItem } from 'im.v2.const';
import { type ImModelChat } from 'im.v2.model';

export const UnreadModeManager = {
	removeItemFromList(recentType: RecentTypeItem, dialogId: string)
	{
		const { chatId, isMuted }: ImModelChat = Core.getStore().getters['chats/get'](dialogId);

		if (!isMuted && hasChatCounter(chatId))
		{
			return;
		}

		this.clearByDialogId(recentType, dialogId);
	},
	clearClosedChats(recentType: RecentTypeItem)
	{
		const collection = Core.getStore().getters['recent/getUnreadCollection']({ type: recentType });
		const dialogIds = collection.map(({ dialogId }) => dialogId);

		const dialogIdsToRemove = dialogIds.filter((dialogId) => {
			return !Core.getStore().getters['application/isChatOpen'](dialogId);
		});

		dialogIdsToRemove.forEach((dialogId) => {
			this.clearByDialogId(recentType, dialogId);
		});
	},
	clearDialogIdBySections(sections: RecentTypeItem[], dialogId: string)
	{
		sections.forEach((recentSection) => {
			this.clearByDialogId(recentSection, dialogId);
		});
	},
	clearByDialogId(recentType: RecentTypeItem, dialogId: string)
	{
		void Core.getStore().dispatch('recent/clearByDialogId', {
			dialogId,
			type: recentType,
			unread: true,
		});
	},
};

function hasChatCounter(chatId: number): boolean
{
	const hasUnreadMessage = Core.getStore().getters['messages/getFirstUnread'](chatId);
	const hasUnreadStatus = Core.getStore().getters['counters/getUnreadStatus'](chatId);

	return hasUnreadMessage || hasUnreadStatus;
}
