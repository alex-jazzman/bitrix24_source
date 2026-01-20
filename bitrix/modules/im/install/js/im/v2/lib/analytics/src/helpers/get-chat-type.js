import { ChatType } from 'im.v2.const';

import { isAiAssistant } from './is-ai-assistant';
import { isNotes } from './is-notes';
import { PSEUDO_CHAT_TYPE_FOR_NOTES } from '../const';

import type { ImModelChat } from 'im.v2.model';

export type ExtendedChatType = $Values<typeof ChatType>
	| typeof CUSTOM_CHAT_TYPE
	| typeof PSEUDO_CHAT_TYPE_FOR_NOTES;

const CUSTOM_CHAT_TYPE = 'custom';
const AI_ASSISTANT_CHAT_TYPE = 'aiAssistant';

export function getChatType(chat: ImModelChat): ExtendedChatType
{
	if (isNotes(chat.dialogId))
	{
		return PSEUDO_CHAT_TYPE_FOR_NOTES;
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
