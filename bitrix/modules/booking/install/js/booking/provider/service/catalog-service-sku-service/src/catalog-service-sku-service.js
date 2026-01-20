import type { Store } from 'ui.vue3.vuex';

import { Core } from 'booking.core';
import { apiClient } from 'booking.lib.api-client';

export class CatalogServiceSkuService
{
	async create(iblockId: number, serviceName: string): Promise<number | null>
	{
		try
		{
			return await apiClient.post('CatalogServiceSku.create', {
				iblockId,
				serviceName,
			});
		}
		catch (error)
		{
			console.error('CatalogServiceSkuService. Create error', error);

			return null;
		}
	}

	get $store(): Store
	{
		return Core.getStore();
	}
}

export const catalogServiceSkuService = new CatalogServiceSkuService();
