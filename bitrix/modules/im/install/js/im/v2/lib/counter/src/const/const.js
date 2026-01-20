import { ChatType } from 'im.v2.const';

export const CounterClearActionsByChatType = {
	[ChatType.taskComments]: [
		'chats/clearCountersByChatType',
		'recent/resetTasksUnreadStatus',
		'counters/clearUnloadedTaskCounters',
		'messages/anchors/removeAllAnchorsByChatType',
	],
};

export const CounterClearActionsDefault = [
	'chats/clearCounters',
	'recent/resetUnreadStatus',
	'counters/clear',
	'messages/anchors/removeAllAnchors',
];
