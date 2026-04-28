import { MessengerModel } from '../../../base';

declare type OpenlinesModelState = {
	collection: Record<number, OpenlinesSessionModelState>,
};

declare type OpenlinesSessionModelState = {
	id: number,
	operatorId: number,
	chatId: number,
	status: OpenlinesSessionStatus,
	queueId: number,
	pinned: boolean,
	isClosed: boolean
};

declare type OpenlinesModelActions =
	'dialoguesModel/openlinesModel/set'
	| 'dialoguesModel/openlinesModel/update'
;

declare type OpenlinesModelMutation =
	'update'
	| 'add'
;

declare type OpenlinesUpdateAction = 'update';
declare type OpenlinesUpdateData = Array<{
	chatId: number,
	fields: OpenlinesSessionModelState,
}>

declare type OpenlinesSetAction = 'set';
declare type OpenlinesSetData = Array<{
	chatId: number,
	fields: OpenlinesSessionModelState,
}>

declare type OpenlinesModel = MessengerModel<OpenlinesModelState>;

declare type OpenlinesSessionStatus = 'new' | 'work' | 'answered';
