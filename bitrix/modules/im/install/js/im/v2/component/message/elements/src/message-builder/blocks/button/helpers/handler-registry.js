import { type EventButtonBlockType } from 'im.v2.const';
import { type ImModelMessage } from 'im.v2.model';

type HandlerParams = {
	actionId: EventButtonBlockType['actionId'],
	actionParams: EventButtonBlockType['actionParams'],
	message: ImModelMessage,
	dialogId: string,
};

export const handlerRegistry: { [eventName: string]: (params: HandlerParams) => void } = {
	// 'sign:signDocument': (params: HandlerParams) => {
	// 	console.log('sign:signDocument', params);
	// },
};
