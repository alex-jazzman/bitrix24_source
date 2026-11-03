import { ChatType, type ChatTypeItem } from 'im.v2.const';

import type { ImModelChat } from 'im.v2.model';

import { AnalyticsCategory, PROJECT_CHAT_TYPE } from '../const';
import { getProjectCollabChatId } from './get-collab-id';

export function getCategoryByChatType(type: ChatTypeItem): $Values<typeof AnalyticsCategory>
{
	switch (type)
	{
		case ChatType.channel:
		case ChatType.openChannel:
		case ChatType.comment:
		case ChatType.generalChannel:
			return AnalyticsCategory.channel;
		case ChatType.copilot:
			return AnalyticsCategory.copilot;
		case ChatType.videoconf:
			return AnalyticsCategory.videoconf;
		case ChatType.collab:
		case PROJECT_CHAT_TYPE:
			return AnalyticsCategory.collab;
		default:
			return AnalyticsCategory.chat;
	}
}

export function getCategoryByChat(chat: ImModelChat): $Values<typeof AnalyticsCategory>
{
	const intrinsicCategory = getCategoryByChatType(chat.type);

	// Channel-like chats keep their intrinsic category even inside a project (chat-type priority).
	if (intrinsicCategory === AnalyticsCategory.channel)
	{
		return intrinsicCategory;
	}

	if (getProjectCollabChatId(chat) !== null)
	{
		return AnalyticsCategory.collab;
	}

	return intrinsicCategory;
}
