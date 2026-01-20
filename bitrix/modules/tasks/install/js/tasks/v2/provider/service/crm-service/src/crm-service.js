import { Core } from 'tasks.v2.core';
import { Model, Endpoint } from 'tasks.v2.const';
import { apiClient } from 'tasks.v2.lib.api-client';
import { idUtils } from 'tasks.v2.lib.id-utils';
import type { CrmItemModel } from 'tasks.v2.model.crm-items';

import { mapDtoToModel } from './mappers';
import type { CrmItemDto } from './types';

export const crmService = new class
{
	async list(id: number | string, ids: string[]): Promise<void>
	{
		const data = await (idUtils.isTemplate(id) ? this.#listTemplate(id, ids) : this.#listTask(id, ids));

		const crmItems = data.map((dto: CrmItemDto): CrmItemModel => mapDtoToModel(dto));

		await Core.getStore().dispatch(`${Model.CrmItems}/upsertMany`, crmItems);
	}

	#listTask(id: number, crmItemIds: string[]): Promise<CrmItemDto[]>
	{
		return apiClient.post(Endpoint.TaskCrmItemList, { task: { id, crmItemIds } });
	}

	#listTemplate(id: number, crmItemIds: string[]): Promise<CrmItemDto[]>
	{
		return apiClient.post('Template.CRM.Item.list', { template: { id: idUtils.unbox(id), crmItemIds } });
	}
}();
