import {
	ErrorCode,
	ObjectTypeFilter,
	PageSize,
	SearchQueryLength,
	StageType,
} from '../../const/picker';
import { type NormalizedFilterValues } from '../../const/types';
import {
	loadInitialStage as requestInitialStage,
	pickerErrorCode,
	search as requestSearch,
} from '../../infrastructure/service/file-picker/file-picker';
import {
	type InitialStageResult,
	type SearchResult,
} from '../../infrastructure/service/file-picker/types';
import { applyLocalFilters } from '../../lib/filter-items/filter-items';
import { useItemStore } from '../../model/item/item';
import { useSelectionStore } from '../../model/selection/selection';
import { useSessionStore } from '../../model/session/session';
import { type PickerConstraints, type PickerFeed, type SessionFilters } from '../../model/session/types';
import { useSourceStore } from '../../model/source/source';

export const FOLDER_NOT_FOUND_MESSAGE = 'DISK_PICKER_NOTIFY_FOLDER_NOT_FOUND';

export type InitialStageDeps = {
	constraints: PickerConstraints,
	restoredFilter: NormalizedFilterValues,
	notify: (messageCode: string) => void,
	onContextInvalid: () => void,
};

type SessionStore = ReturnType<typeof useSessionStore>;
type ItemStore = ReturnType<typeof useItemStore>;
type SourceStore = ReturnType<typeof useSourceStore>;

function resolveStartFeed(initialStage: PickerConstraints['initialStage']): PickerFeed
{
	if (initialStage !== null && initialStage.type === StageType.Folder)
	{
		return {
			stageType: StageType.Folder,
			storageId: initialStage.storageId,
			folderId: initialStage.folderId,
		};
	}

	if (initialStage !== null && initialStage.type === StageType.Sources)
	{
		return { stageType: StageType.Sources, storageId: null, folderId: null };
	}

	return { stageType: StageType.Recent, storageId: null, folderId: null };
}

function applyInitialStageResult(
	session: SessionStore,
	item: ItemStore,
	result: InitialStageResult,
	recentLocalFilters: SessionFilters | null,
): void
{
	session.setFeed(result.stage);
	session.setBreadcrumbsFromContext(result.context);
	if (recentLocalFilters === null)
	{
		item.replace(result.items);
		session.setEmptyReason(result.emptyReason);
	}
	else
	{
		// Recent: keep the full snapshot for later local re-filtering; the local
		// filter can empty the visible list, so the empty marker follows it.
		item.setRecentSnapshot(result.items);
		const visible = applyLocalFilters(result.items, recentLocalFilters);
		item.replace(visible);
		session.setEmptyReason(visible.length === 0 ? 'empty' : null);
	}
	const visibleIds = item.items.map((entry) => entry.objectId);
	useSelectionStore().pruneActive(visibleIds);
	session.setHasMore(result.stage.stageType === StageType.Sources ? false : result.pagination.hasMore);
	session.setLoading(false);
	session.markInitialized();
}

function applySearchResult(session: SessionStore, item: ItemStore, result: SearchResult): void
{
	// Search does not change the feed and carries no navigation context.
	session.setBreadcrumbsFromContext(null);
	item.replace(result.items);
	useSelectionStore().pruneActive(result.items.map((entry) => entry.objectId));
	session.setHasMore(result.pagination.hasMore);
	session.setEmptyReason(result.emptyReason);
	session.setLoading(false);
	session.markInitialized();
}

function startSourcesLoading(source: SourceStore): void
{
	source.setLoading(true);
	source.setError(null);
}

function applySourcesResult(source: SourceStore, result: InitialStageResult): void
{
	source.setSources(result.sources);
	source.setLoading(false);
}

function applySourcesError(source: SourceStore, code: string): void
{
	source.setError(code);
	source.setLoading(false);
}

async function loadSources(deps: InitialStageDeps, session: SessionStore): Promise<void>
{
	if (!session.isSessionActive())
	{
		return;
	}

	const source = useSourceStore();
	startSourcesLoading(source);

	try
	{
		const result = await requestInitialStage({
			initialStage: { type: StageType.Sources, storageId: null, folderId: null },
			filters: { objectTypeFilter: ObjectTypeFilter.All, fileTypeFilters: [] },
			allowedFileTypes: session.constraints.allowedFileTypes,
			pageSize: PageSize.Recent,
			signedConfig: session.constraints.signedConfig,
		});
		if (!session.isSessionActive())
		{
			return;
		}
		applySourcesResult(source, result);
	}
	catch (error)
	{
		if (pickerErrorCode(error) === ErrorCode.InvalidContext)
		{
			session.invalidateRequests();
			deps.onContextInvalid();

			return;
		}

		if (!session.isSessionActive())
		{
			return;
		}
		applySourcesError(source, pickerErrorCode(error));
	}
}

async function runRecovery(deps: InitialStageDeps, session: SessionStore, item: ItemStore): Promise<void>
{
	const recentFeed: PickerFeed = { stageType: StageType.Recent, storageId: null, folderId: null };
	session.setFeed(recentFeed);
	useSelectionStore().clear();
	session.resetSearchQuery();

	await runMainStart(deps, session, item, recentFeed, '', false);
}

