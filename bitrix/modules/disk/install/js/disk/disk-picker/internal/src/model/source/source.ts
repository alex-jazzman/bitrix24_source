import { defineStore } from 'ui.vue3.pinia';

import { type SourceCacheSnapshot } from './source-cache';
import { type PickerSource } from './types';

function mergeSources(current: PickerSource[], incoming: PickerSource[]): PickerSource[]
{
	const merged = current.map((source) => ({ ...source }));
	const indexes = new Map(merged.map((source, index) => [source.storageId, index]));
	incoming.forEach((source) => {
		const index = indexes.get(source.storageId);
		if (index === undefined)
		{
			indexes.set(source.storageId, merged.length);
			merged.push({ ...source });

			return;
		}

		merged[index] = { ...source };
	});

	return merged;
}

// Disk sources shown in the sidebar. Its loading/error state is fully
// independent of the main feed: a failed sources request must not remove the
// main output.
export const useSourceStore = defineStore('diskPickerSource', {
	state: (): {
		sources: PickerSource[],
		sourcesLoading: boolean,
		sourcesValidating: boolean,
		sourcesLoadingMore: boolean,
		sourcesError: string | null,
		sourcesPageError: string | null,
		sourcesHasMore: boolean,
		sourcesPage: number,
		sourcesRevision: string | null,
	} => ({
		sources: [],
		sourcesLoading: false,
		sourcesValidating: false,
		sourcesLoadingMore: false,
		sourcesError: null,
		sourcesPageError: null,
		sourcesHasMore: false,
		sourcesPage: 1,
		sourcesRevision: null,
	}),
	actions: {
		setSources(sources: PickerSource[]): void
		{
			this.sources = [...sources];
		},
		setLoading(loading: boolean): void
		{
			this.sourcesLoading = loading;
		},
		setError(code: string | null): void
		{
			this.sourcesError = code;
		},
		replacePage(
			sources: PickerSource[],
			page: number,
			hasMore: boolean,
			revision: string,
		): void
		{
			this.sources = mergeSources([], sources);
			this.sourcesPage = page;
			this.sourcesHasMore = hasMore;
			this.sourcesRevision = revision;
			this.sourcesError = null;
			this.sourcesPageError = null;
		},
		appendPage(
			sources: PickerSource[],
			page: number,
			hasMore: boolean,
			revision: string,
		): boolean
		{
			if (revision !== this.sourcesRevision)
			{
				return false;
			}

			this.sources = mergeSources(this.sources, sources);
			this.sourcesPage = page;
			this.sourcesHasMore = hasMore;
			this.sourcesPageError = null;

			return true;
		},
		hydrate(snapshot: SourceCacheSnapshot): void
		{
			this.replacePage(snapshot.sources, snapshot.page, snapshot.hasMore, snapshot.revision);
		},
		setValidating(validating: boolean): void
		{
			this.sourcesValidating = validating;
		},
		setLoadingMore(loading: boolean): void
		{
			this.sourcesLoadingMore = loading;
		},
		setPageError(code: string | null): void
		{
			this.sourcesPageError = code;
		},
		reset(): void
		{
			this.sources = [];
			this.sourcesLoading = false;
			this.sourcesValidating = false;
			this.sourcesLoadingMore = false;
			this.sourcesError = null;
			this.sourcesPageError = null;
			this.sourcesHasMore = false;
			this.sourcesPage = 1;
			this.sourcesRevision = null;
		},
	},
});
