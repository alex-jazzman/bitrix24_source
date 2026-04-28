import { Core } from 'im.v2.application.core';

export function isSelfChat(dialogId: string): boolean
{
	return Core.getStore().getters['chats/isSelfChat'](dialogId);
}
