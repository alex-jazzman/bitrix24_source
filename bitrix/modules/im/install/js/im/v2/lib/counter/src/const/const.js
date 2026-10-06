import { Core } from 'im.v2.application.core';

export const RecentTypeClearHandlers = [
	(recentType, parentChatId) => Core.getStore().dispatch('chats/clearMarkedChatsByRecentType', { recentType, parentChatId }),
	(recentType, parentChatId) => Core.getStore().dispatch('counters/clearByRecentType', { recentType, parentChatId }),
	(recentType, parentChatId) => Core.getStore().dispatch('messages/anchors/removeAllAnchorsByRecentType', { recentType, parentChatId }),
];

export const CounterClearActions = [
	() => Core.getStore().dispatch('counters/clear'),
	() => Core.getStore().dispatch('chats/clearMarkedChats'),
	() => Core.getStore().dispatch('messages/anchors/removeAllAnchors'),
];
