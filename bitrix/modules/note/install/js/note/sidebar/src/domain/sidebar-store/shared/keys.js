export function normalizeParentId(parentId: mixed): number | null
{
	if (parentId === null || parentId === undefined || parentId === '')
	{
		return null;
	}

	const normalized = Number(parentId);

	return Number.isFinite(normalized) ? normalized : null;
}

export function keyOf(collectionId: number, parentId: number | null = null): string
{
	const normalizedCollectionId = Number(collectionId);
	const normalizedParentId = normalizeParentId(parentId);

	return `${normalizedCollectionId}:${normalizedParentId === null ? 'root' : normalizedParentId}`;
}
