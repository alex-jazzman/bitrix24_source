import { ErrorCode, ObjectTypeFilter, PageSize, StageType } from '../../const/picker';
import {
	loadInitialStage as requestInitialStage,
	pickerErrorCode,
} from '../../infrastructure/service/file-picker/file-picker';
import { applyLocalFilters } from '../../lib/filter-items/filter-items';
import { useItemStore } from '../../model/item/item';
import { useSelectionStore } from '../../model/selection/selection';
import { useSessionStore } from '../../model/session/session';
import { type PickerFeed } from '../../model/session/types';
import { type FeedDeps } from '../open-folder/open-folder';

const RECENT_FEED: PickerFeed = { stageType: StageType.Recent, storageId: null, folderId: null };

// Returns the picker to the recent feed. `changeFeed` cannot be reused: it
// rejects a feed with null storage/folder ids, which the recent stage always has.
// The reset mirrors a feed change (drop rows, active item, breadcrumbs, selection
// and the visible FIND with a suppressed apply), then loads the bounded recent
// snapshot and applies the current user filters locally, exactly like the start
// stage.
export async function switchToRecent(deps: FeedDeps): Promise<void>
{
	const session = useSessionStore();
	const item = useItemStore();

	if (session.isSameFeed(RECENT_FEED))
	{
		return;
	}

	const token = session.nextRequestToken();
	session.setLoading(true);
	session.setFeed(RECENT_FEED);
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
		const result = await requestInitialStage({
			initialStage: { type: StageType.Recent, storageId: null, folderId: null },
			filters: { objectTypeFilter: ObjectTypeFilter.All, fileTypeFilters: [] },
			allowedFileTypes: session.constraints.allowedFileTypes,
			pageSize: PageSize.Recent,
			signedConfig: session.constraints.signedConfig,
		});
		if (!session.isCurrentRequest(token))
		{
			return;
		}
		session.setBreadcrumbsFromContext(result.context);
		item.setRecentSnapshot(result.items);
		const visible = applyLocalFilters(result.items, session.filters);
		item.replace(visible);
		useSelectionStore().pruneActive(visible.map((entry) => entry.objectId));
		session.setHasMore(result.pagination.hasMore);
		session.setEmptyReason(visible.length === 0 ? 'empty' : null);
		session.setLoading(false);
	}
	catch (error)
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
}
