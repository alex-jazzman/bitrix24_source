import { Loc } from 'main.core';
import { useToastStore } from '../../../shared/stores';
import { DEBUG_BAR_ERROR_MESSAGES } from '../constants';

export function formatTraceIndex(index: number): string
{
	return String(index + 1).padStart(3, '0');
}

export function formatTimestamp(timestamp: number, withDate: boolean = false): string
{
	if (!timestamp)
	{
		return '-';
	}

	const date = new Date(timestamp * 1000);
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');
	const seconds = String(date.getSeconds()).padStart(2, '0');
	const ms = String(date.getMilliseconds()).padStart(3, '0');
	const time = `${hours}:${minutes}:${seconds}.${ms}`;

	return withDate ? `${date.toLocaleDateString('ru-RU')} ${time}` : time;
}

export function validateTemplateId(templateId: number | null): boolean
{
	if (!templateId || templateId === 0)
	{
		const toastStore = useToastStore();
		toastStore.addWarning(
			Loc.getMessage(DEBUG_BAR_ERROR_MESSAGES.INVALID_TEMPLATE_ID),
		);

		return false;
	}

	return true;
}
