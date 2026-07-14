import { Loc } from 'main.core';
import type {
	CheckConnectionRequest,
	GetCollectionsRequest,
	GetDocumentTreeRequest,
	StartRequest,
	GetStatusRequest,
	CancelRequest,
	ImportCollection,
	ImportDocumentTreeNode,
	ConnectionFormState,
	CollectionsScreenState,
	OverwriteScreenState,
	ProgressScreenState,
} from './type';

export const SOURCE_TYPE_OUTLINE = 'outline';
export const SOURCE_TYPE_WIKI = 'wiki';
export const IMPORT_POLL_INTERVAL_MS = 5000;

export const SOURCE_TYPES = Object.freeze([
	Object.freeze({
		id: SOURCE_TYPE_OUTLINE,
		label: Loc.getMessage('NOTE_IMPORT_SOURCE_OUTLINE'),
		enabled: true,
	}),
	Object.freeze({
		id: SOURCE_TYPE_WIKI,
		label: Loc.getMessage('NOTE_IMPORT_SOURCE_WIKI'),
		enabled: true,
	}),
]);

export const IMPORT_SCREEN = Object.freeze({
	LOADING: 'loading',
	CONNECTION: 'connection',
	COLLECTIONS: 'collections',
	OVERWRITE_CONFIRM: 'overwriteConfirm',
	PROGRESS: 'progress',
});

export const IMPORT_PROGRESS_STATUS = Object.freeze({
	IN_PROGRESS: 'in_progress',
	DONE: 'done',
	ERROR: 'error',
	CANCELLED: 'cancelled',
});

export function createDefaultImportCollection(): ImportCollection
{
	return {
		id: '',
		name: '',
	};
}

export function createDefaultImportTreeNode(): ImportDocumentTreeNode
{
	return {
		id: '',
		title: '',
		parentId: null,
		children: [],
	};
}

export function createDefaultConnectionFormState(): ConnectionFormState
{
	return {
		sourceType: SOURCE_TYPE_OUTLINE,
		url: '',
		token: '',
		errorMessage: '',
		isSubmitting: false,
		touched: {
			sourceType: false,
			url: false,
			token: false,
		},
		errors: {
			sourceType: '',
			url: '',
			token: '',
		},
	};
}

export function createDefaultCollectionsScreenState(): CollectionsScreenState
{
	return {
		isLoading: false,
		errorMessage: '',
		collections: [],
		selectedCollectionIds: new Set(),
		expandedCollectionIds: new Set(),
		treeByCollectionId: new Map(),
	};
}

export function createDefaultOverwriteState(): OverwriteScreenState
{
	return {
		collections: [],
		expandedCollectionIds: new Set(),
		treeByCollectionId: new Map(),
	};
}

export function createDefaultProgressScreenState(): ProgressScreenState
{
	return {
		isImporting: false,
		isCancelling: false,
		errorMessage: '',
		progress: null,
	};
}

export function resolveProgressScreenStatus(state: ProgressScreenState): string
{
	if (state.errorMessage)
	{
		return 'error';
	}

	const progress = state.progress;
	if (!progress)
	{
		return 'preparing';
	}

	if (progress.status === IMPORT_PROGRESS_STATUS.CANCELLED)
	{
		return 'cancelled';
	}

	if (progress.status === IMPORT_PROGRESS_STATUS.ERROR)
	{
		return 'error';
	}

	if (progress.status === IMPORT_PROGRESS_STATUS.DONE)
	{
		return (progress.error ?? 0) > 0 ? 'done_error' : 'done_ok';
	}

	if (progress.step === 'downloadAttachments' || progress.step === 'retryAttachments')
	{
		return 'attachments';
	}

	if (progress.step === 'createStructure' || progress.step === 'fillContent')
	{
		return 'documents';
	}

	return 'preparing';
}

export function buildCheckConnectionPayload(sourceType: string, url: string, token: string): CheckConnectionRequest
{
	return {
		sourceType,
		url,
		token,
	};
}

export function buildGetCollectionsPayload(
	sourceType: string,
	url: string,
	token: string,
): GetCollectionsRequest
{
	return { sourceType, url, token };
}

export function buildGetDocumentTreePayload(
	sourceType: string,
	url: string,
	token: string,
	collectionId: string,
): GetDocumentTreeRequest
{
	return { sourceType, url, token, collectionId };
}

export function buildCheckOverlapPayload(sourceType: string, collectionIds: string[]): Object
{
	return { sourceType, collectionIds };
}

export function buildStartPayload(
	sourceType: string,
	url: string,
	token: string,
	collectionIds: string[],
	overwrite: boolean = false,
): StartRequest
{
	return { sourceType, url, token, collectionIds, overwrite };
}

export function buildGetStatusPayload(sessionId: number): GetStatusRequest
{
	return { sessionId };
}

export function buildCancelPayload(sessionId: number): CancelRequest
{
	return { sessionId };
}

export function buildAcknowledgeFinishPayload(sessionId: number): { sessionId: number }
{
	return { sessionId };
}
