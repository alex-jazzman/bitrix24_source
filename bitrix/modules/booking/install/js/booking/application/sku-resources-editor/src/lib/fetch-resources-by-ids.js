import { Type } from 'main.core';

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
		const existingResources = $store.getters[`${Model.Resources}/getByIds`](resourceIds);

		const existingIds = new Set(
			existingResources
				.filter((resource) => Type.isObject(resource) && 'id' in resource)
				.map((resource) => resource.id),
		);
		const idsToLoad = resourceIds.filter((id) => !existingIds.has(id));

		if (idsToLoad.length > 0)
		{
			await resourceDialogService.loadByIds(
				idsToLoad,
				Math.round(Date.now() / 1000),
			);
		}

		const allResources = deepToRaw($store.getters[`${Model.Resources}/getByIds`](resourceIds));
		await $store.dispatch(`${Model.SkuResourcesEditor}/addResources`, allResources);
		await $store.dispatch(`${Model.SkuResourcesEditor}/addSkus`, getServicesCollection(allResources));
	}
	catch (error)
	{
		console.error('SkuResourcesEditor. Fetch resource error', error);
	}
}
