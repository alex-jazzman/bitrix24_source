import {CounterModelState} from "../../../model/counter/src/types";

declare type PendingOperation<TData extends object> = {
	chatId: number,
	data: TData,
	actionUuid: string,
	timestamp: number,
	type: string,
}

declare type LocalReadMessage = {
	messageIdList: Array<number>,
	unreadMessages: Array<number>,
	lastReadId: number,
	lastMessageId: number,
	expectedCounter: number,
	delta: number,
}

declare type NewParticipantPullMessage = {
	incomingCounterState: CounterModelState,
	messageId: number,
	previousMessageId: number,
}