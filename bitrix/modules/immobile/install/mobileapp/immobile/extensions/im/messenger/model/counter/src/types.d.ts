import { MessengerModel } from '../../base';

declare type CounterModelState = {
	chatId: number,
	parentChatId: number,
	type: string,
	counter: number,
}

declare type CounterModelActions = 'counterModel/set'
	| 'counterModel/clear'
	;

declare type CounterModelMutation = 'counterModel/set'
	| 'counterModel/clear'
	;

declare type CounterClearActions = 'clear';
declare type CounterClearData = {}

declare type CounterSetActions = 'set';
declare type CounterSetData = {
	counterList: Array<CounterModelState>
}

declare type CounterModelCollection = {
	collection: Record<number, CounterModelState>,
}

export type CounterModel = MessengerModel<CounterModelCollection>;
