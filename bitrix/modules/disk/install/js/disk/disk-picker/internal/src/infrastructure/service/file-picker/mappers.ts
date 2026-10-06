import { Type } from 'main.core';

import { FILE_TYPE_ALIASES, STAGE_TYPES, STORAGE_TYPES } from '../../../const/picker';
import { type EmptyReasonValue, type FileTypeFilterValue, type StageTypeValue } from '../../../const/types';
import { resolveIconType } from '../../../lib/icon-type/icon-type';
import { type PickerItem } from '../../../model/item/types';
import {
	type CurrentFolder,
	type DisplayBreadcrumb,
	type NavigationContext,
	type PickerFeed,
} from '../../../model/session/types';
import { type PickerSource } from '../../../model/source/types';

import {
	ContractViolationError,
	type InitialStageResult,
	type ListChildrenResult,
	type Pagination,
	type RejectedItem,
	type ResolvedPickerItem,
	type ResolveSelectionResult,
	type SearchResult,
} from './types';

export { ContractViolationError } from './types';

const ITEM_KEYS = Object.freeze([
	'objectId', 'type', 'name', 'extension', 'size', 'updateTime', 'createTime',
	'recentTime', 'selectable', 'fileType', 'source', 'preview',
]);
const SELECTION_ITEM_KEYS = Object.freeze([...ITEM_KEYS, 'parentFolderName', 'editorFileType']);
const SOURCE_KEYS = Object.freeze(['storageId', 'storageType', 'title', 'entityId']);
const SOURCE_DESCRIPTOR_KEYS = Object.freeze([
	'storageId',
	'folderId',
	'title',
	'storageType',
	'entityId',
	'avatarUrl',
]);
const PREVIEW_KEYS = Object.freeze(['type', 'url']);
const PAGINATION_KEYS = Object.freeze(['hasMore', 'total']);
const CONTEXT_KEYS = Object.freeze(['storageId', 'folderId', 'currentFolder', 'breadcrumbs']);
const CURRENT_FOLDER_KEYS = Object.freeze(['folderId', 'name']);
const BREADCRUMB_KEYS = Object.freeze(['objectId', 'name']);
const STAGE_KEYS = Object.freeze(['type', 'storageId', 'folderId']);
const REJECTED_KEYS = Object.freeze(['objectId', 'reason']);
const REJECT_REASONS = Object.freeze(['not_found', 'not_selectable']);

const INITIAL_STAGE_RESPONSE_KEYS = Object.freeze(['stage', 'items', 'sources', 'pagination', 'context', 'emptyReason']);
const LIST_CHILDREN_RESPONSE_KEYS = Object.freeze(['items', 'pagination', 'context', 'emptyReason']);
const SEARCH_RESPONSE_KEYS = Object.freeze(['items', 'pagination', 'emptyReason']);
const RESOLVE_RESPONSE_KEYS = Object.freeze(['items', 'rejectedItems', 'partial']);

type RawObject = { [key: string]: unknown };

class Schema
{
	constructor(private readonly method: string)
	{}

	fail(path: string): never
	{
		throw new ContractViolationError(this.method, path);
	}

	object(value: unknown, path: string, allowedKeys: readonly string[]): RawObject
	{
		if (!Type.isPlainObject(value))
		{
			this.fail(path);
		}

		const raw = value as RawObject;
		Object.keys(raw).forEach((key) => {
			if (!allowedKeys.includes(key))
			{
				this.fail(`${path}.${key}`);
			}
		});
		allowedKeys.forEach((key) => {
			if (!Object.prototype.hasOwnProperty.call(raw, key))
			{
				this.fail(`${path}.${key}`);
			}
		});

		return raw;
	}

	array(value: unknown, path: string): unknown[]
	{
		if (!Type.isArray(value))
		{
			this.fail(path);
		}

		return value as unknown[];
	}

	positiveInt(value: unknown, path: string): number
	{
		if (Type.isNumber(value) && Number.isInteger(value) && value > 0)
		{
			return value;
		}

		return this.fail(path);
	}

	nonNegativeInt(value: unknown, path: string): number
	{
		if (Type.isNumber(value) && Number.isInteger(value) && value >= 0)
		{
			return value;
		}

		return this.fail(path);
	}

	boolean(value: unknown, path: string): boolean
	{
		if (Type.isBoolean(value))
		{
			return value;
		}

		return this.fail(path);
	}

	nonEmptyString(value: unknown, path: string): string
	{
		if (Type.isString(value) && value.trim() !== '')
		{
			return value;
		}

		return this.fail(path);
	}

