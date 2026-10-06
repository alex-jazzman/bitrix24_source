import { Type } from 'main.core';

export function isSuccessfulSendResponse(response: unknown): boolean
{
	if (!Type.isObjectLike(response))
	{
		return false;
	}

	const data = response as {
		ERROR?: unknown,
		ERROR_HTML?: unknown,
		ERROR_CODE?: unknown,
		errors?: unknown[],
		status?: unknown,
	};
	const hasErrorValue = (value: unknown): boolean => (
		Array.isArray(value) ? value.length > 0 : Boolean(value)
	);

	return data.status === 'success' || (
		data.status !== 'error'
		&& !hasErrorValue(data.ERROR)
		&& !hasErrorValue(data.ERROR_HTML)
		&& !hasErrorValue(data.ERROR_CODE)
		&& !hasErrorValue(data.errors)
	);
}
