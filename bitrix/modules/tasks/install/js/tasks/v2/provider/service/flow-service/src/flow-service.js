import { Endpoint, Model } from 'tasks.v2.const';
import { Core } from 'tasks.v2.core';
import { apiClient } from 'tasks.v2.lib.api-client';
import { GroupMappers, createGroupDto } from 'tasks.v2.provider.service.group-service';
import { mapDtoToModel } from './mappers';

class FlowService
{
	getUrl(id: number, userId: number): string
	{
		return `/company/personal/user/${userId}/tasks/flow/?ID_numsel=exact&ID_from=${id}&ID_to=${id}&apply_filter=Y`;
	}

	async getFlow(id: number): Promise<void>
	{
		if (id <= 0)
		{
			return;
		}

		try
		{
			const data = await apiClient.post(Endpoint.FlowGet, { flow: { id } });

			if (!data?.id)
			{
				return;
			}

			const flow = mapDtoToModel(data);

			await Core.getStore().dispatch(`${Model.Flows}/insert`, flow);

			if (data.group)
			{
				const group = GroupMappers.mapDtoToModel(createGroupDto(data.group));

				await Core.getStore().dispatch(`${Model.Groups}/insert`, group);
			}
		}
		catch (error)
		{
			console.error('FlowService: getFlow error', error);
		}
	}
}

export const flowService = new FlowService();
