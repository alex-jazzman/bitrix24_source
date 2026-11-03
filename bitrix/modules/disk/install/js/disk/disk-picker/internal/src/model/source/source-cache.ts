import { type PickerSource } from './types';

export type SourceCacheSnapshot = {
	sources: PickerSource[],
	page: number,
	hasMore: boolean,
	revision: string,
};

let snapshot: SourceCacheSnapshot | null = null;

function copy(sourceCache: SourceCacheSnapshot): SourceCacheSnapshot
{
	return {
		sources: sourceCache.sources.map((source) => ({ ...source })),
		page: sourceCache.page,
		hasMore: sourceCache.hasMore,
		revision: sourceCache.revision,
	};
}

export function getSourceCache(): SourceCacheSnapshot | null
{
	return snapshot === null ? null : copy(snapshot);
}

export function setSourceCache(next: SourceCacheSnapshot): void
{
	snapshot = copy(next);
}

export function clearSourceCache(): void
{
	snapshot = null;
}
