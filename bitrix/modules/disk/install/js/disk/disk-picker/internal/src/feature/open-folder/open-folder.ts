import { DEFAULT_ORDER, ErrorCode, PageSize, StageType } from '../../const/picker';
import {
	listChildren as requestListChildren,
	pickerErrorCode,
} from '../../infrastructure/service/file-picker/file-picker';
import {
	type ListChildrenRequest,
	type ListChildrenResult,
	type OrderInput,
} from '../../infrastructure/service/file-picker/types';
import { pauseAndClearPreviews, resumePreviews } from '../../lib/preview-load-queue/preview-load-queue';
import { clearFolderPages, getFolderPage, setFolderPage } from '../../model/item/folder-page-cache';
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
type ItemStore = ReturnType<typeof useItemStore>;

const DEFAULT_ORDER_INPUT = DEFAULT_ORDER as OrderInput;

export const FOLDER_NOT_REFRESHED_MESSAGE = 'DISK_PICKER_NOTIFY_FOLDER_NOT_REFRESHED';

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

function firstPageRequest(session: SessionStore, feed: PickerFeed): ListChildrenRequest
{
	return {
		storageId: feed.storageId as number,
		folderId: feed.folderId as number,
		filters: session.filters,
		allowedFileTypes: session.constraints.allowedFileTypes,
		order: DEFAULT_ORDER_INPUT,
		page: 1,
		pageSize: PageSize.Default,
		signedConfig: session.constraints.signedConfig,
	};
}

function applyFirstPage(session: SessionStore, item: ItemStore, result: ListChildrenResult): void
{
	item.replace(result.items);
	useSelectionStore().pruneActive(result.items.map((entry) => entry.objectId));
	session.setBreadcrumbsFromContext(result.context);
	session.setHasMore(result.pagination.hasMore);
	session.setEmptyReason(result.emptyReason);
}

function finishNavigation(session: SessionStore): void
{
	session.setNavigationPending(false);
	session.setLoading(false);
	resumePreviews();
}

// A navigation holds two things that outlive its request token: the pending flag and the
// paused preview queue. A scenario that takes the turn away from it — the recent feed, a
// search, a reload — has to release them itself, because the navigation it interrupted finds
// its token stale and returns without touching anything. Left held, previews never load again
// and pagination stays switched off until the next navigation.
export function releaseNavigationHold(): void
{
	const session = useSessionStore();
	if (!session.navigationPending)
	{
		return;
	}

	session.setNavigationPending(false);
	resumePreviews();
}

function handleNavigationError(
	session: SessionStore,
	item: ItemStore,
	deps: FeedDeps,
	error: unknown,
	token: number,
	hadCachedPage: boolean,
): void
{
	const code = pickerErrorCode(error);
	if (code === ErrorCode.InvalidContext)
	{
		clearFolderPages();
		// The feed is gone, its previews with it; the picked set is not, and the observer of
		// its cards has already fired and would never ask for a thumbnail again. Dropping
		// everything belongs to the unmount, not here.
		pauseAndClearPreviews();
		resumePreviews();
		session.invalidateRequests();
		session.setNavigationPending(false);
		deps.onContextInvalid();

		return;
	}

	if (!session.isCurrentRequest(token))
	{
		return;
	}

	if (hadCachedPage)
	{
		// The cached page stays: it is this folder's own content, and replacing it with an error
		// screen would throw away a usable list over a failed refresh. Silent it is not, though —
		// the rows on screen are the ones from last time, and the user is told so.
		session.callbacks.notify(FOLDER_NOT_REFRESHED_MESSAGE);
	}
	else
	{
		item.clear();
		session.setContentError(code);
	}
	finishNavigation(session);
}

// ALG-03 changeFeed: fixes the new feed before the request, installs the inferred
// target breadcrumbs and resets pagination. The picked set belongs to the picker
// session and survives the feed change; only the active preview object is reset,
// because it is bound to the visible list. The search query is reset and the
// visible FIND cleared with a suppressed apply, so exactly one request fires.
export async function changeFeed(
	nextFeed: PickerFeed,
	deps: FeedDeps,
	optimisticBreadcrumbs: DisplayBreadcrumb[] = [],
): Promise<void>
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
	pauseAndClearPreviews();
	session.setNavigationPending(true);
	session.setFeed(nextFeed);
	useSelectionStore().setActive(null);
	deps.suppressFilterFind();
	session.setFilterFind('');
	session.resetSearchQuery();
	session.setBreadcrumbs(optimisticBreadcrumbs);
	session.setHasMore(false);
	session.clearContentError();

	const request = firstPageRequest(session, nextFeed);
	const cached = getFolderPage(request);
	if (cached === null)
	{
		session.setPreserveContentOnLoading(true);
		session.setLoading(true);
	}
	else
	{
		applyFirstPage(session, item, cached);
		session.setLoading(false);
	}

	try
	{
		const result = await requestListChildren(request);
		if (!session.isCurrentRequest(token))
		{
			return;
		}
		applyFirstPage(session, item, result);
		setFolderPage(request, result);
		finishNavigation(session);
	}
	catch (error)
	{
		handleNavigationError(session, item, deps, error, token, cached !== null);
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

	releaseNavigationHold();
	session.invalidateConfirmation();
	const token = session.nextRequestToken();
	// A refilter keeps the rows dimmed under the request rather than flashing the skeleton;
	// an empty list has nothing to keep and falls back to it.
	session.setPreserveContentOnLoading(item.count > 0);
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
function childBreadcrumbs(item: PickerItem): DisplayBreadcrumb[]
{
	const session = useSessionStore();
	const canInferPath = session.stageType === StageType.Folder
		&& session.storageId === item.sourceId
		&& session.searchQuery === ''
		&& session.breadcrumbs.length > 0;

	if (!canInferPath)
	{
		return [];
	}

	return [
		...session.breadcrumbs,
		{ objectId: item.objectId, name: item.name },
	];
}

export function openFolder(item: PickerItem, deps: FeedDeps): Promise<void>
{
	const optimisticBreadcrumbs = childBreadcrumbs(item);

	return changeFeed(
		{ stageType: StageType.Folder, storageId: item.sourceId, folderId: item.objectId },
		deps,
		optimisticBreadcrumbs,
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

	const breadcrumbIndex = session.breadcrumbs.findIndex(
		(entry) => entry.objectId === breadcrumb.objectId,
	);
	const optimisticBreadcrumbs = breadcrumbIndex >= 0
		? session.breadcrumbs.slice(0, breadcrumbIndex + 1)
		: [];

	return changeFeed(
		{ stageType: StageType.Folder, storageId: feed.storageId, folderId: breadcrumb.objectId },
		deps,
		optimisticBreadcrumbs,
	);
}

// Backspace: up to the parent of a nested folder; a root, the recent feed, a blocking
// load and a running confirmation are no-ops. Returns the id of the folder being left.
export function openParentFolder(deps: FeedDeps): number | null
{
	const session = useSessionStore();
	const parent = session.breadcrumbs.length > 1
		? session.breadcrumbs[session.breadcrumbs.length - 2]
		: null;
	const blocked = session.contentLoading || session.navigationPending || session.confirming;

	if (session.stageType !== StageType.Folder || parent === null || blocked || session.folderId === null)
	{
		return null;
	}

	const leavingFolderId = session.folderId;
	void openBreadcrumb(parent, deps);

	return leavingFolderId;
}
