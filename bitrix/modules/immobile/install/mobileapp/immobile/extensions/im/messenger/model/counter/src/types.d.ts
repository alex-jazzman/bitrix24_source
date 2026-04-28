import { MessengerModel, PayloadData } from '../../base';
import { SectionRecentValue} from "../../../provider/pull/base/types/recent";

declare type CounterModelState = {
	chatId: number,
	parentChatId: number,
	counter: number,
	isMarkedAsUnread: boolean,
	isMuted: boolean,
	recentSections: Array<SectionRecentValue>
}

declare type CounterModelCollection = {
	collection: Record<number, CounterModelState>,
}

export type CounterMessengerModel = MessengerModel<CounterModelCollection>;

export type CounterModelActions = 'counterModel/setList'
	| 'counterModel/readChildChatsCounters'
	| 'counterModel/readAllChats'
	| 'counterModel/readByRecentSection'
	| 'counterModel/setMuted '
	| 'counterModel/delete'
;

export type CounterModelMutation = 'counterModel/set'
	| 'counterModel/delete'
;

declare type CounterDeleteActions = 'delete';
export interface CounterDeleteData extends PayloadData
{
	chatIdList: Array<number>;
	type?: string;
}
declare type CounterSetActions = 'setList'
	| 'readChildChatsCounters'
	| 'readAllChats'
	| 'readByRecentSection'
	| 'setMuted'
;
export interface CounterSetData extends PayloadData
{
	counterList: Array<CounterModelState>
}