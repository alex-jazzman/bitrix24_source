import { ajax, Type } from 'main.core';

export class AjaxControllerClient
{
	run(action: string, data: Object = {}): Promise<mixed>
	{
		return ajax.runAction(action, { data })
			.then((response) => response?.data)
			.catch((error) => {
				throw new Error(this.#extractErrorMessage(error));
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
}