	stringOrNull(value: unknown, path: string): string | null
	{
		if (value === null)
		{
			return null;
		}

		if (Type.isString(value))
		{
			return value;
		}

		return this.fail(path);
	}

	nonEmptyStringOrNull(value: unknown, path: string): string | null
	{
		if (value === null)
		{
			return null;
		}

		return this.nonEmptyString(value, path);
	}

	enumValue(value: unknown, allowed: readonly string[], path: string): string
	{
		if (Type.isString(value) && allowed.includes(value))
		{
			return value;
		}

		return this.fail(path);
	}

	// entityId is int | string | null; bool/float/array/object are not coerced.
	entityId(value: unknown, path: string): number | string | null
	{
		if (value === null || Type.isString(value))
		{
			return value;
		}

		if (Type.isNumber(value) && Number.isInteger(value))
		{
			return value;
		}

		return this.fail(path);
	}

	// ISO-8601 string converted to a Unix timestamp in SECONDS; null stays null.
	isoToSeconds(value: unknown, path: string): number | null
	{
		if (value === null)
		{
			return null;
		}

		if (!Type.isStringFilled(value))
		{
			return this.fail(path);
		}

		const milliseconds = Date.parse(value);
		if (Number.isNaN(milliseconds))
		{
			return this.fail(path);
		}

		return Math.floor(milliseconds / 1000);
	}
}

function mapSource(schema: Schema, raw: unknown, path: string): { storageId: number, title: string }
{
	const source = schema.object(raw, path, SOURCE_KEYS);
	const storageId = schema.positiveInt(source.storageId, `${path}.storageId`);
	schema.enumValue(source.storageType, STORAGE_TYPES, `${path}.storageType`);
	const title = schema.nonEmptyString(source.title, `${path}.title`);
	schema.entityId(source.entityId, `${path}.entityId`);

	return { storageId, title };
}

function mapPreviewUrl(schema: Schema, raw: unknown, isFolder: boolean, path: string): string | null
{
	if (isFolder)
	{
		if (raw !== null)
		{
			schema.fail(path);
		}

		return null;
	}

	const preview = schema.object(raw, path, PREVIEW_KEYS);
	if (preview.type === 'image')
	{
		return schema.nonEmptyString(preview.url, `${path}.url`);
	}

	if (preview.type === 'none')
	{
		if (preview.url !== null)
		{
			schema.fail(`${path}.url`);
		}

		return null;
	}

	return schema.fail(`${path}.type`);
}

function mapItem(
	schema: Schema,
	raw: unknown,
	path: string,
	allowedKeys: readonly string[] = ITEM_KEYS,
): PickerItem
{
	const item = schema.object(raw, path, allowedKeys);

	if (item.type !== 'file' && item.type !== 'folder')
	{
		schema.fail(`${path}.type`);
	}
	const isFolder = item.type === 'folder';

	const objectId = schema.positiveInt(item.objectId, `${path}.objectId`);
	const name = schema.nonEmptyString(item.name, `${path}.name`);
	const extension = schema.stringOrNull(item.extension, `${path}.extension`);

	let size: number | null = null;
	if (isFolder)
	{
		if (item.size !== null)
		{
			schema.fail(`${path}.size`);
		}
	}
	else
	{
		size = schema.nonNegativeInt(item.size, `${path}.size`);
	}

	const updateTime = schema.isoToSeconds(item.updateTime, `${path}.updateTime`);
	const createTime = schema.isoToSeconds(item.createTime, `${path}.createTime`);
	const recentTime = schema.isoToSeconds(item.recentTime, `${path}.recentTime`);

	const selectable = schema.boolean(item.selectable, `${path}.selectable`);
	if (isFolder && selectable !== false)
	{
		schema.fail(`${path}.selectable`);
	}

	let fileType: FileTypeFilterValue | null = null;
	if (isFolder)
	{
		if (item.fileType !== null)
		{
			schema.fail(`${path}.fileType`);
		}
	}
	else
	{
		fileType = schema.enumValue(item.fileType, FILE_TYPE_ALIASES, `${path}.fileType`) as FileTypeFilterValue;
	}

	const source = mapSource(schema, item.source, `${path}.source`);
	const previewUrl = mapPreviewUrl(schema, item.preview, isFolder, `${path}.preview`);

	return {
		objectId,
		isFolder,
		name,
		extension,
		size,
		updateTime,
		createTime,
		recentTime,
		selectable,
		fileType,
		iconType: resolveIconType({ isFolder, extension, fileType }),
		previewUrl,
		sourceTitle: source.title,
		sourceId: source.storageId,
	};
}

