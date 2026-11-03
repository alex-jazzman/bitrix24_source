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
import { applyLocalFilters, withLocalMatches } from '../../lib/filter-items/filter-items';
import { useItemStore } from '../../model/item/item';
import { useSelectionStore } from '../../model/selection/selection';
import { useSessionStore } from '../../model/session/session';
import { type PickerConstraints, type PickerFeed, type SessionFilters } from '../../model/session/types';
import { useSourceStore } from '../../model/source/source';
import {
	getSourceCache,
	setSourceCache,
	type SourceCacheSnapshot,
} from '../../model/source/source-cache';

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

function applySearchResult(
	session: SessionStore,
	item: ItemStore,
	result: SearchResult,
	query: string,
): void
{
	// Search does not change the feed and carries no navigation context.
	session.setBreadcrumbsFromContext(null);
	const items = session.stageType === StageType.Recent
		? withLocalMatches(result.items, item.recentSnapshot, session.filters, query)
		: result.items;
	item.replace(items);
	useSelectionStore().pruneActive(items.map((entry) => entry.objectId));
	session.setHasMore(result.pagination.hasMore);
	session.setEmptyReason(items.length === 0 ? result.emptyReason : null);
	session.setLoading(false);
	session.markInitialized();
}

function sourceSnapshot(source: SourceStore): SourceCacheSnapshot | null
{
	if (source.sourcesRevision === null)
	{
		return null;
	}

	return {
		sources: source.sources,
		page: source.sourcesPage,
		hasMore: source.sourcesHasMore,
		revision: source.sourcesRevision,
	};
}

function persistSources(source: SourceStore): void
{
	const snapshot = sourceSnapshot(source);
	if (snapshot !== null)
	{
		setSourceCache(snapshot);
	}
}

function prepareSourcesLoading(source: SourceStore): SourceCacheSnapshot | null
{
	const cached = getSourceCache();
	source.setError(null);
	source.setPageError(null);
	if (cached === null)
	{
		source.setLoading(true);
		source.setValidating(false);

		return null;
	}

	source.hydrate(cached);
	source.setLoading(false);
	source.setValidating(true);

	return cached;
}

function applySourcesResult(
	source: SourceStore,
	result: InitialStageResult,
	cached: SourceCacheSnapshot | null,
): void
{
	const revision = result.sourceRevision;
	if (revision === null)
	{
		throw new Error('DiskPicker: sources response has no catalogue revision');
	}

	if (cached === null || cached.revision !== revision)
	{
		source.replacePage(result.sources, 1, result.pagination.hasMore, revision);
		persistSources(source);
	}
	source.setLoading(false);
	source.setValidating(false);
}

function applySourcesError(
	source: SourceStore,
	code: string,
	cached: SourceCacheSnapshot | null,
): void
{
	if (cached === null && source.sources.length === 0)
	{
		source.setError(code);
	}
	source.setLoading(false);
	source.setValidating(false);
}

async function loadSources(deps: InitialStageDeps, session: SessionStore): Promise<void>
{
	if (!session.isSessionActive())
	{
		return;
	}

	const source = useSourceStore();
	const cached = prepareSourcesLoading(source);

	try
	{
		const result = await requestInitialStage({
			initialStage: { type: StageType.Sources, storageId: null, folderId: null },
			filters: { objectTypeFilter: ObjectTypeFilter.All, fileTypeFilters: [] },
			allowedFileTypes: session.constraints.allowedFileTypes,
			page: 1,
			pageSize: PageSize.Default,
			signedConfig: session.constraints.signedConfig,
		});
		if (!session.isSessionActive())
		{
			return;
		}
		applySourcesResult(source, result, cached);
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
		applySourcesError(source, pickerErrorCode(error), cached);
	}
}

// A vanished folder costs the feed, not the picked set: it belongs to the picker
// session, so only the active preview object is reset with the feed.
async function runRecovery(deps: InitialStageDeps, session: SessionStore, item: ItemStore): Promise<void>
{
	const recentFeed: PickerFeed = { stageType: StageType.Recent, storageId: null, folderId: null };
	session.setFeed(recentFeed);
	useSelectionStore().setActive(null);
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
		page: 1,
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
	let sourceCache: SourceCacheSnapshot | null = null;
	if (source !== null)
	{
		sourceCache = prepareSourcesLoading(source);
	}

	try
	{
		if (searchActive)
		{
			// A query restored onto the recent feed needs that feed loaded as well: chat files are
			// outside the server search and are matched against the snapshot, which nothing else on
			// this path fetches. Its failure only costs those matches, so it never fails the search.
			const recentRequest = startFeed.stageType === StageType.Recent
				? requestStagePage(session, startFeed).catch(() => null)
				: null;
			const result = await requestSearchPage(session, startFeed, query);
			const recent = recentRequest === null ? null : await recentRequest;
			if (session.isCurrentRequest(token))
			{
				if (recent !== null)
				{
					item.setRecentSnapshot(recent.items);
				}
				applySearchResult(session, item, result, query);
			}

			return;
		}

		const result = await requestStagePage(session, startFeed);
		if (source !== null && session.isSessionActive())
		{
			applySourcesResult(source, result, sourceCache);
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
			applySourcesError(source, code, sourceCache);
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
