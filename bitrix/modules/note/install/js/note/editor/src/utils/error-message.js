import { Type } from 'main.core';

export function extractErrorMessage(error: mixed, fallback: string): string
{
	if (Type.isStringFilled(error))
	{
		return error;
	}

	if (Type.isPlainObject(error))
	{
		const firstError = error?.errors?.[0]?.message;
		if (Type.isStringFilled(firstError))
		{
			return firstError;
		}

		if (Type.isStringFilled(error.message))
		{
			return error.message;
		}
	}

	return fallback;
}
