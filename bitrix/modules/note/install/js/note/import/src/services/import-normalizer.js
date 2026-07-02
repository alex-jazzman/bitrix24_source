import { Type } from 'main.core';
import {
	createDefaultImportCollection,
	createDefaultImportTreeNode,
	IMPORT_PROGRESS_STATUS,
} from '../constants';
import type {
	ImportCollection,
	ImportDocumentTreeNode,
	ImportProgress,
	CheckConnectionResponse,
	GetCollectionsResponse,
	GetDocumentTreeResponse,
	StartResponse,
	GetStatusResponse,
} from '../type';

const ALLOWED_PROGRESS_STATUS = new Set(Object.values(IMPORT_PROGRESS_STATUS));

export function normalizeCheckConnectionResponse(rawResponse: mixed): CheckConnectionResponse
{
	if (!Type.isPlainObject(rawResponse))
	{
		throw new TypeError('Invalid checkConnection response');
	}

	return {
		instanceName: String(rawResponse.instanceName ?? ''),
	};
}

export function normalizeGetCollectionsResponse(rawResponse: mixed): GetCollectionsResponse
{
	if (!Type.isPlainObject(rawResponse) || !Array.isArray(rawResponse.collections))
	{
		throw new TypeError('Invalid getCollections response');
	}

	return {
		collections: rawResponse.collections.map((collection) => normalizeImportCollection(collection)),
	};
}

export function normalizeGetDocumentTreeResponse(rawResponse: mixed): GetDocumentTreeResponse
{
	if (!Type.isPlainObject(rawResponse) || !Array.isArray(rawResponse.documents))
	{
		throw new TypeError('Invalid getDocumentTree response');
	}

	return {
		documents: rawResponse.documents.map((document) => normalizeImportDocumentTreeNode(document)),
	};
}

export function normalizeStartResponse(rawResponse: mixed): StartResponse
{
	if (!Type.isPlainObject(rawResponse))
	{
		throw new TypeError('Invalid start response');
	}

	const sessionId = toPositiveInt(rawResponse.sessionId);
	if (sessionId === null)
	{
		throw new TypeError('Invalid start sessionId');
	}

	return {
		sessionId,
		progress: normalizeImportProgress(rawResponse.progress),
	};
}

export function normalizeGetStatusResponse(rawResponse: mixed): GetStatusResponse
{
	if (!Type.isPlainObject(rawResponse))
	{
		throw new TypeError('Invalid getStatus response');
	}

	return {
		progress: normalizeImportProgress(rawResponse.progress),
	};
}

export function normalizeImportCollection(rawCollection: mixed): ImportCollection
{
	const defaultCollection = createDefaultImportCollection();
	if (!Type.isPlainObject(rawCollection))
	{
		return defaultCollection;
	}

	return {
		id: String(rawCollection.id ?? defaultCollection.id),
		name: String(rawCollection.name ?? defaultCollection.name),
	};
}

export function normalizeImportDocumentTreeNode(rawNode: mixed): ImportDocumentTreeNode
{
	const defaultNode = createDefaultImportTreeNode();
	if (!Type.isPlainObject(rawNode))
	{
		return defaultNode;
	}

	return {
		id: String(rawNode.id ?? defaultNode.id),
		title: String(rawNode.title ?? defaultNode.title),
		parentId: toNullableString(rawNode.parentId),
		children: Array.isArray(rawNode.children)
			? rawNode.children.map((child) => normalizeImportDocumentTreeNode(child))
			: defaultNode.children,
	};
}

export function normalizeImportProgress(rawProgress: mixed): ImportProgress
{
	if (!Type.isPlainObject(rawProgress))
	{
		throw new TypeError('Invalid import progress');
	}

	const rawStatus = String(rawProgress.status ?? IMPORT_PROGRESS_STATUS.IN_PROGRESS);
	const status = ALLOWED_PROGRESS_STATUS.has(rawStatus) ? rawStatus : IMPORT_PROGRESS_STATUS.IN_PROGRESS;

	return {
		status,
		step: String(rawProgress.step ?? ''),
		total: toNonNegativeInt(rawProgress.total) ?? 0,
		done: toNonNegativeInt(rawProgress.done) ?? 0,
		error: toNonNegativeInt(rawProgress.error) ?? 0,
		totalAttachments: toNonNegativeInt(rawProgress.totalAttachments) ?? 0,
		doneAttachments: toNonNegativeInt(rawProgress.doneAttachments) ?? 0,
		collectionName: String(rawProgress.collectionName ?? ''),
		collectionIndex: toNonNegativeInt(rawProgress.collectionIndex) ?? 0,
		collectionCount: toNonNegativeInt(rawProgress.collectionCount) ?? 0,
		errorDetails: normalizeErrorDetails(rawProgress.errorDetails),
	};
}

function normalizeErrorDetails(raw: mixed): Array<{ title: string, reason: string }>
{
	if (!Array.isArray(raw))
	{
		return [];
	}

	return raw
		.filter((item) => Type.isPlainObject(item))
		.map((item) => ({
			title: String(item.title ?? ''),
			reason: String(item.reason ?? ''),
		}));
}

function toPositiveInt(value: mixed): number | null
{
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed <= 0)
	{
		return null;
	}

	return parsed;
}

function toNonNegativeInt(value: mixed): number | null
{
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed < 0)
	{
		return null;
	}

	return parsed;
}

function toNullableString(value: mixed): string | null
{
	if (value === null || value === undefined || value === '')
	{
		return null;
	}

	return String(value);
}
