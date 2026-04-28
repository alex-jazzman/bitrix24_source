import { ChatType } from 'im.v2.const';

import { isAiAssistant } from './is-ai-assistant';
import { isSelfChat } from './is-self-chat';
import { PSEUDO_SELF_CHAT_TYPE } from '../const';

import type { ImModelChat } from 'im.v2.model';

export type ExtendedChatType = $Values<typeof ChatType>
	| typeof CUSTOM_CHAT_TYPE
	| typeof PSEUDO_SELF_CHAT_TYPE;

const CUSTOM_CHAT_TYPE = 'custom';
const AI_ASSISTANT_CHAT_TYPE = 'aiAssistant';

export function getChatType(chat: ImModelChat): ExtendedChatType
{
	if (isSelfChat(chat.dialogId))
	{
		return PSEUDO_SELF_CHAT_TYPE;
	}

	if (isAiAssistant(chat.dialogId))
	{
		return AI_ASSISTANT_CHAT_TYPE;
	}

	const chatTypeExists = Object.values(ChatType).includes(chat.type);

	if (chatTypeExists)
	{
		return chat.type;
	}

	return CUSTOM_CHAT_TYPE;
}
