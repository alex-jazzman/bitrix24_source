import { Core } from 'booking.core';
import { Model } from 'booking.const';
import { deepToRaw } from 'booking.lib.deep-to-raw';
import { resourceDialogService } from 'booking.provider.service.resource-dialog-service';
import type { SkuInfo } from 'booking.model.sku-resources-editor';

import { getServicesCollection } from './get-services-collection';

export async function fetchResourcesBySkuIds(skus: SkuInfo[]): Promise<void>
{
	const addSkusIds = new Set(skus.map((sku) => sku.id));
	const loadedSkus = (await loadResourcesBySkuIds(skus.map((sku) => sku.id)))
		.filter((sku) => addSkusIds.has(sku.id));
	const loadedSKusIds = new Set(loadedSkus.map((sku) => sku.id));

	await Core.getStore().dispatch(`${Model.SkuResourcesEditor}/addSkus`, [
		...loadedSkus,
		...skus.filter((sku) => !loadedSKusIds.has(sku.id)),
	]);
}

async function loadResourcesBySkuIds(skuIds: number[]): Promise<SkuInfo[]>
{
	const $store = Core.getStore();

	try
	{
		await resourceDialogService.loadBySkuIds(
			skuIds,
			Math.round(Date.now() / 1000),
		);

		const resources = deepToRaw($store.getters[`${Model.Resources}/getBySkuIds`](skuIds));

		await $store.dispatch(`${Model.SkuResourcesEditor}/addResources`, resources);

		return getServicesCollection(resources);
	}
	catch (error)
	{
		console.error('SkuResourcesEditor. Fetch resource error', error);

		return [];
	}
}
