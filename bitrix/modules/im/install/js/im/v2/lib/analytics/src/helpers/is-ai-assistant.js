import { Core } from 'im.v2.application.core';

export function isAiAssistant(dialogId: string): boolean
{
	return Core.getStore().getters['users/bots/isAiAssistant'](dialogId);
}
