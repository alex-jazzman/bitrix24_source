import type { ResourceModel } from 'booking.model.resources';
import type { SkuInfo } from '../types';

export function getServicesCollection(resources: ResourceModel[]): SkuInfo[]
{
	const skusMap = new Map();

	for (const resource of resources)
	{
		const skus = resource.skus;

		for (const sku of skus)
		{
			if (skusMap.has(sku.id))
			{
				const service = skusMap.get(sku.id);
				service.resources.push(resource);
			}
			else
			{
				skusMap.set(sku.id, {
					id: sku.id,
					name: sku.name,
					price: sku.price,
					currencyId: sku.currencyId,
					resources: [resource],
				});
			}
		}
	}

	return [...skusMap.values()];
}
