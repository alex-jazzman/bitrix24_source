import { UI } from 'ui.notification';
import { Text } from 'main.core';

export function handleResponseError(response: Response): void
{
	if (response.errors?.length > 0)
	{
		const [error] = response.errors;

		UI.Notification.Center.notify({
			content: Text.encode(error.message),
			autoHideDelay: 4000,
		});
	}
	else
	{
		console.error(response);
	}
}

export function getErrorCode(responseOrError: Object): ?string
{
	return responseOrError?.errors?.[0]?.code ?? null;
}
