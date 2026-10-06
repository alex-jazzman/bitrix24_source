import {
	type EmptyReasonValue,
	type OrderDirectionValue,
	type OrderFieldValue,
	type SelectionModeValue,
	type StageTypeValue,
} from '../../../const/types';
import { type PickerItem } from '../../../model/item/types';
import { type NavigationContext, type PickerFeed, type SessionFilters } from '../../../model/session/types';
import { type PickerSource } from '../../../model/source/types';

// Thrown on the first schema violation. Carries only the method and field path;
// the offending payload is never attached, so it is safe to surface to logs.
export class ContractViolationError extends Error
{
	readonly code: string = 'contract_violation';

	constructor(readonly method: string, readonly path: string)
	{
		super(`DiskPicker contract violation at ${method}: ${path}`);
		this.name = 'ContractViolationError';
	}
}

// Standard Engine envelope around `data`. Verified by a separate transport check
// before the domain schema is validated.
export type EngineResponse = {
	status?: string,
	data?: unknown,
	errors?: Array<{ code?: string, message?: string }>,
};

export type OrderInput = {
	field: OrderFieldValue,
	direction: OrderDirectionValue,
};

export type Pagination = {
	hasMore: boolean,
};

export type RejectedItem = {
	objectId: number,
	reason: string,
};

// Client results returned by the four adapter functions.
export type InitialStageResult = {
	stage: PickerFeed,
	items: PickerItem[],
	sources: PickerSource[],
	pagination: Pagination,
	context: NavigationContext,
	emptyReason: EmptyReasonValue,
};

export type ListChildrenResult = {
	items: PickerItem[],
	pagination: Pagination,
	context: NavigationContext,
	emptyReason: EmptyReasonValue,
};

export type SearchResult = {
	items: PickerItem[],
	pagination: Pagination,
	emptyReason: EmptyReasonValue,
};

export type ResolvedPickerItem = PickerItem & {
	parentFolderName: string,
	editorFileType: string | null,
};

export type ResolveSelectionResult = {
	items: ResolvedPickerItem[],
	rejectedItems: RejectedItem[],
	partial: boolean,
};

// Adapter request inputs.
export type InitialStageRequest = {
	initialStage: {
		type: StageTypeValue,
		storageId: number | null,
		folderId: number | null,
	} | null,
	filters: SessionFilters,
	allowedFileTypes: string[],
	pageSize: number,
	signedConfig: Object | null,
};

export type ListChildrenRequest = {
	storageId: number,
	folderId: number,
	filters: SessionFilters,
	allowedFileTypes: string[],
	order: OrderInput,
	page: number,
	pageSize: number,
	signedConfig: Object | null,
};

export type SearchRequest = {
	query: string,
	storageId: number | null,
	filters: SessionFilters,
	allowedFileTypes: string[],
	page: number,
	pageSize: number,
	signedConfig: Object | null,
};

export type ResolveSelectionRequest = {
	objectIds: number[],
	selectionMode: SelectionModeValue,
	allowedFileTypes: string[],
	signedConfig: Object | null,
};
