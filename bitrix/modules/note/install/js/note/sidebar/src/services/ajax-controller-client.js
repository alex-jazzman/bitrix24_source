import { ajax, Type } from 'main.core';

export class AjaxControllerClient
{
	run(action: string, data: Object = {}): Promise<mixed>
	{
		return ajax.runAction(action, { data })
			.then((response) => response?.data)
			.catch((error) => {
				const failure = new Error(this.#extractErrorMessage(error));
				// Preserve the server error code (e.g. NOTE_MOVE_ACCESS_ESCALATION) so callers can
				// tell a typed failure apart from a generic one instead of matching on text.
				failure.code = this.#extractErrorCode(error);
				throw failure;
			});
	}

	#extractErrorMessage(error: mixed): string
	{
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

		return 'Request failed';
	}

	#extractErrorCode(error: mixed): string
	{
		if (Type.isPlainObject(error))
		{
			const firstCode = error?.errors?.[0]?.code;
			if (Type.isStringFilled(firstCode))
			{
				return firstCode;
			}
		}

		return '';
	}
}
