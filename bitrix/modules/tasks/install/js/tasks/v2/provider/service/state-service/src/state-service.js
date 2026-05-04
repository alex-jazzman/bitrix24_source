import { apiClient } from 'tasks.v2.lib.api-client';
import { Endpoint } from 'tasks.v2.const';
import { type State, type StateFlags } from './types';

export class StateService
{
	async set(state: State): Promise<void>
	{
		await apiClient.post(Endpoint.TaskStateSet, { state });
	}

	async setTemplateFlags(flags: StateFlags): Promise<void>
	{
		await apiClient.post(Endpoint.TemplateStateSet, { flags });
	}
}

export const stateService = new StateService();
