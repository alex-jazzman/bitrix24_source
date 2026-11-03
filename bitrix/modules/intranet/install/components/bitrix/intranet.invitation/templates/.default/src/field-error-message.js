import { Type } from 'main.core';
import { EventEmitter } from 'main.core.events';

export const SHOW_FIELD_ERROR_EVENT = 'BX.Intranet.Invitation:showFieldError';
export const HIDE_FIELD_ERROR_EVENT = 'BX.Intranet.Invitation:hideFieldError';

export function getFieldErrorMessageId(inputId: string): string
{
	return `${inputId}-summary-error`;
}

export function syncFieldErrorMessage(inputId: string, message: string, announce: boolean = true): void
{
	const id = getFieldErrorMessageId(inputId);
	const eventName = Type.isStringFilled(message) ? SHOW_FIELD_ERROR_EVENT : HIDE_FIELD_ERROR_EVENT;

	EventEmitter.emit(EventEmitter.GLOBAL_TARGET, eventName, { id, message, announce });
}
