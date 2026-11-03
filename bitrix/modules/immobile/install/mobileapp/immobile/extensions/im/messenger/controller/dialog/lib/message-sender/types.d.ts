import { MessagesModelState } from '../../../../model/messages/src/types/messages';
import { DialogId } from '../../../../types/common';
import { DialogType } from '../../../../model/dialogues/src/types';

type ForwardSource = {
	chatTitle: string | null,
	parentChatId: number,
	parentMessageId: number,
	parentChatType: DialogType | null,
};

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
