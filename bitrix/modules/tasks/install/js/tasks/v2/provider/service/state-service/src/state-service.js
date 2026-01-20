import { apiClient } from 'tasks.v2.lib.api-client';
import { Endpoint } from 'tasks.v2.const';
import { State } from './types';

export class StateService
{
	async set(state: State): Promise<void>
	{
		await apiClient.post(Endpoint.TaskStateSet, { state });
	}
}

export const stateService = new StateService();
