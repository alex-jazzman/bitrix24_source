import { ErrorCode, PageSize, SearchQueryLength, StageType } from '../../const/picker';
import {
	pickerErrorCode,
	search as requestSearch,
} from '../../infrastructure/service/file-picker/file-picker';
import { applyLocalFilters } from '../../lib/filter-items/filter-items';
import { useItemStore } from '../../model/item/item';
import { useSelectionStore } from '../../model/selection/selection';
import { useSessionStore } from '../../model/session/session';
import { reloadCurrentFeed, type FeedDeps } from '../open-folder/open-folder';

export type SearchDeps = FeedDeps;

type SessionStore = ReturnType<typeof useSessionStore>;

function queryLength(query: string): number
{
	return [...query].length;
}

function handleSearchError(session: SessionStore, deps: SearchDeps, error: unknown, token: number): void
{
	const code = pickerErrorCode(error);
	if (code === ErrorCode.InvalidContext)
	{
		session.invalidateRequests();
		deps.onContextInvalid();

		return;
	}

	if (!session.isCurrentRequest(token))
	{
		return;
	}

	session.setContentError(code);
	session.setLoading(false);
}

// Returns from search to the feed the user started from. The feed itself is never
// changed by search, so "returning" is just re-deriving the base output for the
// current filters: sources return to their file-less start screen, the recent
// snapshot is re-filtered locally without a request, and a folder feed is
// reloaded from its first page. Selection is kept in every case.
export async function restoreBaseFeed(deps: SearchDeps): Promise<void>
{
	const session = useSessionStore();
	session.invalidateConfirmation();
	session.resetSearchQuery();

	if (session.stageType === StageType.Sources)
	{
		session.nextRequestToken();

		useItemStore().replace([]);
		useSelectionStore().pruneActive([]);
		session.setBreadcrumbs([]);
		session.resetPagination();
		session.setHasMore(false);
		session.setEmptyReason(null);
		session.clearContentError();
		session.setLoading(false);

		return;
	}

	if (session.stageType === StageType.Recent)
	{
		// The snapshot is restored without a request, so retire the search that may
		// still be in flight: its late answer would overwrite what we restore here.
		session.nextRequestToken();

		const item = useItemStore();
		const visible = applyLocalFilters(item.recentSnapshot, session.filters);
		item.replace(visible);
		useSelectionStore().pruneActive(visible.map((entry) => entry.objectId));
		session.setHasMore(false);
		session.setEmptyReason(visible.length === 0 ? 'empty' : null);
		session.clearContentError();
		session.setLoading(false);

		return;
	}

	// Folder feed: a light loading state covers the request, never an empty flash.
	await reloadCurrentFeed(deps);
}

// Replaces the current list with a search result. Search is the one list mode that
// is not a feed change: it keeps the selection untouched (AC-035/AC-014) and only
// re-derives the visible rows and the active preview. Below the 3-code-point bound
// the query is not sent; an already-active search returns to the base feed, while
// 1-2 characters typed from a non-search state leave the base output in place.
export async function searchItems(rawQuery: string, deps: SearchDeps): Promise<void>
{
	const session = useSessionStore();
	if (!session.isSessionActive())
	{
		return;
	}

	const query = rawQuery.trim();
	session.setFilterFind(query);

	if (queryLength(query) < SearchQueryLength.Min)
	{
		if (session.searchQuery !== '')
		{
			await restoreBaseFeed(deps);
		}

		return;
	}

	session.setSearchQuery(query);
	session.invalidateConfirmation();
	const token = session.nextRequestToken();
	session.setLoading(true);
	session.clearContentError();
	session.resetPagination();
	session.setHasMore(false);

	try
	{
		const result = await requestSearch({
			query,
			storageId: session.stageType === StageType.Folder ? session.storageId : null,
			filters: session.filters,
			allowedFileTypes: session.constraints.allowedFileTypes,
			page: 1,
			pageSize: PageSize.Default,
			signedConfig: session.constraints.signedConfig,
		});

		if (!session.isCurrentRequest(token))
		{
			return;
		}

		const item = useItemStore();
		item.replace(result.items);
		useSelectionStore().pruneActive(result.items.map((entry) => entry.objectId));
		session.setHasMore(result.pagination.hasMore);
		session.setEmptyReason(result.emptyReason);
		session.setLoading(false);
	}
	catch (error)
	{
		handleSearchError(session, deps, error, token);
	}
}
