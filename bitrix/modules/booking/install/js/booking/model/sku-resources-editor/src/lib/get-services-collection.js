import type { ResourceModel, Skus } from 'booking.model.resources';
import type { ServiceItem } from '../types';

export function getServicesCollection(resources: ResourceModel[], skus: Skus[]): ServiceItem[]
{
	const skusMap = new Map();

	for (const sku of skus)
	{
		skusMap.set(sku.id, {
			id: sku.id,
			name: sku.name,
			resources: [],
		});
	}

	for (const resource of resources)
	{
		const resourceSkus = resource.skus;

		for (const sku of resourceSkus)
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
					resources: [resource],
				});
			}
		}
	}

	return [...skusMap.values()];
}
