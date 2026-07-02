import { Type } from 'main.core';
import type { CurrentUser } from '../type';

export function toPositiveInt(value: mixed): number | null
{
	const normalized = Number(value);

	return Number.isInteger(normalized) && normalized > 0 ? normalized : null;
}

export const normalizeCollectionId = toPositiveInt;
export const normalizeDocumentId = toPositiveInt;

export function normalizeStringValue(value: mixed, fallback: string = ''): string
{
	if (Type.isString(value))
	{
		return value.trim();
	}

	if (Type.isNumber(value))
	{
		return String(value);
	}

	return fallback;
}

export function normalizeUserColor(value: mixed): string
{
	const color = normalizeStringValue(value, '#555555');

	return /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(color) ? color : '#555555';
}

export function normalizeCurrentUser(value: mixed): CurrentUser
{
	const user = Type.isPlainObject(value) ? value : {};

	return {
		id: normalizeStringValue(user.id ?? user.userId, '0'),
		name: normalizeStringValue(user.name, 'User') || 'User',
		color: normalizeUserColor(user.color),
	};
}

export function normalizeString(value: mixed): string
{
	return String(value ?? '').trim();
}
