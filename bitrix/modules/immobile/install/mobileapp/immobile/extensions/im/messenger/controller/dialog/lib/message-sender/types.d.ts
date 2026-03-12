import { MessagesModelState } from '../../../../model/messages/src/types/messages';
import { DialogId } from '../../../../types/common';

type SendMessageParams = {
	message: MessagesModelState,
	forwardingMessages: MessagesModelState[],
	requestParams: {
		dialogId: DialogId,
		text: string,
		templateId: string,
		forwardIds: {
			[key: string]: number;
		},
	},
};
