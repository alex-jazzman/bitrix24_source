import type { SidebarDocument } from '../../../type';

export function sortDocuments(docs: SidebarDocument[]): SidebarDocument[]
{
	return [...docs].sort((a, b) => {
		const leftPos = Number(a?.position || 0);
		const rightPos = Number(b?.position || 0);
		if (leftPos !== rightPos)
		{
			return rightPos - leftPos;
		}

		return Number(b?.id || 0) - Number(a?.id || 0);
	});
}

export function normalizeDocumentForStore(
	doc: mixed,
	normalizeParentId: (value: mixed) => number | null,
	fallback: Object = {},
): SidebarDocument | null
{
	const id = Number(doc?.id ?? fallback.id ?? 0);
	const collectionId = Number(doc?.collectionId ?? fallback.collectionId ?? 0);
	const parentIdValue = doc?.parentId ?? fallback.parentId;
	const parentId = normalizeParentId(parentIdValue);
	if (!Number.isFinite(id) || id <= 0 || !Number.isFinite(collectionId) || collectionId <= 0)
	{
		return null;
	}

	return {
		...doc,
		id,
		collectionId,
		parentId,
		title: String(doc?.title ?? fallback.title ?? ''),
		position: Number.isFinite(Number(doc?.position))
			? Number(doc.position)
			: (Number.isFinite(Number(fallback.position)) ? Number(fallback.position) : 0),
		hasChildren: Boolean(doc?.hasChildren ?? fallback.hasChildren ?? false),
		isArchived: Boolean(doc?.isArchived ?? fallback.isArchived ?? false),
	};
}
