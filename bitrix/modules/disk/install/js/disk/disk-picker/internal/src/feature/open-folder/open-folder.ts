import { DEFAULT_ORDER, ErrorCode, PageSize, StageType } from '../../const/picker';
import {
	listChildren as requestListChildren,
	pickerErrorCode,
} from '../../infrastructure/service/file-picker/file-picker';
import { type OrderInput } from '../../infrastructure/service/file-picker/types';
import { useItemStore } from '../../model/item/item';
import { type PickerItem } from '../../model/item/types';
import { useSelectionStore } from '../../model/selection/selection';
import { useSessionStore } from '../../model/session/session';
import { type DisplayBreadcrumb, type PickerFeed } from '../../model/session/types';

export type FeedDeps = {
	// Clears the visible FIND of the standard filter with its apply event
	// suppressed, so a feed change fires exactly one request.
	suppressFilterFind: () => void,
	onContextInvalid: () => void,
};

type SessionStore = ReturnType<typeof useSessionStore>;

const DEFAULT_ORDER_INPUT = DEFAULT_ORDER as OrderInput;

function handleFeedError(session: SessionStore, deps: FeedDeps, error: unknown, token: number): void
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
	// An error does not roll back state: the target feed shows its error screen.
	session.setContentError(code);
	session.setLoading(false);
}

// ALG-03 changeFeed: fixes the new feed before the request and clears rows,
// active item, breadcrumbs and pagination immediately; selection is dropped by
// setFeed. The search query is reset and the visible FIND cleared with a
// suppressed apply, so exactly one request fires.
export async function changeFeed(nextFeed: PickerFeed, deps: FeedDeps): Promise<void>
{
	const session = useSessionStore();
	const item = useItemStore();

	if (session.isSameFeed(nextFeed))
	{
		return;
	}

	if (nextFeed.storageId === null || nextFeed.folderId === null)
	{
		return;
	}

	const token = session.nextRequestToken();
	session.setLoading(true);
	session.setFeed(nextFeed);
	useSelectionStore().clear();
	deps.suppressFilterFind();
	session.setFilterFind('');
	session.resetSearchQuery();
	item.clear();
	session.setBreadcrumbs([]);
	session.setHasMore(false);
	session.clearContentError();

	try
	{
		const result = await requestListChildren({
			storageId: nextFeed.storageId,
			folderId: nextFeed.folderId,
			filters: session.filters,
			allowedFileTypes: session.constraints.allowedFileTypes,
			order: DEFAULT_ORDER_INPUT,
			page: 1,
			pageSize: PageSize.Default,
			signedConfig: session.constraints.signedConfig,
		});
		if (!session.isCurrentRequest(token))
		{
			return;
		}
		item.replace(result.items);
		session.setBreadcrumbsFromContext(result.context);
		session.setHasMore(result.pagination.hasMore);
		session.setEmptyReason(result.emptyReason);
		session.setLoading(false);
	}
	catch (error)
	{
		handleFeedError(session, deps, error, token);
	}
}

// Retry after an error reloads the current feed with a new token and the current
// filters; it does not compare feeds and keeps the selection.
export async function reloadCurrentFeed(deps: FeedDeps): Promise<void>
{
	const session = useSessionStore();
	const item = useItemStore();
	const feed = session.feed;

	if (feed.storageId === null || feed.folderId === null)
	{
		return;
	}

	session.invalidateConfirmation();
	const token = session.nextRequestToken();
	session.setLoading(true);
	session.clearContentError();
	session.resetPagination();

	try
	{
		const result = await requestListChildren({
			storageId: feed.storageId,
			folderId: feed.folderId,
			filters: session.filters,
			allowedFileTypes: session.constraints.allowedFileTypes,
			order: DEFAULT_ORDER_INPUT,
			page: 1,
			pageSize: PageSize.Default,
			signedConfig: session.constraints.signedConfig,
		});
		if (!session.isCurrentRequest(token))
		{
			return;
		}
		item.replace(result.items);
		// Same feed, selection kept: only drop the active preview if it vanished.
		useSelectionStore().pruneActive(result.items.map((entry) => entry.objectId));
		session.setBreadcrumbsFromContext(result.context);
		session.setHasMore(result.pagination.hasMore);
		session.setEmptyReason(result.emptyReason);
		session.setLoading(false);
	}
	catch (error)
	{
		handleFeedError(session, deps, error, token);
	}
}

// Clicking a folder always navigates into it, building the pair from the item's
// own source and object id - even a folder from a foreign source in search.
export function openFolder(item: PickerItem, deps: FeedDeps): Promise<void>
{
	return changeFeed(
		{ stageType: StageType.Folder, storageId: item.sourceId, folderId: item.objectId },
		deps,
	);
}

// Clicking a breadcrumb navigates to an ancestor. A breadcrumb has no storageId
// of its own; the current feed's storage is reused. Rejected outside a folder
// stage.
export function openBreadcrumb(breadcrumb: DisplayBreadcrumb, deps: FeedDeps): Promise<void>
{
	const session = useSessionStore();
	const feed = session.feed;

	if (feed.stageType !== StageType.Folder || feed.storageId === null || feed.storageId <= 0)
	{
		return Promise.resolve();
	}

	return changeFeed(
		{ stageType: StageType.Folder, storageId: feed.storageId, folderId: breadcrumb.objectId },
		deps,
	);
}
