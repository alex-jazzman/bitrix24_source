import { Core } from 'im.v2.application.core';
import { ChatType } from 'im.v2.const';

type ChatTypeItem = $Values<typeof ChatType>;
type ClearHandlerByChatTypeMap = {
	[chatType: ChatTypeItem]: Array<(type: ChatTypeItem) => void>
}

export const CounterClearHandlersByChatType: ClearHandlerByChatTypeMap = {
	[ChatType.taskComments]: [
		(type) => Core.getStore().dispatch('counters/clearByRecentType', { recentType: type }),
		(type) => Core.getStore().dispatch('chats/clearMarkedChatsByType', { type }),
		(type) => Core.getStore().dispatch('messages/anchors/removeAllAnchorsByChatType', { type }),
	],
};

export const CounterClearActions = [
	() => Core.getStore().dispatch('counters/clear'),
	() => Core.getStore().dispatch('chats/clearMarkedChats'),
	() => Core.getStore().dispatch('messages/anchors/removeAllAnchors'),
];
