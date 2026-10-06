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

// Accessible-tree ("Shared with me") branch namespace. The `shared:` prefix keeps these keys from
// ever colliding with the regular collection branches living in the parallel docsByParent store.
export function sharedKey(collectionId: number, parentId: number | null = null): string
{
	const normalizedCollectionId = Number(collectionId);
	const normalizedParentId = normalizeParentId(parentId);

	return `shared:${normalizedCollectionId}:${normalizedParentId === null ? 'root' : normalizedParentId}`;
}

export function sharedRootKey(collectionId: number): string
{
	return sharedKey(collectionId, null);
}

// Inverse of sharedKey: a stored branch key back into the coordinates its readers speak. Kept next
// to the builder so the two cannot drift apart. Returns null for anything not of this namespace.
export function parseSharedKey(key: string): { collectionId: number, parentId: number | null } | null
{
	const match = /^shared:(\d+):(root|\d+)$/.exec(String(key));
	if (match === null)
	{
		return null;
	}

	return {
		collectionId: Number(match[1]),
		parentId: match[2] === 'root' ? null : Number(match[2]),
	};
}

// Favorites block key. The block holds rows of two kinds whose ids come from different tables, so
// the type is part of the key. One definition for the index and the pending toggles - they must never
// disagree on the shape of a key.
export function favoriteKey(entityType: string, entityId: number): string
{
	return `${entityType}:${Number(entityId)}`;
}

// [P2] Expansion inside the block is a property of a PLACE, not of an object: the same document can
// be a row of the block and, at the same time, hang inside the branch of an ancestor that is also in
// the list. Keyed by the object alone, opening it in one of those places opened it in the other -
// branches came apart somewhere else on the screen while the user was working inside one subtree.
// `scope` is the key of the top-level row the place belongs to; a top-level row itself has none.
export function favoriteExpandKey(entityType: string, entityId: number, scope: string = ''): string
{
	const key = favoriteKey(entityType, entityId);

	return scope === '' ? key : `${scope}/${key}`;
}
