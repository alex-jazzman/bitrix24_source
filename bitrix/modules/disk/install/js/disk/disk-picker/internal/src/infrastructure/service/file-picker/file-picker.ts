import { ajax, Type } from 'main.core';

import { FilePickerAction, PageSize } from '../../../const/picker';

import {
	ContractViolationError,
	mapInitialStage,
	mapListChildren,
	mapResolveSelection,
	mapSearch,
} from './mappers';
import {
	type InitialStageRequest,
	type InitialStageResult,
	type ListChildrenRequest,
	type ListChildrenResult,
	type ResolveSelectionRequest,
	type ResolveSelectionResult,
	type SearchRequest,
	type SearchResult,
} from './types';

const TRANSPORT_ERROR_CODE = 'transport';
const INVALID_QUERY_CODE = 'invalid_query';

// Backend error surfaced to the feature layer as a bare code; the message is
// chosen by the UI. A ContractViolationError is mapped to a generic code so the
// user never sees a different failure than an unknown code or transport error.
export class PickerRequestError extends Error
{
	constructor(readonly code: string)
	{
		super(`DiskPicker request failed: ${code}`);
		this.name = 'PickerRequestError';
	}
}

// Reduces any thrown adapter error to a stable code for the feature layer. A
// ContractViolationError becomes the generic 'contract_violation'; anything
// else without a code becomes a transport failure.
export function pickerErrorCode(error: unknown): string
{
	if (error instanceof PickerRequestError || error instanceof ContractViolationError)
	{
		return error.code;
	}

	return TRANSPORT_ERROR_CODE;
}

// Page size is capped at a hundred; the grand-total parameter is never sent.
function cappedPageSize(pageSize: number): number
{
	return Math.min(pageSize, PageSize.Max);
}

function withSignedConfig(payload: { [key: string]: unknown }, signedConfig: Object | null): { [key: string]: unknown }
{
	if (signedConfig === null)
	{
		return payload;
	}

	return { ...payload, signedConfig };
}

function assertEngineSuccess(response: unknown): unknown
{
	if (
		!Type.isPlainObject(response)
		|| (response as { status?: unknown }).status !== 'success'
		|| !Type.isPlainObject((response as { data?: unknown }).data)
	)
	{
		throw new PickerRequestError(TRANSPORT_ERROR_CODE);
	}

	return (response as { data: unknown }).data;
}

function toRequestError(rejection: unknown): PickerRequestError
{
	const errors = Type.isPlainObject(rejection) ? (rejection as { errors?: unknown }).errors : null;
	if (Type.isArray(errors) && errors.length > 0)
	{
		const code = (errors[0] as { code?: unknown })?.code;
		if (Type.isStringFilled(code))
		{
			return new PickerRequestError(code);
		}
	}

	return new PickerRequestError(TRANSPORT_ERROR_CODE);
}

function runMapper<T>(data: unknown, map: (data: unknown) => T): T
{
	try
	{
		return map(data);
	}
	catch (error)
	{
		if (error instanceof ContractViolationError)
		{
			// Log only the method and field path - never the payload.
			console.error('DiskPicker: contract violation', { method: error.method, path: error.path });
		}

		throw error;
	}
}

async function callAction<T>(
	action: string,
	payload: { [key: string]: unknown },
	map: (data: unknown) => T,
): Promise<T>
{
	// The transport failure is normalized here; the domain mapping runs after, so
	// a ContractViolationError never reads as a transport error.
	const response = await ajax.runAction(action, { data: payload }).catch((rejection: unknown) => {
		throw toRequestError(rejection);
	});

	return runMapper(assertEngineSuccess(response), map);
}

export function loadInitialStage(request: InitialStageRequest): Promise<InitialStageResult>
{
	const payload = withSignedConfig(
		{
			objectTypeFilter: request.filters.objectTypeFilter,
			fileTypeFilters: request.filters.fileTypeFilters,
			allowedFileTypes: request.allowedFileTypes,
			pageSize: cappedPageSize(request.pageSize),
			...(request.initialStage === null ? {} : { initialStage: request.initialStage }),
		},
		request.signedConfig,
	);

	return callAction(FilePickerAction.GetInitialStage, payload, mapInitialStage);
}

export function listChildren(request: ListChildrenRequest): Promise<ListChildrenResult>
{
	const payload = withSignedConfig(
		{
			storageId: request.storageId,
			folderId: request.folderId,
			objectTypeFilter: request.filters.objectTypeFilter,
			fileTypeFilters: request.filters.fileTypeFilters,
			allowedFileTypes: request.allowedFileTypes,
			order: request.order,
			page: request.page,
			pageSize: cappedPageSize(request.pageSize),
		},
		request.signedConfig,
	);

	return callAction(FilePickerAction.ListChildren, payload, mapListChildren);
}

export function search(request: SearchRequest): Promise<SearchResult>
{
	const query = request.query.trim();
	if (query === '')
	{
		// Adapter contract: search requires a non-empty query string.
		return Promise.reject(new PickerRequestError(INVALID_QUERY_CODE));
	}

	const payload = withSignedConfig(
		{
			query,
			storageId: request.storageId,
			objectTypeFilter: request.filters.objectTypeFilter,
			fileTypeFilters: request.filters.fileTypeFilters,
			allowedFileTypes: request.allowedFileTypes,
			page: request.page,
			pageSize: cappedPageSize(request.pageSize),
		},
		request.signedConfig,
	);

	return callAction(FilePickerAction.Search, payload, mapSearch);
}

export function resolveSelection(request: ResolveSelectionRequest): Promise<ResolveSelectionResult>
{
	// maxItems is intentionally not sent: the action validates it with a strict
	// integer rule, but the ajax transport form-encodes every scalar as a string,
	// which that rule rejects. Left null, the backend derives the effective limit
	// itself (single -> 1, otherwise the page-size cap) and, in signed mode, from the
	// signed config; the client-side cap in toggle-selection still applies.
	const payload = withSignedConfig(
		{
			objectIds: request.objectIds,
			selectionMode: request.selectionMode,
			allowedFileTypes: request.allowedFileTypes,
		},
		request.signedConfig,
	);

	return callAction(FilePickerAction.ResolveSelection, payload, mapResolveSelection);
}
