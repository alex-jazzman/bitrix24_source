import {
	ErrorCode,
	ObjectTypeFilter,
	PageSize,
	StageType,
} from '../../const/picker';
import {
	loadInitialStage as requestInitialStage,
	pickerErrorCode,
} from '../../infrastructure/service/file-picker/file-picker';
import { retrySources } from '../load-initial-stage/load-initial-stage';
import { useSessionStore } from '../../model/session/session';
import { useSourceStore } from '../../model/source/source';
import { setSourceCache } from '../../model/source/source-cache';

function requestRunning(): boolean
{
	const source = useSourceStore();

	return source.sourcesLoading || source.sourcesValidating || source.sourcesLoadingMore;
}

function persistSources(): void
{
	const source = useSourceStore();
	if (source.sourcesRevision === null)
	{
		return;
	}

	setSourceCache({
		sources: source.sources,
		page: source.sourcesPage,
		hasMore: source.sourcesHasMore,
		revision: source.sourcesRevision,
	});
}

export async function loadNextSourcePage(): Promise<void>
{
	const session = useSessionStore();
	const source = useSourceStore();
	if (
		!session.isSessionActive()
		|| requestRunning()
		|| !source.sourcesHasMore
		|| source.sourcesRevision === null
	)
	{
		return;
	}

	const requestedPage = source.sourcesPage + 1;
	source.setPageError(null);
	source.setLoadingMore(true);

	try
	{
		const result = await requestInitialStage({
			initialStage: { type: StageType.Sources, storageId: null, folderId: null },
			filters: { objectTypeFilter: ObjectTypeFilter.All, fileTypeFilters: [] },
			allowedFileTypes: session.constraints.allowedFileTypes,
			page: requestedPage,
			pageSize: PageSize.Default,
			signedConfig: session.constraints.signedConfig,
		});
		if (!session.isSessionActive())
		{
			return;
		}

		if (result.sourceRevision !== source.sourcesRevision)
		{
			source.setLoadingMore(false);
			await retrySources();

			return;
		}

		if (source.appendPage(
			result.sources,
			requestedPage,
			result.pagination.hasMore,
			result.sourceRevision,
		))
		{
			persistSources();
		}
	}
	catch (error)
	{
		const code = pickerErrorCode(error);
		if (code === ErrorCode.InvalidContext)
		{
			session.invalidateRequests();
			session.callbacks.onContextInvalid();

			return;
		}

		if (session.isSessionActive())
		{
			source.setPageError(code);
		}
	}
	finally
	{
		if (session.isSessionActive())
		{
			source.setLoadingMore(false);
		}
	}
}

export async function retrySourcePage(): Promise<void>
{
	useSourceStore().setPageError(null);
	await loadNextSourcePage();
}
