import { Endpoint, Model } from 'tasks.v2.const';
import { Core } from 'tasks.v2.core';
import { apiClient } from 'tasks.v2.lib.api-client';
import { GroupMappers } from 'tasks.v2.provider.service.group-service';
import { mapDtoToModel } from './mappers';

class FlowService
{
	getUrl(id: number, userId: number): string
	{
		return `/company/personal/user/${userId}/tasks/flow/?ID_numsel=exact&ID_from=${id}&ID_to=${id}&apply_filter=Y`;
	}

	async getFlow(id: number): Promise<void>
	{
		try
		{
			const data = await apiClient.post(Endpoint.FlowGet, { flow: { id } });

			const flow = mapDtoToModel(data);
			const group = GroupMappers.mapDtoToModel(data.group);

			await Core.getStore().dispatch(`${Model.Flows}/insert`, flow);
			await Core.getStore().dispatch(`${Model.Groups}/insert`, group);
		}
		catch (error)
		{
			console.error('FlowService: getFlow error', error);
		}
	}
}

export const flowService = new FlowService();
