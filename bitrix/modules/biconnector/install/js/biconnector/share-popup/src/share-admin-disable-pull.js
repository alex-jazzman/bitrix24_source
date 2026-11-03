import { EventEmitter, type BaseEvent } from 'main.core.events';

import { type ShareDisabledByAdmin } from './share-popup';

export const DISABLED_BY_ADMIN_COMMAND = 'shareDisabledByAdmin';

export type ShareAdminDisable = {
	isBanned: boolean,
	disabledByAdmin: ?ShareDisabledByAdmin,
};

/**
 * Calls back when a controller switches off the current user's link to the dashboard.
 * Returns the unsubscribe function.
 */
export function subscribeToAdminDisable(
	dashboardId: number,
	callback: (disable: ShareAdminDisable) => void,
): () => void
{
	const handler = (event: BaseEvent) => {
		const [command, params] = event.getData() ?? [];
		if (command !== DISABLED_BY_ADMIN_COMMAND || Number(params?.dashboardId) !== dashboardId)
		{
			return;
		}

		callback({
			isBanned: params.isBanned === true,
			disabledByAdmin: params.disabledByAdmin ?? null,
		});
	};

	EventEmitter.subscribe('onPullEvent-biconnector', handler);

	return () => EventEmitter.unsubscribe('onPullEvent-biconnector', handler);
}
