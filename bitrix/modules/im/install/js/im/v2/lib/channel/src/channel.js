import { Core } from 'im.v2.application.core';
import { ChatType, type ChatTypeItem } from 'im.v2.const';
import { type ImModelChat, type ImModelMessage } from 'im.v2.model';

export const ChannelManager = {
	channelTypes: new Set([ChatType.generalChannel, ChatType.channel, ChatType.openChannel]),

	isChannel(dialogId: string): boolean
	{
		const { type }: ImModelChat = Core.getStore().getters['chats/get'](dialogId, true);

		return ChannelManager.channelTypes.has(type);
	},

	getChannelTypes(): ChatTypeItem[]
	{
		return [...ChannelManager.channelTypes];
	},

	isCommentsPostMessage(message: ImModelMessage, dialogId: string): boolean
	{
		const { type: contextChatType }: ImModelChat = Core.getStore().getters['chats/get'](dialogId, true);
		if (contextChatType !== ChatType.comment)
		{
			return false;
		}

		const { dialogId: messageDialogId }: ImModelChat = Core.getStore().getters['chats/getByChatId'](message.chatId, true);

		return messageDialogId !== dialogId;
	},
};
