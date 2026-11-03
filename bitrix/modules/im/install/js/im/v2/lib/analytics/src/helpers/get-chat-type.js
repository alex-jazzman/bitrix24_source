import { ChatType, type ChatTypeItem } from 'im.v2.const';
import { type ImModelChat } from 'im.v2.model';

import { PROJECT_CHAT_TYPE, PSEUDO_SELF_CHAT_TYPE } from '../const';
import { isAiAssistant } from './is-ai-assistant';
import { isSelfChat } from './is-self-chat';

export type ExtendedChatType = ChatTypeItem
	| typeof CUSTOM_CHAT_TYPE
	| typeof PSEUDO_SELF_CHAT_TYPE
	| typeof PROJECT_CHAT_TYPE;

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

	// The root CollabChat reports as a project (FIX-01); nested/derived chats keep their intrinsic type.
	if (chat.type === ChatType.collab)
	{
		return PROJECT_CHAT_TYPE;
	}

	const chatTypeExists = Object.values(ChatType).includes(chat.type);

	if (chatTypeExists)
	{
		return chat.type;
	}

	return CUSTOM_CHAT_TYPE;
}
