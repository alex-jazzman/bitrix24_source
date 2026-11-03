import {
	type ListChildrenRequest,
	type ListChildrenResult,
} from '../../infrastructure/service/file-picker/types';

export const FOLDER_PAGE_CACHE_LIMIT = 20;

const pages = new Map<string, ListChildrenResult>();

function key(request: ListChildrenRequest): string
{
	return JSON.stringify({
		storageId: request.storageId,
		folderId: request.folderId,
		objectTypeFilter: request.filters.objectTypeFilter,
		fileTypeFilters: [...request.filters.fileTypeFilters].sort(),
		allowedFileTypes: [...request.allowedFileTypes].sort(),
		orderField: request.order.field,
		orderDirection: request.order.direction,
		pageSize: request.pageSize,
	});
}

function copy(result: ListChildrenResult): ListChildrenResult
{
	return {
		items: result.items.map((item) => ({ ...item })),
		pagination: { ...result.pagination },
		context: {
			storageId: result.context.storageId,
			folderId: result.context.folderId,
			currentFolder: result.context.currentFolder === null
				? null
				: { ...result.context.currentFolder },
			breadcrumbs: result.context.breadcrumbs.map((breadcrumb) => ({ ...breadcrumb })),
		},
		emptyReason: result.emptyReason,
	};
}

export function getFolderPage(request: ListChildrenRequest): ListChildrenResult | null
{
	if (request.page !== 1)
	{
		return null;
	}

	const cacheKey = key(request);
	const cached = pages.get(cacheKey);
	if (cached === undefined)
	{
		return null;
	}

	pages.delete(cacheKey);
	pages.set(cacheKey, cached);

	return copy(cached);
}

export function setFolderPage(request: ListChildrenRequest, result: ListChildrenResult): void
{
	if (request.page !== 1)
	{
		return;
	}

	const cacheKey = key(request);
	pages.delete(cacheKey);
	pages.set(cacheKey, copy(result));

	while (pages.size > FOLDER_PAGE_CACHE_LIMIT)
	{
		const oldestKey = pages.keys().next().value;
		if (oldestKey === undefined)
		{
			break;
		}
		pages.delete(oldestKey);
	}
}

export function clearFolderPages(): void
{
	pages.clear();
}
