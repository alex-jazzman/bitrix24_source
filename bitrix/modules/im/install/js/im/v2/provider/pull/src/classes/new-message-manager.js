import { Core } from 'im.v2.application.core';
import { ChatType } from 'im.v2.const';
import { ChannelManager } from 'im.v2.lib.channel';

import type { PullExtraParams, RawChat } from '../../types/common';
import type { MessageAddParams } from '../../types/message';

export class NewMessageManager
{
	#params: MessageAddParams;
	#extra: PullExtraParams;

	constructor(params: MessageAddParams, extra: PullExtraParams = {})
	{
		this.#params = params;
		this.#extra = extra;
	}

	getChatId(): number
	{
		return this.#params.chatId;
	}

	getParentChatId(): number
	{
		return this.getChat()?.parent_chat_id || 0;
	}

	getChat(): ?RawChat
	{
		const chatId = this.getChatId();

		return this.#params.chat?.[chatId];
	}

	getChatType(): string
	{
		const chat = this.getChat();

		return chat?.type ?? '';
	}

	isUserChat(): boolean
	{
		return Boolean(this.getChat()) === false;
	}

	isCommentChat(): boolean
	{
		return this.getChatType() === ChatType.comment;
	}

	isChannelChat(): boolean
	{
		return ChannelManager.channelTypes.has(this.getChatType());
	}

	isUserInChat(): boolean
	{
		const chatUsers = this.#params.userInChat[this.getChatId()];
		if (!chatUsers || this.isChannelListEvent())
		{
			return true;
		}

		return chatUsers.includes(Core.getUserId());
	}

	isChannelListEvent(): boolean
	{
		return this.isChannelChat() && this.#extra.is_shared_event;
	}
}
