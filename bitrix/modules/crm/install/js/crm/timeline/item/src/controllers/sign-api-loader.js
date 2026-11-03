import { Runtime, Text } from 'main.core';
import { UI } from 'ui.notification';

import { type Api } from 'sign.v2.api';

export type SignApiLoader = () => Promise<Api>;

// sign is loaded by the first action that needs it, not together with the timeline bundle:
// most cards never call these actions. Retries are made by Runtime.loadExtension itself, which then keeps
// the failure; the failed promise is dropped here only so that every following action reports it.
export function createSignApiLoader(): SignApiLoader
{
	let signApi: Promise<Api> | null = null;

	return (): Promise<Api> => {
		signApi ??= Runtime.loadExtension('sign.v2.api')
			.then((exports) => {
				if (!exports?.Api)
				{
					throw new Error('Extension "sign.v2.api" is not available');
				}

				return new exports.Api();
			})
			.catch((error) => {
				signApi = null;
				UI.Notification.Center.notify({
					content: Text.encode(error?.[0]?.message ?? error?.message ?? ''),
					autoHideDelay: 5000,
				});

				throw error;
			})
		;

		return signApi;
	};
}