function requestSearchPage(session: SessionStore, startFeed: PickerFeed, query: string): Promise<SearchResult>
{
	return requestSearch({
		query,
		storageId: startFeed.stageType === StageType.Folder ? startFeed.storageId : null,
		filters: session.filters,
		allowedFileTypes: session.constraints.allowedFileTypes,
		page: 1,
		pageSize: PageSize.Default,
		signedConfig: session.constraints.signedConfig,
	});
}

function requestStagePage(session: SessionStore, startFeed: PickerFeed): Promise<InitialStageResult>
{
	const isRecent = startFeed.stageType === StageType.Recent;

	return requestInitialStage({
		initialStage: { type: startFeed.stageType, storageId: startFeed.storageId, folderId: startFeed.folderId },
		filters: isRecent ? { objectTypeFilter: ObjectTypeFilter.All, fileTypeFilters: [] } : session.filters,
		allowedFileTypes: session.constraints.allowedFileTypes,
		pageSize: isRecent ? PageSize.Recent : PageSize.Default,
		signedConfig: session.constraints.signedConfig,
	});
}

type MainErrorContext = {
	token: number,
	searchActive: boolean,
	startFeed: PickerFeed,
	allowRecovery: boolean,
};

async function handleMainError(
	deps: InitialStageDeps,
	session: SessionStore,
	item: ItemStore,
	error: unknown,
	context: MainErrorContext,
): Promise<void>
{
	const code = pickerErrorCode(error);
	if (code === ErrorCode.InvalidContext)
	{
		session.invalidateRequests();
		deps.onContextInvalid();

		return;
	}

	if (!session.isCurrentRequest(context.token))
	{
		return;
	}

	const isRecoverable = context.allowRecovery
		&& !context.searchActive
		&& context.startFeed.stageType === StageType.Folder
		&& code === ErrorCode.NotFound;
	if (isRecoverable)
	{
		deps.notify(FOLDER_NOT_FOUND_MESSAGE);
		await runRecovery(deps, session, item);

		return;
	}

	session.setContentError(code);
	session.setLoading(false);
	session.markInitialized();
}

async function runMainStart(
	deps: InitialStageDeps,
	session: SessionStore,
	item: ItemStore,
	startFeed: PickerFeed,
	query: string,
	allowRecovery: boolean,
): Promise<void>
{
	const token = session.nextRequestToken();
	session.setLoading(true);
	session.clearContentError();

	const searchActive = [...query].length >= SearchQueryLength.Min;
	const sharesSourcesRequest = !searchActive && startFeed.stageType === StageType.Sources;
	const source = sharesSourcesRequest ? useSourceStore() : null;
	if (source !== null)
	{
		startSourcesLoading(source);
	}

	try
	{
		if (searchActive)
		{
			const result = await requestSearchPage(session, startFeed, query);
			if (session.isCurrentRequest(token))
			{
				applySearchResult(session, item, result);
			}

			return;
		}

		const result = await requestStagePage(session, startFeed);
		if (source !== null && session.isSessionActive())
		{
			applySourcesResult(source, result);
		}

		if (session.isCurrentRequest(token))
		{
			const localFilters = startFeed.stageType === StageType.Recent ? session.filters : null;
			applyInitialStageResult(session, item, result, localFilters);
		}
	}
	catch (error)
	{
		const code = pickerErrorCode(error);
		if (source !== null && code !== ErrorCode.InvalidContext && session.isSessionActive())
		{
			applySourcesError(source, code);
		}
		await handleMainError(deps, session, item, error, { token, searchActive, startFeed, allowRecovery });
	}
}

// Raises the picker from closed to working. Sources load in parallel with another
// feed or search; a plain sources stage shares its single response with the sidebar.
// The main request is chosen by the restored filter (length >= 3 searches,
// otherwise the start stage loads).
export async function loadInitialStage(deps: InitialStageDeps): Promise<void>
{
	const session = useSessionStore();
	const item = useItemStore();

	session.setConstraints(deps.constraints);
	session.setFilters({
		objectTypeFilter: deps.restoredFilter.objectTypeFilter,
		fileTypeFilters: deps.restoredFilter.fileTypeFilters,
	});

	const query = deps.restoredFilter.find.trim();
	session.setFilterFind(query);
	session.setSearchQuery(query);

	const startFeed = resolveStartFeed(deps.constraints.initialStage);
	session.setFeed(startFeed);

	const searchActive = [...query].length >= SearchQueryLength.Min;
	if (searchActive || startFeed.stageType !== StageType.Sources)
	{
		void loadSources(deps, session);
	}

	await runMainStart(deps, session, item, startFeed, query, true);
}

export async function retrySources(): Promise<void>
{
	const session = useSessionStore();
	await loadSources({
		constraints: session.constraints,
		restoredFilter: {
			find: session.searchQuery,
			objectTypeFilter: session.objectTypeFilter,
			fileTypeFilters: session.fileTypeFilters,
		},
		notify: session.callbacks.notify,
		onContextInvalid: session.callbacks.onContextInvalid,
	}, session);
}

export async function retryInitialStage(): Promise<void>
{
	const session = useSessionStore();
	const item = useItemStore();
	const deps: InitialStageDeps = {
		constraints: session.constraints,
		restoredFilter: {
			find: session.searchQuery,
			objectTypeFilter: session.objectTypeFilter,
			fileTypeFilters: session.fileTypeFilters,
		},
		notify: session.callbacks.notify,
		onContextInvalid: session.callbacks.onContextInvalid,
	};

	await runMainStart(deps, session, item, session.feed, '', false);
}
