import { Core } from 'im.v2.application.core';
import { type RecentTypeItem } from 'im.v2.const';
import { type ImModelChat } from 'im.v2.model';

type UnreadContext = {
	recentSections: RecentTypeItem[],
	dialogId: string,
	parentChatId?: number,
};

export const UnreadModeManager = {
	removeItemFromList(params: UnreadContext)
	{
		const { chatId, isMuted }: ImModelChat = Core.getStore().getters['chats/get'](params.dialogId);

		if (!isMuted && hasChatCounter(chatId))
		{
			return;
		}

		this.removeDialogIdBySections(params);
	},
	removeDialogIdBySections(params: UnreadContext)
	{
		const { recentSections, dialogId, parentChatId } = params;

		recentSections.forEach((type) => {
			void Core.getStore().dispatch('recent/clearByDialogId', {
				dialogId,
				parentChatId,
				type,
				unread: true,
			});
		});
	},
	removeClosedChats(recentType: RecentTypeItem)
	{
		const collection = Core.getStore().getters['recent/getUnreadCollection']({ type: recentType });
		const dialogIds = collection.map(({ dialogId }) => dialogId);

		const dialogIdsToRemove = dialogIds.filter((dialogId) => {
			return !Core.getStore().getters['application/isChatOpen'](dialogId);
		});

		dialogIdsToRemove.forEach((dialogId) => {
			this.removeDialogIdBySections({ recentSections: [recentType], dialogId });
		});
	},
};

function hasChatCounter(chatId: number): boolean
{
	const hasUnreadMessage = Core.getStore().getters['messages/getFirstUnread'](chatId);
	const hasUnreadStatus = Core.getStore().getters['counters/getUnreadStatus'](chatId);
	const hasChildrenCounter = Core.getStore().getters['counters/getChildrenTotalCounter'](chatId) > 0;

	return hasUnreadMessage || hasUnreadStatus || hasChildrenCounter;
}