function mapSelectionItem(schema: Schema, raw: unknown, path: string): ResolvedPickerItem
{
	const item = mapItem(schema, raw, path, SELECTION_ITEM_KEYS);
	if (item.isFolder)
	{
		schema.fail(`${path}.type`);
	}

	const source = raw as RawObject;

	return {
		...item,
		parentFolderName: schema.nonEmptyString(source.parentFolderName, `${path}.parentFolderName`),
		editorFileType: schema.nonEmptyStringOrNull(source.editorFileType, `${path}.editorFileType`),
	};
}

function mapItems(schema: Schema, raw: unknown, path: string): PickerItem[]
{
	const entries = schema.array(raw, path);
	const seenObjectIds = new Set<number>();

	return entries.map((entry, index) => {
		const item = mapItem(schema, entry, `${path}[${index}]`);
		if (seenObjectIds.has(item.objectId))
		{
			schema.fail(`${path}[${index}].objectId`);
		}
		seenObjectIds.add(item.objectId);

		return item;
	});
}

function mapSelectionItems(schema: Schema, raw: unknown, path: string): ResolvedPickerItem[]
{
	const entries = schema.array(raw, path);
	const seenObjectIds = new Set<number>();

	return entries.map((entry, index) => {
		const item = mapSelectionItem(schema, entry, `${path}[${index}]`);
		if (seenObjectIds.has(item.objectId))
		{
			schema.fail(`${path}[${index}].objectId`);
		}
		seenObjectIds.add(item.objectId);

		return item;
	});
}

function mapSourceDescriptor(schema: Schema, raw: unknown, path: string): PickerSource
{
	const source = schema.object(raw, path, SOURCE_DESCRIPTOR_KEYS);
	const storageId = schema.positiveInt(source.storageId, `${path}.storageId`);
	const folderId = schema.positiveInt(source.folderId, `${path}.folderId`);
	const title = schema.nonEmptyString(source.title, `${path}.title`);
	const storageType = schema.enumValue(source.storageType, STORAGE_TYPES, `${path}.storageType`);
	const entityId = schema.entityId(source.entityId, `${path}.entityId`);
	const avatarUrl = schema.nonEmptyStringOrNull(source.avatarUrl, `${path}.avatarUrl`);

	return {
		storageId,
		folderId,
		title,
		storageType: storageType as PickerSource['storageType'],
		entityId,
		avatarUrl,
	};
}

function mapSources(schema: Schema, raw: unknown, path: string): PickerSource[]
{
	const entries = schema.array(raw, path);
	const seenStorageIds = new Set<number>();

	return entries.map((entry, index) => {
		const source = mapSourceDescriptor(schema, entry, `${path}[${index}]`);
		if (seenStorageIds.has(source.storageId))
		{
			schema.fail(`${path}[${index}].storageId`);
		}
		seenStorageIds.add(source.storageId);

		return source;
	});
}

function mapCurrentFolder(schema: Schema, raw: unknown, path: string): CurrentFolder | null
{
	if (raw === null)
	{
		return null;
	}

	const currentFolder = schema.object(raw, path, CURRENT_FOLDER_KEYS);

	return {
		folderId: schema.positiveInt(currentFolder.folderId, `${path}.folderId`),
		name: schema.nonEmptyString(currentFolder.name, `${path}.name`),
	};
}

function mapBreadcrumbs(schema: Schema, raw: unknown, path: string): DisplayBreadcrumb[]
{
	const entries = schema.array(raw, path);

	// Breadcrumbs are the canonical server chain: no dedup, no reorder, no
	// ancestry or currentFolder comparison - only structural validation.
	return entries.map((entry, index) => {
		const crumb = schema.object(entry, `${path}[${index}]`, BREADCRUMB_KEYS);

		return {
			objectId: schema.positiveInt(crumb.objectId, `${path}[${index}].objectId`),
			name: schema.nonEmptyString(crumb.name, `${path}[${index}].name`),
		};
	});
}

function mapContext(schema: Schema, raw: unknown, path: string): NavigationContext
{
	const context = schema.object(raw, path, CONTEXT_KEYS);
	const currentFolder = mapCurrentFolder(schema, context.currentFolder, `${path}.currentFolder`);
	const breadcrumbs = mapBreadcrumbs(schema, context.breadcrumbs, `${path}.breadcrumbs`);

	if (currentFolder === null)
	{
		// recent / sources context: everything empty.
		if (context.storageId !== null)
		{
			schema.fail(`${path}.storageId`);
		}

		if (context.folderId !== null)
		{
			schema.fail(`${path}.folderId`);
		}

		if (breadcrumbs.length > 0)
		{
			schema.fail(`${path}.breadcrumbs`);
		}

		return { storageId: null, folderId: null, currentFolder: null, breadcrumbs: [] };
	}

	return {
		storageId: schema.positiveInt(context.storageId, `${path}.storageId`),
		folderId: schema.positiveInt(context.folderId, `${path}.folderId`),
		currentFolder,
		breadcrumbs,
	};
}

