import { Type } from 'main.core';

// Small, generic helper duplicated from note.editor's utils/error-message.js on purpose:
// it has no dependency on editor internals, and duplicating it here keeps this extension
// free of a cross-bundle import back into note.editor.
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
