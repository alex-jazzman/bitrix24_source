import { Core } from 'im.v2.application.core';

export function isNotes(dialogId: string): boolean
{
	return Core.getUserId().toString() === dialogId;
}
