import { Type } from 'main.core';

import { ApiClient } from 'booking.lib.api-client';
import type { CrmFormResourceModel } from 'booking.model.crm-form';

import { mapDtoToModel } from './mapper';
import { ResourceDto } from './types';

class CrmFormService
{
	#getResourcesRequest: ?Promise<ResourceDto[]>;

	async getResources(): Promise<CrmFormResourceModel[]>
	{
		try
		{
			this.#getResourcesRequest ??= this.#fetchGetResources;
			const data = await this.#getResourcesRequest();

			return data.map((resourceDto) => mapDtoToModel(resourceDto));
		}
		catch (error)
		{
			console.error('CrmFormService: get resources error', error);

			return [];
		}
	}

	#fetchGetResources(): Promise<ResourceDto[]>
	{
		return new ApiClient().post('CrmForm.getResources');
	}
}

export const crmFormService = new CrmFormService();
