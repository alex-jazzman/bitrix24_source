import { Type } from 'main.core';
import { UI } from 'ui.notification';

import type { ApiError } from '../../../shared/api';
import { handleResponseError } from '../../../shared/utils';

/**
 * A failed operation over the pilot is always told to the publisher. The wording of the server is used
 * whenever it comes; a refusal without one - and a transport failure carries none at all - is told by
 * the wording of the operation itself.
 *
 * Both wordings reach the same markup of the notification and follow the one rule of the feature: the
 * wording of the server is encoded by `handleResponseError()`, and a phrase of the localization is
 * markup of this editor and goes as it is - encoding it would show its own entities literally.
 */
export function notifyPilotFailure(error: ApiError, fallbackMessage: ?string): void
{
	if (Type.isStringFilled(error?.errors?.[0]?.message))
	{
		handleResponseError(error);

		return;
	}

	UI.Notification.Center.notify({
		content: fallbackMessage ?? '',
		autoHideDelay: 4000,
	});
}