function mapPagination(schema: Schema, raw: unknown, path: string): Pagination
{
	const pagination = schema.object(raw, path, PAGINATION_KEYS);
	const hasMore = schema.boolean(pagination.hasMore, `${path}.hasMore`);
	if (pagination.total !== null)
	{
		schema.nonNegativeInt(pagination.total, `${path}.total`);
	}

	return { hasMore };
}

function mapEmptyReason(schema: Schema, raw: unknown, path: string): EmptyReasonValue
{
	if (raw === null)
	{
		return null;
	}

	if (raw === 'empty')
	{
		return 'empty';
	}

	return schema.fail(path);
}

function mapStage(schema: Schema, raw: unknown, path: string): PickerFeed
{
	const stage = schema.object(raw, path, STAGE_KEYS);
	const stageType = schema.enumValue(stage.type, STAGE_TYPES, `${path}.type`) as StageTypeValue;

	if (stageType === 'folder')
	{
		return {
			stageType,
			storageId: schema.positiveInt(stage.storageId, `${path}.storageId`),
			folderId: schema.positiveInt(stage.folderId, `${path}.folderId`),
		};
	}

	if (stage.storageId !== null)
	{
		schema.fail(`${path}.storageId`);
	}

	if (stage.folderId !== null)
	{
		schema.fail(`${path}.folderId`);
	}

	return { stageType, storageId: null, folderId: null };
}

function mapRejectedItems(schema: Schema, raw: unknown, path: string): RejectedItem[]
{
	const entries = schema.array(raw, path);

	return entries.map((entry, index) => {
		const rejected = schema.object(entry, `${path}[${index}]`, REJECTED_KEYS);

		return {
			objectId: schema.positiveInt(rejected.objectId, `${path}[${index}].objectId`),
			reason: schema.enumValue(rejected.reason, REJECT_REASONS, `${path}[${index}].reason`),
		};
	});
}

export function mapInitialStage(data: unknown): InitialStageResult
{
	const schema = new Schema('getInitialStage');
	const response = schema.object(data, 'data', INITIAL_STAGE_RESPONSE_KEYS);

	return {
		stage: mapStage(schema, response.stage, 'data.stage'),
		items: mapItems(schema, response.items, 'data.items'),
		sources: mapSources(schema, response.sources, 'data.sources'),
		pagination: mapPagination(schema, response.pagination, 'data.pagination'),
		context: mapContext(schema, response.context, 'data.context'),
		emptyReason: mapEmptyReason(schema, response.emptyReason, 'data.emptyReason'),
	};
}

export function mapListChildren(data: unknown): ListChildrenResult
{
	const schema = new Schema('listChildren');
	const response = schema.object(data, 'data', LIST_CHILDREN_RESPONSE_KEYS);

	return {
		items: mapItems(schema, response.items, 'data.items'),
		pagination: mapPagination(schema, response.pagination, 'data.pagination'),
		context: mapContext(schema, response.context, 'data.context'),
		emptyReason: mapEmptyReason(schema, response.emptyReason, 'data.emptyReason'),
	};
}

export function mapSearch(data: unknown): SearchResult
{
	const schema = new Schema('search');
	const response = schema.object(data, 'data', SEARCH_RESPONSE_KEYS);

	return {
		items: mapItems(schema, response.items, 'data.items'),
		pagination: mapPagination(schema, response.pagination, 'data.pagination'),
		emptyReason: mapEmptyReason(schema, response.emptyReason, 'data.emptyReason'),
	};
}

export function mapResolveSelection(data: unknown): ResolveSelectionResult
{
	const schema = new Schema('resolveSelection');
	const response = schema.object(data, 'data', RESOLVE_RESPONSE_KEYS);

	const items = mapSelectionItems(schema, response.items, 'data.items');
	const rejectedItems = mapRejectedItems(schema, response.rejectedItems, 'data.rejectedItems');
	const partial = schema.boolean(response.partial, 'data.partial');
	if (partial !== (rejectedItems.length > 0))
	{
		schema.fail('data.partial');
	}

	return { items, rejectedItems, partial };
}
