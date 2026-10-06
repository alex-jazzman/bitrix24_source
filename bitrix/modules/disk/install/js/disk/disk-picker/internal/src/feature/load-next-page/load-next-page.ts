import { DEFAULT_ORDER, ErrorCode, PageSize, SearchQueryLength, StageType } from '../../const/picker';
import {
	listChildren as requestListChildren,
	pickerErrorCode,
	search as requestSearch,
} from '../../infrastructure/service/file-picker/file-picker';
import {
	type ListChildrenResult,
	type OrderInput,
	type SearchResult,
} from '../../infrastructure/service/file-picker/types';
import { useItemStore } from '../../model/item/item';
import { useSessionStore } from '../../model/session/session';

export type NextPageDeps = {
	onContextInvalid: () => void,
};

type SessionStore = ReturnType<typeof useSessionStore>;
type ItemStore = ReturnType<typeof useItemStore>;

const MAX_EMPTY_STREAK = 3;
const DEFAULT_ORDER_INPUT = DEFAULT_ORDER as OrderInput;

function isSearchActive(session: SessionStore): boolean
{
	return [...session.searchQuery.trim()].length >= SearchQueryLength.Min;
}

function fetchPage(session: SessionStore, page: number): Promise<ListChildrenResult | SearchResult>
{
	if (isSearchActive(session))
	{
		return requestSearch({
			query: session.searchQuery.trim(),
			storageId: session.stageType === StageType.Folder ? session.storageId : null,
			filters: session.filters,
			allowedFileTypes: session.constraints.allowedFileTypes,
			page,
			pageSize: PageSize.Default,
			signedConfig: session.constraints.signedConfig,
		});
	}

	return requestListChildren({
		storageId: session.storageId as number,
		folderId: session.folderId as number,
		filters: session.filters,
		allowedFileTypes: session.constraints.allowedFileTypes,
		order: DEFAULT_ORDER_INPUT,
		page,
		pageSize: PageSize.Default,
		signedConfig: session.constraints.signedConfig,
	});
}

async function fetchPageOrHandle(
	deps: NextPageDeps,
	session: SessionStore,
	token: number,
	nextPage: number,
): Promise<ListChildrenResult | SearchResult | null>
{
	try
	{
		return await fetchPage(session, nextPage);
	}
	catch (error)
	{
		if (pickerErrorCode(error) === ErrorCode.InvalidContext)
		{
			session.invalidateRequests();
			deps.onContextInvalid();

			return null;
		}

		if (session.isCurrentRequest(token))
		{
			// A failed page keeps the loaded list and offers a retry at the end.
			session.setLoadingMore(false);
			session.setPaginationStalled(true);
		}

		return null;
	}
}

async function runNextPage(deps: NextPageDeps, session: SessionStore, item: ItemStore): Promise<void>
{
	session.setLoadingMore(true);
	const token = session.nextRequestToken();
	const nextPage = session.page + 1;

	const result = await fetchPageOrHandle(deps, session, token, nextPage);
	if (result === null || !session.isCurrentRequest(token))
	{
		// Feed changed, session closed or the request failed: drop this page.
		return;
	}

	// Cross-page merge is by objectId only; a duplicate row refreshes fields
	// without moving position and without touching the selection.
	const added = item.append(result.items);
	session.setPage(nextPage);
	session.setHasMore(result.pagination.hasMore);
	session.setLoadingMore(false);

	if (added > 0)
	{
		session.setEmptyStreak(0);

		return;
	}

	const streak = session.emptyStreak + 1;
	session.setEmptyStreak(streak);

	if (!result.pagination.hasMore)
	{
		return;
	}

	if (streak >= MAX_EMPTY_STREAK)
	{
		// Three duplicate pages in a row: stop and offer a retry; the next page
		// stays ready and is not re-requested.
		session.setPaginationStalled(true);

		return;
	}

	// A fully duplicate page with more available continues immediately.
	await runNextPage(deps, session, item);
}

// Loads the next page for folder and search feeds as the user scrolls near the
// end. The recent snapshot is a single request without pagination, so it is
// excluded - except while a global search runs over it, which paginates like any
// other search feed.
export function loadNextPage(deps: NextPageDeps): Promise<void>
{
	const session = useSessionStore();
	const item = useItemStore();

	if (
		!session.hasMore
		|| session.loadingMore
		|| session.paginationStalled
		|| (session.stageType === StageType.Sources && !isSearchActive(session))
		|| (session.stageType === StageType.Recent && !isSearchActive(session))
	)
	{
		return Promise.resolve();
	}

	return runNextPage(deps, session, item);
}

// Continues the pagination chain from the ready next page after a stall.
export function retryNextPage(deps: NextPageDeps): Promise<void>
{
	const session = useSessionStore();
	session.setPaginationStalled(false);

	return loadNextPage(deps);
}
