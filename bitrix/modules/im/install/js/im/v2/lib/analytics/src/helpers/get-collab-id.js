import { Core } from 'im.v2.application.core';
import { ChatType } from 'im.v2.const';

import type { ImModelChat, ImModelCollabInfo } from 'im.v2.model';

// Resolves the collab chat that governs a chat's project subtree: the chat itself
// when it is a collab, or its direct parent when that parent is a collab.
export function getProjectCollabChatId(chat: ImModelChat): ?number
{
	if (chat.type === ChatType.collab)
	{
		return chat.chatId;
	}

	if (!chat.parentChatId)
	{
		return null;
	}

	const parentChat: ?ImModelChat = Core.getStore().getters['chats/getByChatId'](chat.parentChatId);
	if (!parentChat || parentChat.type !== ChatType.collab)
	{
		return null;
	}

	return parentChat.chatId;
}

// Numeric collab entity id behind a collab chat, or null when it is missing/zero.
// Shared store-access primitive so the collab and project labels below stay independent.
export function getCollabEntityId(chatId: number): ?number
{
	const collabInfo: ?ImModelCollabInfo = Core.getStore().getters['chats/collabs/getByChatId'](chatId);

	let entityId = collabInfo?.collabId ?? 0;
	if (entityId <= 0)
	{
		const collabChat: ?ImModelChat = Core.getStore().getters['chats/getByChatId'](chatId);
		if (collabChat?.type === ChatType.collab)
		{
			entityId = Number(collabChat.entityLink?.id) || 0;
		}
	}

	return entityId > 0 ? entityId : null;
}

// External contract consumed by the `call` module via the im.v2.lib.analytics facade.
export function getCollabId(chatId: number): ?string
{
	const collabEntityId = getCollabEntityId(chatId);
	if (!collabEntityId)
	{
		return null;
	}

	return `collabId_${collabEntityId}`;
}

// Project label for a chat located anywhere inside a collab subtree.
export function getProjectId(chat: ImModelChat): ?string
{
	const collabChatId = getProjectCollabChatId(chat);
	if (!collabChatId)
	{
		return null;
	}

	return getProjectIdByChatId(collabChatId);
}

// Project label when only the root collab chatId is known (e.g. the project tab).
export function getProjectIdByChatId(chatId: number): ?string
{
	const collabEntityId = getCollabEntityId(chatId);
	if (!collabEntityId)
	{
		return null;
	}

	return `projectId_${collabEntityId}`;
}
