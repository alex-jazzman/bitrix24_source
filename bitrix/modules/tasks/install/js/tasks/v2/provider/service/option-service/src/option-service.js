import { apiClient } from 'tasks.v2.lib.api-client';
import { Endpoint } from 'tasks.v2.const';

export class OptionService
{
	async set(optionName: string, value: string): Promise<void>
	{
		await apiClient.post(Endpoint.OptionSet, { optionName, value });
	}

	async setBool(optionName: string, value: boolean): Promise<void>
	{
		await apiClient.post(Endpoint.OptionSetBool, { optionName, value });
	}
}

export const optionService = new OptionService();
