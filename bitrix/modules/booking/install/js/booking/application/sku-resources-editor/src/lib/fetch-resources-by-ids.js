import { Core } from 'booking.core';
import { Model } from 'booking.const';
import { deepToRaw } from 'booking.lib.deep-to-raw';
import { resourceDialogService } from 'booking.provider.service.resource-dialog-service';
import type { ResourceModel } from 'booking.model.resources';
import { getServicesCollection } from './get-services-collection';

export async function fetchResourcesByIds(resourceIds: number[]): Promise<ResourceModel[]>
{
	await loadResourcesByIds(resourceIds);
}

async function loadResourcesByIds(resourceIds: number[]): Promise<void>
{
	const $store = Core.getStore();

	try
	{
		await resourceDialogService.loadByIds(
			resourceIds,
			Date.now() / 1000,
		);
		const resources = deepToRaw($store.getters[`${Model.Resources}/getByIds`](resourceIds));
		await $store.dispatch(`${Model.SkuResourcesEditor}/addResources`, resources);
		await $store.dispatch(`${Model.SkuResourcesEditor}/addSkus`, getServicesCollection(resources));
	}
	catch (error)
	{
		console.error('SkuResourcesEditor. Fetch resource error', error);
	}
}
