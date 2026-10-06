import { Core } from 'im.v2.application.core';
import { GetParameter, Path, ChatType, ParentChatScope, type ParentChatIdType } from 'im.v2.const';
import { type ImModelChat } from 'im.v2.model';

const GetParameterByChatType = {
	[ChatType.taskComments]: GetParameter.openTaskComments,
	[ChatType.collab]: GetParameter.openCollab,
};

export const ChatManager = {
	prepareParentChatId(parentChatId: ParentChatIdType): number
	{
		const isAllScope = parentChatId === ParentChatScope.all;
		if (!parentChatId || isAllScope)
		{
			return ParentChatScope.topLevel;
		}

		return parentChatId;
	},
	buildChatLink(dialogId: string): string
	{
		const chat: ImModelChat = Core.getStore().getters['chats/get'](dialogId);
		const chatGetParameter = GetParameterByChatType[chat.type] ?? GetParameter.openChat;
		const getParams = new URLSearchParams({
			[chatGetParameter]: dialogId,
		});

		return `${Core.getHost()}${Path.online}?${getParams.toString()}`;
	},

	buildMessageLink(dialogId: string, messageId: number): string
	{
		const chatLink = this.buildChatLink(dialogId);
		const chatUrl = new URL(chatLink);
		chatUrl.searchParams.set(GetParameter.openMessage, messageId.toString());

		return chatUrl.toString();
	},
};
