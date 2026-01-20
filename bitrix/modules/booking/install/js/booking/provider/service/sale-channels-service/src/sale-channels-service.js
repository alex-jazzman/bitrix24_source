import { Core } from 'booking.core';
import { Model } from 'booking.const';
import { apiClient } from 'booking.lib.api-client';

import type { Store } from 'ui.vue3.vuex';
import type { SaleChannelsDto } from './types';

class SaleChannelsService
{
	async loadData(): Promise<void>
	{
		try
		{
			const dto: SaleChannelsDto = await apiClient.post('MainPage.getSaleChannels', {});
			const saleChannelsModel = Model.SaleChannels;

			await Promise.all([
				this.$store.dispatch(`${saleChannelsModel}/setFormsMenu`, dto.formsMenu),
				this.$store.dispatch(`${saleChannelsModel}/setIntegrations`, dto.integrations),
				this.$store.dispatch(`${saleChannelsModel}/setLoaded`, true),
			]);
		}
		catch (error)
		{
			console.error('SaleChannelsService load data error', error);
		}
	}

	get $store(): Store
	{
		return Core.getStore();
	}
}

export const saleChannelsService = new SaleChannelsService();
