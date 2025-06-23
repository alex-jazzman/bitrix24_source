import { Core } from 'im.v2.application.core';
import { Logger } from 'im.v2.lib.logger';
import { RestMethod, UserStatus } from 'im.v2.const';

export class StatusService
{
	store: Object = null;
	restClient: Object = null;

	constructor()
	{
		this.store = Core.getStore();
		this.restClient = Core.getRestClient();
	}

	changeStatus(status: string): void
	{
		if (!UserStatus[status])
		{
			return;
		}

		Logger.warn(`StatusService: change current user status to ${status}`);
		this.store.dispatch('users/setStatus', { status });
		this.store.dispatch('application/settings/set', { status });

		const payload = { STATUS: status };
		this.restClient.callMethod(RestMethod.imUserStatusSet, payload)
			.catch((result: RestResult) => {
				console.error('StatusService: changeStatus error', result.error());
			});
	}
}