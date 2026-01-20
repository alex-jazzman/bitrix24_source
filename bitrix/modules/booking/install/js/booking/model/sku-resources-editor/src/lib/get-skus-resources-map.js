export function getSkusResourcesMap(
	resourcesSkusMap: Map<number, Set<number>>,
	skusIds: number[],
): Map<number, Set<number>>
{
	const skusResourcesMap: Map<number, Set<number>> = new Map();

	for (const skuId of skusIds)
	{
		skusResourcesMap.set(skuId, new Set());
	}

	for (const [resourceId, resourceSkusIds] of resourcesSkusMap)
	{
		for (const skuId of resourceSkusIds)
		{
			if (skusResourcesMap.has(skuId))
			{
				const skusSet = skusResourcesMap.get(skuId);
				skusSet.add(resourceId);
				skusResourcesMap.set(skuId, skusSet);
			}
			else
			{
				skusResourcesMap.set(skuId, new Set([resourceId]));
			}
		}
	}

	return skusResourcesMap;
}
