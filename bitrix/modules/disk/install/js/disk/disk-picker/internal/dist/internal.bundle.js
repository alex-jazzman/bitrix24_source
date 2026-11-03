/* eslint-disable */
this.BX = this.BX || {};
this.BX.Disk = this.BX.Disk || {};
(function (exports, main_date, ui_designTokens, ui_designTokens_air, ui_iconSet_outline, ui_iconSet_solid, main_core, ui_vue3, ui_vue3_pinia, ui_iconSet_api_disk, main_core_events, ui_system_skeleton_vue, main_polyfill_intersectionobserver, ui_iconSet_api_vue, ui_vue3_components_avatar, ui_system_typography_vue, ui_vue3_components_button, ui_system_skeleton, ui_a11y, ui_cnt) {
	'use strict';

	const StageType = Object.freeze({
		Recent: 'recent',
		Folder: 'folder',
		Sources: 'sources'
	});
	const ObjectTypeFilter = Object.freeze({
		All: 'all',
		Files: 'files',
		Folders: 'folders'
	});
	const FileTypeFilter = Object.freeze({
		Document: 'document',
		Spreadsheet: 'spreadsheet',
		Presentation: 'presentation',
		Board: 'board',
		Image: 'image',
		Audio: 'audio',
		Video: 'video',
		Other: 'other'
	});
	const StorageType = Object.freeze({
		User: 'user',
		Common: 'common',
		Group: 'group',
		Project: 'project',
		Collab: 'collab',
		Im: 'im'
	});
	const OrderField = Object.freeze({
		Name: 'name',
		CreateTime: 'createTime',
		UpdateTime: 'updateTime'
	});
	const OrderDirection = Object.freeze({
		Asc: 'asc',
		Desc: 'desc'
	});
	const DEFAULT_ORDER = Object.freeze({
		field: OrderField.Name,
		direction: OrderDirection.Asc
	});
	const FilePickerAction = Object.freeze({
		GetInitialStage: 'disk.api.FilePicker.getInitialStage',
		ListChildren: 'disk.api.FilePicker.listChildren',
		Search: 'disk.api.FilePicker.search',
		ResolveSelection: 'disk.api.FilePicker.resolveSelection',
		GetViewerAttributes: 'disk.api.FilePicker.getViewerAttributes'
	});
	const PageSize = Object.freeze({
		Default: 50,
		Max: 100,
		Recent: 100
	});
	const SearchQueryLength = Object.freeze({
		Min: 3,
		Max: 255
	});
	const ViewMode = Object.freeze({
		List: 'list',
		Table: 'table'
	});
	const SEARCH_DEBOUNCE_MS = 300;
	const SelectionMode = Object.freeze({
		Single: 'single',
		Multiple: 'multiple'
	});
	const ErrorCode = Object.freeze({
		InvalidContext: 'invalid_context',
		InvalidFilter: 'invalid_filter',
		InvalidOrder: 'invalid_order',
		InvalidQuery: 'invalid_query',
		NotFound: 'not_found',
		TotalUnavailable: 'total_unavailable',
		TooManyItems: 'too_many_items',
		NotSelectable: 'not_selectable'
	});
	const STAGE_TYPES = Object.freeze(Object.values(StageType));
	const OBJECT_TYPE_FILTERS = Object.freeze(Object.values(ObjectTypeFilter));
	const FILE_TYPE_ALIASES = Object.freeze(Object.values(FileTypeFilter));
	const STORAGE_TYPES = Object.freeze(Object.values(StorageType));

	const CATEGORY_FALLBACK = Object.freeze({
		[FileTypeFilter.Image]: ui_iconSet_api_disk.DiskIconType.jpg,
		[FileTypeFilter.Video]: ui_iconSet_api_disk.DiskIconType.video,
		[FileTypeFilter.Board]: ui_iconSet_api_disk.DiskIconType.board,
		[FileTypeFilter.Document]: ui_iconSet_api_disk.DiskIconType.doc,
		[FileTypeFilter.Spreadsheet]: ui_iconSet_api_disk.DiskIconType.xls,
		[FileTypeFilter.Presentation]: ui_iconSet_api_disk.DiskIconType.ppt
	});
	function resolveIconType(input) {
		if (input.isFolder) {
			return ui_iconSet_api_disk.DiskIconType.folder;
		}
		const iconTypes = ui_iconSet_api_disk.DiskIconType;
		const extension = main_core.Type.isString(input.extension) ? input.extension.toLowerCase() : '';
		if (extension !== '' && Object.prototype.hasOwnProperty.call(iconTypes, extension)) {
			return iconTypes[extension];
		}
		const byCategory = input.fileType === null ? undefined : CATEGORY_FALLBACK[input.fileType];
		return byCategory ?? ui_iconSet_api_disk.DiskIconType.file;
	}

	class ContractViolationError extends Error {
		method;
		path;
		code = 'contract_violation';
		constructor(method, path) {
			super(`DiskPicker contract violation at ${method}: ${path}`);
			this.method = method;
			this.path = path;
			this.name = 'ContractViolationError';
		}
	}

	const ITEM_KEYS = Object.freeze(['objectId', 'type', 'name', 'extension', 'size', 'updateTime', 'createTime', 'recentTime', 'selectable', 'fileType', 'source', 'preview', 'previewable']);
	const SELECTION_ITEM_KEYS = Object.freeze([...ITEM_KEYS, 'parentFolderName', 'editorFileType']);
	const SOURCE_KEYS = Object.freeze(['storageId', 'storageType', 'title', 'entityId']);
	const SOURCE_DESCRIPTOR_KEYS = Object.freeze(['storageId', 'folderId', 'title', 'storageType', 'entityId', 'avatarUrl']);
	const PREVIEW_KEYS = Object.freeze(['type', 'url']);
	const PAGINATION_KEYS = Object.freeze(['hasMore', 'total']);
	const CONTEXT_KEYS = Object.freeze(['storageId', 'folderId', 'currentFolder', 'breadcrumbs']);
	const CURRENT_FOLDER_KEYS = Object.freeze(['folderId', 'name']);
	const BREADCRUMB_KEYS = Object.freeze(['objectId', 'name']);
	const STAGE_KEYS = Object.freeze(['type', 'storageId', 'folderId']);
	const REJECTED_KEYS = Object.freeze(['objectId', 'reason']);
	const REJECT_REASONS = Object.freeze(['not_found', 'not_selectable']);
	const INITIAL_STAGE_RESPONSE_KEYS = Object.freeze(['stage', 'items', 'sources', 'pagination', 'context', 'emptyReason', 'sourceRevision']);
	const LIST_CHILDREN_RESPONSE_KEYS = Object.freeze(['items', 'pagination', 'context', 'emptyReason']);
	const SEARCH_RESPONSE_KEYS = Object.freeze(['items', 'pagination', 'emptyReason']);
	const RESOLVE_RESPONSE_KEYS = Object.freeze(['items', 'rejectedItems', 'partial']);
	const VIEWER_ATTRIBUTES_RESPONSE_KEYS = Object.freeze(['items']);
	const VIEWER_ATTRIBUTES_ENTRY_KEYS = Object.freeze(['objectId', 'attributes']);
	const VIEWER_ATTRIBUTE_NAME = /^data-[a-z0-9-]+$/;
	class Schema {
		method;
		constructor(method) {
			this.method = method;
		}
		fail(path) {
			throw new ContractViolationError(this.method, path);
		}
		object(value, path, allowedKeys) {
			if (!main_core.Type.isPlainObject(value)) {
				this.fail(path);
			}
			const raw = value;
			Object.keys(raw).forEach(key => {
				if (!allowedKeys.includes(key)) {
					this.fail(`${path}.${key}`);
				}
			});
			allowedKeys.forEach(key => {
				if (!Object.prototype.hasOwnProperty.call(raw, key)) {
					this.fail(`${path}.${key}`);
				}
			});
			return raw;
		}
		array(value, path) {
			if (!main_core.Type.isArray(value)) {
				this.fail(path);
			}
			return value;
		}
		positiveInt(value, path) {
			if (main_core.Type.isNumber(value) && Number.isInteger(value) && value > 0) {
				return value;
			}
			return this.fail(path);
		}
		nonNegativeInt(value, path) {
			if (main_core.Type.isNumber(value) && Number.isInteger(value) && value >= 0) {
				return value;
			}
			return this.fail(path);
		}
		boolean(value, path) {
			if (main_core.Type.isBoolean(value)) {
				return value;
			}
			return this.fail(path);
		}
		nonEmptyString(value, path) {
			if (main_core.Type.isString(value) && value.trim() !== '') {
				return value;
			}
			return this.fail(path);
		}
		stringOrNull(value, path) {
			if (value === null) {
				return null;
			}
			if (main_core.Type.isString(value)) {
				return value;
			}
			return this.fail(path);
		}
		nonEmptyStringOrNull(value, path) {
			if (value === null) {
				return null;
			}
			return this.nonEmptyString(value, path);
		}
		enumValue(value, allowed, path) {
			if (main_core.Type.isString(value) && allowed.includes(value)) {
				return value;
			}
			return this.fail(path);
		}
		entityId(value, path) {
			if (value === null || main_core.Type.isString(value)) {
				return value;
			}
			if (main_core.Type.isNumber(value) && Number.isInteger(value)) {
				return value;
			}
			return this.fail(path);
		}
		isoToSeconds(value, path) {
			if (value === null) {
				return null;
			}
			if (!main_core.Type.isStringFilled(value)) {
				return this.fail(path);
			}
			const milliseconds = Date.parse(value);
			if (Number.isNaN(milliseconds)) {
				return this.fail(path);
			}
			return Math.floor(milliseconds / 1000);
		}
	}
	function mapSource(schema, raw, path) {
		const source = schema.object(raw, path, SOURCE_KEYS);
		const storageId = schema.positiveInt(source.storageId, `${path}.storageId`);
		schema.enumValue(source.storageType, STORAGE_TYPES, `${path}.storageType`);
		const title = schema.nonEmptyString(source.title, `${path}.title`);
		schema.entityId(source.entityId, `${path}.entityId`);
		return {
			storageId,
			title
		};
	}
	function mapPreviewUrl(schema, raw, isFolder, path) {
		if (isFolder) {
			if (raw !== null) {
				schema.fail(path);
			}
			return null;
		}
		const preview = schema.object(raw, path, PREVIEW_KEYS);
		if (preview.type === 'image') {
			return schema.nonEmptyString(preview.url, `${path}.url`);
		}
		if (preview.type === 'none') {
			if (preview.url !== null) {
				schema.fail(`${path}.url`);
			}
			return null;
		}
		return schema.fail(`${path}.type`);
	}
	function mapItem(schema, raw, path, allowedKeys = ITEM_KEYS) {
		const item = schema.object(raw, path, allowedKeys);
		if (item.type !== 'file' && item.type !== 'folder') {
			schema.fail(`${path}.type`);
		}
		const isFolder = item.type === 'folder';
		const objectId = schema.positiveInt(item.objectId, `${path}.objectId`);
		const name = schema.nonEmptyString(item.name, `${path}.name`);
		const extension = schema.stringOrNull(item.extension, `${path}.extension`);
		let size = null;
		if (isFolder) {
			if (item.size !== null) {
				schema.fail(`${path}.size`);
			}
		} else {
			size = schema.nonNegativeInt(item.size, `${path}.size`);
		}
		const updateTime = schema.isoToSeconds(item.updateTime, `${path}.updateTime`);
		const createTime = schema.isoToSeconds(item.createTime, `${path}.createTime`);
		const recentTime = schema.isoToSeconds(item.recentTime, `${path}.recentTime`);
		const selectable = schema.boolean(item.selectable, `${path}.selectable`);
		if (isFolder && selectable !== false) {
			schema.fail(`${path}.selectable`);
		}
		let fileType = null;
		if (isFolder) {
			if (item.fileType !== null) {
				schema.fail(`${path}.fileType`);
			}
		} else {
			fileType = schema.enumValue(item.fileType, FILE_TYPE_ALIASES, `${path}.fileType`);
		}
		let previewable = false;
		if (isFolder) {
			if (item.previewable !== null) {
				schema.fail(`${path}.previewable`);
			}
		} else {
			previewable = schema.boolean(item.previewable, `${path}.previewable`);
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
			iconType: resolveIconType({
				isFolder,
				extension,
				fileType
			}),
			previewUrl,
			previewable,
			sourceTitle: source.title,
			sourceId: source.storageId
		};
	}
	function mapSelectionItem(schema, raw, path) {
		const item = mapItem(schema, raw, path, SELECTION_ITEM_KEYS);
		if (item.isFolder) {
			schema.fail(`${path}.type`);
		}
		const source = raw;
		return {
			...item,
			parentFolderName: schema.nonEmptyString(source.parentFolderName, `${path}.parentFolderName`),
			editorFileType: schema.nonEmptyStringOrNull(source.editorFileType, `${path}.editorFileType`)
		};
	}
	function mapItems(schema, raw, path) {
		const entries = schema.array(raw, path);
		const seenObjectIds = new Set();
		return entries.map((entry, index) => {
			const item = mapItem(schema, entry, `${path}[${index}]`);
			if (seenObjectIds.has(item.objectId)) {
				schema.fail(`${path}[${index}].objectId`);
			}
			seenObjectIds.add(item.objectId);
			return item;
		});
	}
	function mapSelectionItems(schema, raw, path) {
		const entries = schema.array(raw, path);
		const seenObjectIds = new Set();
		return entries.map((entry, index) => {
			const item = mapSelectionItem(schema, entry, `${path}[${index}]`);
			if (seenObjectIds.has(item.objectId)) {
				schema.fail(`${path}[${index}].objectId`);
			}
			seenObjectIds.add(item.objectId);
			return item;
		});
	}
	function mapSourceDescriptor(schema, raw, path) {
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
			storageType: storageType,
			entityId,
			avatarUrl
		};
	}
	function mapSources(schema, raw, path) {
		const entries = schema.array(raw, path);
		const seenStorageIds = new Set();
		return entries.map((entry, index) => {
			const source = mapSourceDescriptor(schema, entry, `${path}[${index}]`);
			if (seenStorageIds.has(source.storageId)) {
				schema.fail(`${path}[${index}].storageId`);
			}
			seenStorageIds.add(source.storageId);
			return source;
		});
	}
	function mapCurrentFolder(schema, raw, path) {
		if (raw === null) {
			return null;
		}
		const currentFolder = schema.object(raw, path, CURRENT_FOLDER_KEYS);
		return {
			folderId: schema.positiveInt(currentFolder.folderId, `${path}.folderId`),
			name: schema.nonEmptyString(currentFolder.name, `${path}.name`)
		};
	}
	function mapBreadcrumbs(schema, raw, path) {
		const entries = schema.array(raw, path);
		return entries.map((entry, index) => {
			const crumb = schema.object(entry, `${path}[${index}]`, BREADCRUMB_KEYS);
			return {
				objectId: schema.positiveInt(crumb.objectId, `${path}[${index}].objectId`),
				name: schema.nonEmptyString(crumb.name, `${path}[${index}].name`)
			};
		});
	}
	function mapContext(schema, raw, path) {
		const context = schema.object(raw, path, CONTEXT_KEYS);
		const currentFolder = mapCurrentFolder(schema, context.currentFolder, `${path}.currentFolder`);
		const breadcrumbs = mapBreadcrumbs(schema, context.breadcrumbs, `${path}.breadcrumbs`);
		if (currentFolder === null) {
			if (context.storageId !== null) {
				schema.fail(`${path}.storageId`);
			}
			if (context.folderId !== null) {
				schema.fail(`${path}.folderId`);
			}
			if (breadcrumbs.length > 0) {
				schema.fail(`${path}.breadcrumbs`);
			}
			return {
				storageId: null,
				folderId: null,
				currentFolder: null,
				breadcrumbs: []
			};
		}
		return {
			storageId: schema.positiveInt(context.storageId, `${path}.storageId`),
			folderId: schema.positiveInt(context.folderId, `${path}.folderId`),
			currentFolder,
			breadcrumbs
		};
	}
	function mapPagination(schema, raw, path) {
		const pagination = schema.object(raw, path, PAGINATION_KEYS);
		const hasMore = schema.boolean(pagination.hasMore, `${path}.hasMore`);
		if (pagination.total !== null) {
			schema.nonNegativeInt(pagination.total, `${path}.total`);
		}
		return {
			hasMore
		};
	}
	function mapEmptyReason(schema, raw, path) {
		if (raw === null) {
			return null;
		}
		if (raw === 'empty') {
			return 'empty';
		}
		return schema.fail(path);
	}
	function mapStage(schema, raw, path) {
		const stage = schema.object(raw, path, STAGE_KEYS);
		const stageType = schema.enumValue(stage.type, STAGE_TYPES, `${path}.type`);
		if (stageType === 'folder') {
			return {
				stageType,
				storageId: schema.positiveInt(stage.storageId, `${path}.storageId`),
				folderId: schema.positiveInt(stage.folderId, `${path}.folderId`)
			};
		}
		if (stage.storageId !== null) {
			schema.fail(`${path}.storageId`);
		}
		if (stage.folderId !== null) {
			schema.fail(`${path}.folderId`);
		}
		return {
			stageType,
			storageId: null,
			folderId: null
		};
	}
	function mapRejectedItems(schema, raw, path) {
		const entries = schema.array(raw, path);
		return entries.map((entry, index) => {
			const rejected = schema.object(entry, `${path}[${index}]`, REJECTED_KEYS);
			return {
				objectId: schema.positiveInt(rejected.objectId, `${path}[${index}].objectId`),
				reason: schema.enumValue(rejected.reason, REJECT_REASONS, `${path}[${index}].reason`)
			};
		});
	}
	function mapInitialStage(data) {
		const schema = new Schema('getInitialStage');
		const response = schema.object(data, 'data', INITIAL_STAGE_RESPONSE_KEYS);
		const stage = mapStage(schema, response.stage, 'data.stage');
		const sourceRevision = schema.stringOrNull(response.sourceRevision, 'data.sourceRevision');
		if (stage.stageType === 'sources' !== (sourceRevision !== null)) {
			schema.fail('data.sourceRevision');
		}
		return {
			stage,
			items: mapItems(schema, response.items, 'data.items'),
			sources: mapSources(schema, response.sources, 'data.sources'),
			pagination: mapPagination(schema, response.pagination, 'data.pagination'),
			context: mapContext(schema, response.context, 'data.context'),
			emptyReason: mapEmptyReason(schema, response.emptyReason, 'data.emptyReason'),
			sourceRevision
		};
	}
	function mapListChildren(data) {
		const schema = new Schema('listChildren');
		const response = schema.object(data, 'data', LIST_CHILDREN_RESPONSE_KEYS);
		return {
			items: mapItems(schema, response.items, 'data.items'),
			pagination: mapPagination(schema, response.pagination, 'data.pagination'),
			context: mapContext(schema, response.context, 'data.context'),
			emptyReason: mapEmptyReason(schema, response.emptyReason, 'data.emptyReason')
		};
	}
	function mapSearch(data) {
		const schema = new Schema('search');
		const response = schema.object(data, 'data', SEARCH_RESPONSE_KEYS);
		return {
			items: mapItems(schema, response.items, 'data.items'),
			pagination: mapPagination(schema, response.pagination, 'data.pagination'),
			emptyReason: mapEmptyReason(schema, response.emptyReason, 'data.emptyReason')
		};
	}
	function mapResolveSelection(data) {
		const schema = new Schema('resolveSelection');
		const response = schema.object(data, 'data', RESOLVE_RESPONSE_KEYS);
		const items = mapSelectionItems(schema, response.items, 'data.items');
		const rejectedItems = mapRejectedItems(schema, response.rejectedItems, 'data.rejectedItems');
		const partial = schema.boolean(response.partial, 'data.partial');
		if (partial !== rejectedItems.length > 0) {
			schema.fail('data.partial');
		}
		return {
			items,
			rejectedItems,
			partial
		};
	}
	function mapViewerAttributeMap(schema, raw, path) {
		if (!main_core.Type.isPlainObject(raw)) {
			schema.fail(path);
		}
		const source = raw;
		const attributes = {};
		Object.keys(source).forEach(key => {
			if (!VIEWER_ATTRIBUTE_NAME.test(key) || !main_core.Type.isString(source[key])) {
				schema.fail(`${path}.${key}`);
			}
			attributes[key] = source[key];
		});
		return attributes;
	}
	function mapViewerAttributesEntry(schema, raw, path) {
		const entry = schema.object(raw, path, VIEWER_ATTRIBUTES_ENTRY_KEYS);
		return {
			objectId: schema.positiveInt(entry.objectId, `${path}.objectId`),
			attributes: mapViewerAttributeMap(schema, entry.attributes, `${path}.attributes`)
		};
	}
	function mapViewerAttributes(data) {
		const schema = new Schema('getViewerAttributes');
		const response = schema.object(data, 'data', VIEWER_ATTRIBUTES_RESPONSE_KEYS);
		const entries = schema.array(response.items, 'data.items');
		const seenObjectIds = new Set();
		const items = entries.map((entry, index) => {
			const attributesEntry = mapViewerAttributesEntry(schema, entry, `data.items[${index}]`);
			if (seenObjectIds.has(attributesEntry.objectId)) {
				schema.fail(`data.items[${index}].objectId`);
			}
			seenObjectIds.add(attributesEntry.objectId);
			return attributesEntry;
		});
		return {
			items
		};
	}

	const TRANSPORT_ERROR_CODE = 'transport';
	const INVALID_QUERY_CODE = 'invalid_query';
	class PickerRequestError extends Error {
		code;
		constructor(code) {
			super(`DiskPicker request failed: ${code}`);
			this.code = code;
			this.name = 'PickerRequestError';
		}
	}
	function pickerErrorCode(error) {
		if (error instanceof PickerRequestError || error instanceof ContractViolationError) {
			return error.code;
		}
		return TRANSPORT_ERROR_CODE;
	}
	function cappedPageSize(pageSize) {
		return Math.min(pageSize, PageSize.Max);
	}
	function withSignedConfig(payload, signedConfig) {
		if (signedConfig === null) {
			return payload;
		}
		return {
			...payload,
			signedConfig
		};
	}
	function assertEngineSuccess(response) {
		if (!main_core.Type.isPlainObject(response) || response.status !== 'success' || !main_core.Type.isPlainObject(response.data)) {
			throw new PickerRequestError(TRANSPORT_ERROR_CODE);
		}
		return response.data;
	}
	function toRequestError(rejection) {
		const errors = main_core.Type.isPlainObject(rejection) ? rejection.errors : null;
		if (main_core.Type.isArray(errors) && errors.length > 0) {
			const code = errors[0]?.code;
			if (main_core.Type.isStringFilled(code)) {
				return new PickerRequestError(code);
			}
		}
		return new PickerRequestError(TRANSPORT_ERROR_CODE);
	}
	function runMapper(data, map) {
		try {
			return map(data);
		} catch (error) {
			if (error instanceof ContractViolationError) {
				console.error('DiskPicker: contract violation', {
					method: error.method,
					path: error.path
				});
			}
			throw error;
		}
	}
	async function callAction(action, payload, map) {
		const response = await main_core.ajax.runAction(action, {
			data: payload
		}).catch(rejection => {
			throw toRequestError(rejection);
		});
		return runMapper(assertEngineSuccess(response), map);
	}
	function loadInitialStage$1(request) {
		const payload = withSignedConfig({
			objectTypeFilter: request.filters.objectTypeFilter,
			fileTypeFilters: request.filters.fileTypeFilters,
			allowedFileTypes: request.allowedFileTypes,
			page: request.page,
			pageSize: cappedPageSize(request.pageSize),
			...(request.initialStage === null ? {} : {
				initialStage: request.initialStage
			})
		}, request.signedConfig);
		return callAction(FilePickerAction.GetInitialStage, payload, mapInitialStage);
	}
	function listChildren(request) {
		const payload = withSignedConfig({
			storageId: request.storageId,
			folderId: request.folderId,
			objectTypeFilter: request.filters.objectTypeFilter,
			fileTypeFilters: request.filters.fileTypeFilters,
			allowedFileTypes: request.allowedFileTypes,
			order: request.order,
			page: request.page,
			pageSize: cappedPageSize(request.pageSize)
		}, request.signedConfig);
		return callAction(FilePickerAction.ListChildren, payload, mapListChildren);
	}
	function search(request) {
		const query = request.query.trim();
		if (query === '') {
			return Promise.reject(new PickerRequestError(INVALID_QUERY_CODE));
		}
		const payload = withSignedConfig({
			query,
			storageId: request.storageId,
			objectTypeFilter: request.filters.objectTypeFilter,
			fileTypeFilters: request.filters.fileTypeFilters,
			allowedFileTypes: request.allowedFileTypes,
			page: request.page,
			pageSize: cappedPageSize(request.pageSize)
		}, request.signedConfig);
		return callAction(FilePickerAction.Search, payload, mapSearch);
	}
	function resolveSelection(request) {
		const payload = withSignedConfig({
			objectIds: request.objectIds,
			selectionMode: request.selectionMode,
			allowedFileTypes: request.allowedFileTypes
		}, request.signedConfig);
		return callAction(FilePickerAction.ResolveSelection, payload, mapResolveSelection);
	}
	function getViewerAttributes(request) {
		const payload = withSignedConfig({
			objectIds: request.objectIds.slice(0, PageSize.Max)
		}, request.signedConfig);
		return callAction(FilePickerAction.GetViewerAttributes, payload, mapViewerAttributes);
	}

	function applyLocalFilters(items, filters) {
		return items.filter(item => {
			if (filters.objectTypeFilter === ObjectTypeFilter.Files && item.isFolder) {
				return false;
			}
			if (filters.objectTypeFilter === ObjectTypeFilter.Folders && !item.isFolder) {
				return false;
			}
			if (filters.fileTypeFilters.length > 0) {
				return !item.isFolder && item.fileType !== null && filters.fileTypeFilters.includes(item.fileType);
			}
			return true;
		});
	}
	function findItemsByName(items, filters, query) {
		const normalizedQuery = query.trim().toLocaleLowerCase();
		if (normalizedQuery === '') {
			return [];
		}
		return applyLocalFilters(items, filters).filter(item => item.name.toLocaleLowerCase().includes(normalizedQuery));
	}
	function withLocalMatches(serverItems, localCandidates, filters, query) {
		const seenIds = new Set(serverItems.map(item => item.objectId));
		return [...serverItems, ...findItemsByName(localCandidates, filters, query).filter(item => {
			if (seenIds.has(item.objectId)) {
				return false;
			}
			seenIds.add(item.objectId);
			return true;
		})];
	}

	const useItemStore = ui_vue3_pinia.defineStore('diskPickerItem', {
		state: () => ({
			items: [],
			recentSnapshot: []
		}),
		getters: {
			count() {
				return this.items.length;
			},
			byId() {
				return new Map(this.items.map(item => [item.objectId, item]));
			}
		},
		actions: {
			getById(objectId) {
				return this.byId.get(objectId) ?? null;
			},
			replace(items) {
				this.items = [...items];
			},
			setRecentSnapshot(items) {
				this.recentSnapshot = [...items];
			},
			append(items) {
				const indexByObjectId = new Map(this.items.map((item, index) => [item.objectId, index]));
				const next = [...this.items];
				let added = 0;
				items.forEach(item => {
					const position = indexByObjectId.get(item.objectId);
					if (position === undefined) {
						indexByObjectId.set(item.objectId, next.length);
						next.push(item);
						added += 1;
					} else {
						next[position] = item;
					}
				});
				this.items = next;
				return added;
			},
			clear() {
				this.items = [];
				this.recentSnapshot = [];
			}
		}
	});

	const useSelectionStore = ui_vue3_pinia.defineStore('diskPickerSelection', {
		state: () => ({
			selectedIds: [],
			selectedSnapshots: {},
			activeObjectId: null
		}),
		getters: {
			count() {
				return this.selectedIds.length;
			},
			canConfirm() {
				return this.selectedIds.length > 0;
			},
			selectedIdSet() {
				return new Set(this.selectedIds);
			},
			selectedSnapshotList() {
				return this.selectedIds.map(objectId => this.selectedSnapshots[objectId]);
			}
		},
		actions: {
			has(objectId) {
				return this.selectedIds.includes(objectId);
			},
			add(objectId, snapshot) {
				if (!this.selectedIds.includes(objectId)) {
					this.selectedIds = [...this.selectedIds, objectId];
					this.selectedSnapshots = {
						...this.selectedSnapshots,
						[objectId]: snapshot
					};
				}
			},
			remove(objectId) {
				this.selectedIds = this.selectedIds.filter(id => id !== objectId);
				const selectedSnapshots = {
					...this.selectedSnapshots
				};
				delete selectedSnapshots[objectId];
				this.selectedSnapshots = selectedSnapshots;
			},
			replaceWith(objectId, snapshot) {
				this.selectedIds = [objectId];
				this.selectedSnapshots = {
					[objectId]: snapshot
				};
			},
			setActive(objectId) {
				this.activeObjectId = objectId;
			},
			captureState() {
				return {
					selectedIds: [...this.selectedIds],
					selectedSnapshots: {
						...this.selectedSnapshots
					},
					activeObjectId: this.activeObjectId
				};
			},
			restoreState(snapshot) {
				this.selectedIds = [...snapshot.selectedIds];
				this.selectedSnapshots = {
					...snapshot.selectedSnapshots
				};
				this.activeObjectId = snapshot.activeObjectId;
			},
			clear() {
				this.selectedIds = [];
				this.selectedSnapshots = {};
				this.activeObjectId = null;
			},
			pruneActive(visibleObjectIds) {
				if (this.activeObjectId !== null && !visibleObjectIds.includes(this.activeObjectId)) {
					this.activeObjectId = null;
				}
			}
		}
	});

	class RequestGuard {
		#current = 0;
		#invalidated = false;
		next() {
			this.#current += 1;
			return this.#current;
		}
		isCurrent(token) {
			return !this.#invalidated && token === this.#current;
		}
		isActive() {
			return !this.#invalidated;
		}
		invalidate() {
			this.#invalidated = true;
		}
	}

	const NOOP_CALLBACKS = {
		suppressFilterFind: () => {},
		resetFilters: () => {},
		onContextInvalid: () => {},
		notify: () => {},
		emitSelection: () => {},
		requestCancel: () => {},
		setPreviewShown: () => {}
	};
	const DEFAULT_CONSTRAINTS = Object.freeze({
		signedConfig: null,
		allowedFileTypes: [],
		initialStage: null,
		selectionMode: SelectionMode.Single,
		maxItems: 1
	});
	function buildDisplayBreadcrumbs(context) {
		const currentFolder = context?.currentFolder ?? null;
		if (context === null || currentFolder === null) {
			return [];
		}
		return [...context.breadcrumbs, {
			objectId: currentFolder.folderId,
			name: currentFolder.name
		}];
	}
	function isSameFilters(current, next) {
		return current.objectTypeFilter === next.objectTypeFilter && current.fileTypeFilters.length === next.fileTypeFilters.length && current.fileTypeFilters.every((value, index) => value === next.fileTypeFilters[index]);
	}
	const useSessionStore = ui_vue3_pinia.defineStore('diskPickerSession', {
		state: () => ({
			stageType: StageType.Recent,
			storageId: null,
			folderId: null,
			breadcrumbs: [],
			searchQuery: '',
			filterFind: '',
			searchOpen: false,
			objectTypeFilter: ObjectTypeFilter.All,
			fileTypeFilters: [],
			viewMode: ViewMode.List,
			initialized: false,
			contentLoading: false,
			preserveContentOnLoading: false,
			navigationPending: false,
			contentError: null,
			emptyReason: null,
			hasMore: false,
			page: 1,
			loadingMore: false,
			emptyStreak: 0,
			paginationStalled: false,
			confirming: false,
			confirmationEpoch: 0,
			focusHandoffToFiles: false,
			feedRevision: 0,
			constraints: DEFAULT_CONSTRAINTS,
			callbacks: ui_vue3.markRaw({
				...NOOP_CALLBACKS
			}),
			guard: ui_vue3.markRaw(new RequestGuard())
		}),
		getters: {
			feed() {
				return {
					stageType: this.stageType,
					storageId: this.storageId,
					folderId: this.folderId
				};
			},
			filters() {
				return {
					objectTypeFilter: this.objectTypeFilter,
					fileTypeFilters: this.fileTypeFilters
				};
			},
			isFolderStage() {
				return this.stageType === StageType.Folder;
			}
		},
		actions: {
			nextRequestToken() {
				return this.guard.next();
			},
			isCurrentRequest(token) {
				return this.guard.isCurrent(token);
			},
			isSessionActive() {
				return this.guard.isActive();
			},
			invalidateRequests() {
				this.guard.invalidate();
				this.invalidateConfirmation();
			},
			setConstraints(constraints) {
				this.constraints = constraints;
			},
			setCallbacks(callbacks) {
				this.callbacks = ui_vue3.markRaw(callbacks);
			},
			isSameFeed(feed) {
				return this.stageType === feed.stageType && this.storageId === feed.storageId && this.folderId === feed.folderId;
			},
			setFeed(feed) {
				if (!this.isSameFeed(feed)) {
					this.invalidateConfirmation();
					this.feedRevision += 1;
				}
				this.stageType = feed.stageType;
				this.storageId = feed.storageId;
				this.folderId = feed.folderId;
				this.resetPagination();
			},
			resetPagination() {
				this.page = 1;
				this.loadingMore = false;
				this.emptyStreak = 0;
				this.paginationStalled = false;
			},
			setPage(page) {
				this.page = page;
			},
			setLoadingMore(loading) {
				this.loadingMore = loading;
			},
			setEmptyStreak(streak) {
				this.emptyStreak = streak;
			},
			setPaginationStalled(stalled) {
				this.paginationStalled = stalled;
			},
			setFilters(filters) {
				if (!isSameFilters(this.filters, filters)) {
					this.feedRevision += 1;
				}
				this.objectTypeFilter = filters.objectTypeFilter;
				this.fileTypeFilters = [...filters.fileTypeFilters];
			},
			setSearchQuery(query) {
				if (this.searchQuery !== query) {
					this.feedRevision += 1;
				}
				this.searchQuery = query;
			},
			setFilterFind(find) {
				this.filterFind = find.trim();
			},
			setSearchOpen(open) {
				this.searchOpen = open;
			},
			resetSearchQuery() {
				this.setSearchQuery('');
			},
			setViewMode(mode) {
				this.viewMode = mode;
			},
			setBreadcrumbs(breadcrumbs) {
				this.breadcrumbs = [...breadcrumbs];
			},
			setBreadcrumbsFromContext(context) {
				this.breadcrumbs = buildDisplayBreadcrumbs(context);
			},
			setHasMore(hasMore) {
				this.hasMore = hasMore;
			},
			setLoading(loading) {
				this.contentLoading = loading;
				if (!loading) {
					this.preserveContentOnLoading = false;
				}
			},
			setPreserveContentOnLoading(preserve) {
				this.preserveContentOnLoading = preserve;
			},
			setNavigationPending(pending) {
				this.navigationPending = pending;
			},
			requestFocusHandoffToFiles() {
				this.focusHandoffToFiles = true;
			},
			consumeFocusHandoffToFiles() {
				const requested = this.focusHandoffToFiles;
				this.focusHandoffToFiles = false;
				return requested;
			},
			markInitialized() {
				this.initialized = true;
			},
			setContentError(code) {
				this.contentError = code;
			},
			clearContentError() {
				this.contentError = null;
			},
			setEmptyReason(reason) {
				this.emptyReason = reason;
			},
			setConfirming(confirming) {
				this.confirming = confirming;
			},
			nextConfirmationToken() {
				this.confirmationEpoch += 1;
				return this.confirmationEpoch;
			},
			isCurrentConfirmation(token) {
				return this.isSessionActive() && token === this.confirmationEpoch;
			},
			invalidateConfirmation() {
				this.confirmationEpoch += 1;
				this.confirming = false;
			}
		}
	});

	function mergeSources(current, incoming) {
		const merged = current.map(source => ({
			...source
		}));
		const indexes = new Map(merged.map((source, index) => [source.storageId, index]));
		incoming.forEach(source => {
			const index = indexes.get(source.storageId);
			if (index === undefined) {
				indexes.set(source.storageId, merged.length);
				merged.push({
					...source
				});
				return;
			}
			merged[index] = {
				...source
			};
		});
		return merged;
	}
	const useSourceStore = ui_vue3_pinia.defineStore('diskPickerSource', {
		state: () => ({
			sources: [],
			sourcesLoading: false,
			sourcesValidating: false,
			sourcesLoadingMore: false,
			sourcesError: null,
			sourcesPageError: null,
			sourcesHasMore: false,
			sourcesPage: 1,
			sourcesRevision: null
		}),
		actions: {
			setSources(sources) {
				this.sources = [...sources];
			},
			setLoading(loading) {
				this.sourcesLoading = loading;
			},
			setError(code) {
				this.sourcesError = code;
			},
			replacePage(sources, page, hasMore, revision) {
				this.sources = mergeSources([], sources);
				this.sourcesPage = page;
				this.sourcesHasMore = hasMore;
				this.sourcesRevision = revision;
				this.sourcesError = null;
				this.sourcesPageError = null;
			},
			appendPage(sources, page, hasMore, revision) {
				if (revision !== this.sourcesRevision) {
					return false;
				}
				this.sources = mergeSources(this.sources, sources);
				this.sourcesPage = page;
				this.sourcesHasMore = hasMore;
				this.sourcesPageError = null;
				return true;
			},
			hydrate(snapshot) {
				this.replacePage(snapshot.sources, snapshot.page, snapshot.hasMore, snapshot.revision);
			},
			setValidating(validating) {
				this.sourcesValidating = validating;
			},
			setLoadingMore(loading) {
				this.sourcesLoadingMore = loading;
			},
			setPageError(code) {
				this.sourcesPageError = code;
			},
			reset() {
				this.sources = [];
				this.sourcesLoading = false;
				this.sourcesValidating = false;
				this.sourcesLoadingMore = false;
				this.sourcesError = null;
				this.sourcesPageError = null;
				this.sourcesHasMore = false;
				this.sourcesPage = 1;
				this.sourcesRevision = null;
			}
		}
	});

	let snapshot = null;
	function copy$1(sourceCache) {
		return {
			sources: sourceCache.sources.map(source => ({
				...source
			})),
			page: sourceCache.page,
			hasMore: sourceCache.hasMore,
			revision: sourceCache.revision
		};
	}
	function getSourceCache() {
		return snapshot === null ? null : copy$1(snapshot);
	}
	function setSourceCache(next) {
		snapshot = copy$1(next);
	}

	const FOLDER_NOT_FOUND_MESSAGE = 'DISK_PICKER_NOTIFY_FOLDER_NOT_FOUND';
	function resolveStartFeed(initialStage) {
		if (initialStage !== null && initialStage.type === StageType.Folder) {
			return {
				stageType: StageType.Folder,
				storageId: initialStage.storageId,
				folderId: initialStage.folderId
			};
		}
		if (initialStage !== null && initialStage.type === StageType.Sources) {
			return {
				stageType: StageType.Sources,
				storageId: null,
				folderId: null
			};
		}
		return {
			stageType: StageType.Recent,
			storageId: null,
			folderId: null
		};
	}
	function applyInitialStageResult(session, item, result, recentLocalFilters) {
		session.setFeed(result.stage);
		session.setBreadcrumbsFromContext(result.context);
		if (recentLocalFilters === null) {
			item.replace(result.items);
			session.setEmptyReason(result.emptyReason);
		} else {
			item.setRecentSnapshot(result.items);
			const visible = applyLocalFilters(result.items, recentLocalFilters);
			item.replace(visible);
			session.setEmptyReason(visible.length === 0 ? 'empty' : null);
		}
		const visibleIds = item.items.map(entry => entry.objectId);
		useSelectionStore().pruneActive(visibleIds);
		session.setHasMore(result.stage.stageType === StageType.Sources ? false : result.pagination.hasMore);
		session.setLoading(false);
		session.markInitialized();
	}
	function applySearchResult(session, item, result, query) {
		session.setBreadcrumbsFromContext(null);
		const items = session.stageType === StageType.Recent ? withLocalMatches(result.items, item.recentSnapshot, session.filters, query) : result.items;
		item.replace(items);
		useSelectionStore().pruneActive(items.map(entry => entry.objectId));
		session.setHasMore(result.pagination.hasMore);
		session.setEmptyReason(items.length === 0 ? result.emptyReason : null);
		session.setLoading(false);
		session.markInitialized();
	}
	function sourceSnapshot(source) {
		if (source.sourcesRevision === null) {
			return null;
		}
		return {
			sources: source.sources,
			page: source.sourcesPage,
			hasMore: source.sourcesHasMore,
			revision: source.sourcesRevision
		};
	}
	function persistSources$1(source) {
		const snapshot = sourceSnapshot(source);
		if (snapshot !== null) {
			setSourceCache(snapshot);
		}
	}
	function prepareSourcesLoading(source) {
		const cached = getSourceCache();
		source.setError(null);
		source.setPageError(null);
		if (cached === null) {
			source.setLoading(true);
			source.setValidating(false);
			return null;
		}
		source.hydrate(cached);
		source.setLoading(false);
		source.setValidating(true);
		return cached;
	}
	function applySourcesResult(source, result, cached) {
		const revision = result.sourceRevision;
		if (revision === null) {
			throw new Error('DiskPicker: sources response has no catalogue revision');
		}
		if (cached === null || cached.revision !== revision) {
			source.replacePage(result.sources, 1, result.pagination.hasMore, revision);
			persistSources$1(source);
		}
		source.setLoading(false);
		source.setValidating(false);
	}
	function applySourcesError(source, code, cached) {
		if (cached === null && source.sources.length === 0) {
			source.setError(code);
		}
		source.setLoading(false);
		source.setValidating(false);
	}
	async function loadSources(deps, session) {
		if (!session.isSessionActive()) {
			return;
		}
		const source = useSourceStore();
		const cached = prepareSourcesLoading(source);
		try {
			const result = await loadInitialStage$1({
				initialStage: {
					type: StageType.Sources,
					storageId: null,
					folderId: null
				},
				filters: {
					objectTypeFilter: ObjectTypeFilter.All,
					fileTypeFilters: []
				},
				allowedFileTypes: session.constraints.allowedFileTypes,
				page: 1,
				pageSize: PageSize.Default,
				signedConfig: session.constraints.signedConfig
			});
			if (!session.isSessionActive()) {
				return;
			}
			applySourcesResult(source, result, cached);
		} catch (error) {
			if (pickerErrorCode(error) === ErrorCode.InvalidContext) {
				session.invalidateRequests();
				deps.onContextInvalid();
				return;
			}
			if (!session.isSessionActive()) {
				return;
			}
			applySourcesError(source, pickerErrorCode(error), cached);
		}
	}
	async function runRecovery(deps, session, item) {
		const recentFeed = {
			stageType: StageType.Recent,
			storageId: null,
			folderId: null
		};
		session.setFeed(recentFeed);
		useSelectionStore().setActive(null);
		session.resetSearchQuery();
		await runMainStart(deps, session, item, recentFeed, '', false);
	}
	function requestSearchPage(session, startFeed, query) {
		return search({
			query,
			storageId: startFeed.stageType === StageType.Folder ? startFeed.storageId : null,
			filters: session.filters,
			allowedFileTypes: session.constraints.allowedFileTypes,
			page: 1,
			pageSize: PageSize.Default,
			signedConfig: session.constraints.signedConfig
		});
	}
	function requestStagePage(session, startFeed) {
		const isRecent = startFeed.stageType === StageType.Recent;
		return loadInitialStage$1({
			initialStage: {
				type: startFeed.stageType,
				storageId: startFeed.storageId,
				folderId: startFeed.folderId
			},
			filters: isRecent ? {
				objectTypeFilter: ObjectTypeFilter.All,
				fileTypeFilters: []
			} : session.filters,
			allowedFileTypes: session.constraints.allowedFileTypes,
			page: 1,
			pageSize: isRecent ? PageSize.Recent : PageSize.Default,
			signedConfig: session.constraints.signedConfig
		});
	}
	async function handleMainError(deps, session, item, error, context) {
		const code = pickerErrorCode(error);
		if (code === ErrorCode.InvalidContext) {
			session.invalidateRequests();
			deps.onContextInvalid();
			return;
		}
		if (!session.isCurrentRequest(context.token)) {
			return;
		}
		const isRecoverable = context.allowRecovery && !context.searchActive && context.startFeed.stageType === StageType.Folder && code === ErrorCode.NotFound;
		if (isRecoverable) {
			deps.notify(FOLDER_NOT_FOUND_MESSAGE);
			await runRecovery(deps, session, item);
			return;
		}
		session.setContentError(code);
		session.setLoading(false);
		session.markInitialized();
	}
	async function runMainStart(deps, session, item, startFeed, query, allowRecovery) {
		const token = session.nextRequestToken();
		session.setLoading(true);
		session.clearContentError();
		const searchActive = [...query].length >= SearchQueryLength.Min;
		const sharesSourcesRequest = !searchActive && startFeed.stageType === StageType.Sources;
		const source = sharesSourcesRequest ? useSourceStore() : null;
		let sourceCache = null;
		if (source !== null) {
			sourceCache = prepareSourcesLoading(source);
		}
		try {
			if (searchActive) {
				const recentRequest = startFeed.stageType === StageType.Recent ? requestStagePage(session, startFeed).catch(() => null) : null;
				const result = await requestSearchPage(session, startFeed, query);
				const recent = recentRequest === null ? null : await recentRequest;
				if (session.isCurrentRequest(token)) {
					if (recent !== null) {
						item.setRecentSnapshot(recent.items);
					}
					applySearchResult(session, item, result, query);
				}
				return;
			}
			const result = await requestStagePage(session, startFeed);
			if (source !== null && session.isSessionActive()) {
				applySourcesResult(source, result, sourceCache);
			}
			if (session.isCurrentRequest(token)) {
				const localFilters = startFeed.stageType === StageType.Recent ? session.filters : null;
				applyInitialStageResult(session, item, result, localFilters);
			}
		} catch (error) {
			const code = pickerErrorCode(error);
			if (source !== null && code !== ErrorCode.InvalidContext && session.isSessionActive()) {
				applySourcesError(source, code, sourceCache);
			}
			await handleMainError(deps, session, item, error, {
				token,
				searchActive,
				startFeed,
				allowRecovery
			});
		}
	}
	async function loadInitialStage(deps) {
		const session = useSessionStore();
		const item = useItemStore();
		session.setConstraints(deps.constraints);
		session.setFilters({
			objectTypeFilter: deps.restoredFilter.objectTypeFilter,
			fileTypeFilters: deps.restoredFilter.fileTypeFilters
		});
		const query = deps.restoredFilter.find.trim();
		session.setFilterFind(query);
		session.setSearchQuery(query);
		const startFeed = resolveStartFeed(deps.constraints.initialStage);
		session.setFeed(startFeed);
		const searchActive = [...query].length >= SearchQueryLength.Min;
		if (searchActive || startFeed.stageType !== StageType.Sources) {
			void loadSources(deps, session);
		}
		await runMainStart(deps, session, item, startFeed, query, true);
	}
	async function retrySources() {
		const session = useSessionStore();
		await loadSources({
			constraints: session.constraints,
			restoredFilter: {
				find: session.searchQuery,
				objectTypeFilter: session.objectTypeFilter,
				fileTypeFilters: session.fileTypeFilters
			},
			notify: session.callbacks.notify,
			onContextInvalid: session.callbacks.onContextInvalid
		}, session);
	}
	async function retryInitialStage() {
		const session = useSessionStore();
		const item = useItemStore();
		const deps = {
			constraints: session.constraints,
			restoredFilter: {
				find: session.searchQuery,
				objectTypeFilter: session.objectTypeFilter,
				fileTypeFilters: session.fileTypeFilters
			},
			notify: session.callbacks.notify,
			onContextInvalid: session.callbacks.onContextInvalid
		};
		await runMainStart(deps, session, item, session.feed, '', false);
	}

	const VIEWER_EXTENSION = 'ui.viewer';
	const CLOSE_EVENT = 'BX.UI.Viewer.Controller:onClose';
	const TITLE_ATTRIBUTE = 'data-title';
	function belongsToThisWindow(value) {
		return value instanceof Object;
	}
	function getController() {
		const controller = main_core.Reflection.getClass('BX.UI.Viewer.Instance');
		if (!controller) {
			throw new Error('DiskPicker: ui.viewer is not available');
		}
		if (!belongsToThisWindow(controller)) {
			throw new Error('DiskPicker: ui.viewer runs in another window');
		}
		return controller;
	}
	function buildItem(node) {
		const build = main_core.Reflection.getClass('BX.UI.Viewer.buildItemByNode');
		if (!build) {
			throw new Error('DiskPicker: ui.viewer is not available');
		}
		return build(node);
	}
	class PageViewerAdapter {
		#loading = null;
		ensureLoaded() {
			if (this.#loading === null) {
				this.#loading = main_core.Runtime.loadExtension(VIEWER_EXTENSION).then(() => {}).catch(error => {
					this.#loading = null;
					throw error;
				});
			}
			return this.#loading;
		}
		buildNode(entry, title) {
			const node = document.createElement('span');
			Object.entries(entry.attributes).forEach(([name, value]) => {
				node.setAttribute(name, value);
			});
			node.setAttribute(TITLE_ATTRIBUTE, title);
			return node;
		}
		isSeparate(node) {
			return Boolean(getController().isSeparateItem(node));
		}
		async prepare(nodes) {
			const controller = getController();
			await controller.loadExtensions(controller.collectExtensionsForItems(nodes));
			await controller.setItems(nodes.map(node => buildItem(node)));
			return index => {
				controller.open(index);
			};
		}
		async openSeparate(node, onFailure) {
			const controller = getController();
			await controller.loadExtensions(controller.collectExtensionsForItems([node]));
			const item = buildItem(node);
			await controller.setItems([item]);
			controller.openSeparate(0);
			void item.load().catch(onFailure);
		}
		onClose(callback) {
			const handler = event => {
				const [controller] = event.getCompatData() ?? [];
				if (controller !== undefined && controller !== getController()) {
					return;
				}
				callback();
			};
			main_core_events.EventEmitter.subscribe(CLOSE_EVENT, handler);
			return () => {
				main_core_events.EventEmitter.unsubscribe(CLOSE_EVENT, handler);
			};
		}
	}
	const viewerAdapter = new PageViewerAdapter();

	const useViewerStore = ui_vue3_pinia.defineStore('diskPickerViewer', {
		state: () => ({
			openingObjectId: null,
			open: false
		}),
		getters: {
			isBusy() {
				return this.openingObjectId !== null || this.open;
			}
		},
		actions: {
			startOpening(objectId) {
				this.openingObjectId = objectId;
			},
			markOpen() {
				this.openingObjectId = null;
				this.open = true;
			},
			reset() {
				this.openingObjectId = null;
				this.open = false;
			}
		}
	});

	const PREVIEW_UNAVAILABLE_MESSAGE = 'DISK_PICKER_NOTIFY_PREVIEW_UNAVAILABLE';
	let activeSession = null;
	function setWindowInert(container, inert) {
		if (container === null) {
			return;
		}
		if (inert) {
			container.setAttribute('inert', '');
			return;
		}
		container.removeAttribute('inert');
	}
	function createOpenPreviewDeps(notify, windowContainer) {
		return {
			notify,
			windowContainer,
			service: {
				getViewerAttributes
			},
			viewer: viewerAdapter
		};
	}
	function detachSession() {
		const session = activeSession;
		if (session === null) {
			return null;
		}
		activeSession = null;
		if (session.shown) {
			session.shown = false;
			session.setShown(false);
		}
		setWindowInert(session.windowContainer, false);
		session.unsubscribe();
		return session;
	}
	function releasePreviewLayer() {
		detachSession();
	}
	function returnFocus(session) {
		const initiator = session.initiator;
		const target = initiator !== null && initiator.isConnected ? initiator : session.windowContainer;
		try {
			target?.focus();
		} catch {
		}
	}
	function endPreview() {
		const session = detachSession();
		if (session === null) {
			return;
		}
		returnFocus(session);
		useViewerStore().reset();
	}
	function failPreview(deps) {
		endPreview();
		deps.notify(PREVIEW_UNAVAILABLE_MESSAGE);
		useViewerStore().reset();
	}
	function windowAroundInitiator(candidates, initiatorIndex) {
		if (candidates.length <= PageSize.Max) {
			return candidates;
		}
		const before = Math.floor((PageSize.Max - 1) / 2);
		const lastStart = candidates.length - PageSize.Max;
		const start = Math.min(Math.max(initiatorIndex - before, 0), lastStart);
		return candidates.slice(start, start + PageSize.Max);
	}
	function canOpenPreview(item) {
		return item.previewable && !item.isFolder && !useViewerStore().isBusy && !useSessionStore().confirming;
	}
	async function openPreview(item, initiator, deps) {
		const viewer = useViewerStore();
		const session = useSessionStore();
		if (!canOpenPreview(item)) {
			return;
		}
		viewer.startOpening(item.objectId);
		const revision = session.feedRevision;
		const feed = useItemStore().items.filter(entry => !entry.isFolder && entry.previewable);
		const candidates = windowAroundInitiator(feed, feed.findIndex(entry => entry.objectId === item.objectId));
		let result;
		try {
			[result] = await Promise.all([deps.service.getViewerAttributes({
				objectIds: candidates.map(entry => entry.objectId),
				signedConfig: session.constraints.signedConfig
			}), deps.viewer.ensureLoaded()]);
		} catch {
			failPreview(deps);
			return;
		}
		if (!session.isSessionActive() || session.feedRevision !== revision) {
			viewer.reset();
			return;
		}
		const entryById = new Map(result.items.map(entry => [entry.objectId, entry]));
		if (!entryById.has(item.objectId)) {
			failPreview(deps);
			return;
		}
		const shown = candidates.filter(entry => entryById.has(entry.objectId));
		try {
			const nodes = shown.map(entry => deps.viewer.buildNode(entryById.get(entry.objectId), entry.name));
			const initiatorNode = nodes[shown.findIndex(entry => entry.objectId === item.objectId)];
			const previewSession = {
				initiator,
				windowContainer: deps.windowContainer,
				unsubscribe: deps.viewer.onClose(endPreview),
				setShown: session.callbacks.setPreviewShown,
				shown: false
			};
			activeSession = previewSession;
			if (deps.viewer.isSeparate(initiatorNode)) {
				await deps.viewer.openSeparate(initiatorNode, () => deps.notify(PREVIEW_UNAVAILABLE_MESSAGE));
				endPreview();
				return;
			}
			const embedded = nodes.filter(node => !deps.viewer.isSeparate(node));
			const show = await deps.viewer.prepare(embedded);
			if (activeSession !== previewSession || !session.isSessionActive() || session.feedRevision !== revision) {
				detachSession();
				viewer.reset();
				return;
			}
			setWindowInert(deps.windowContainer, true);
			previewSession.shown = true;
			previewSession.setShown(true);
			viewer.markOpen();
			show(embedded.indexOf(initiatorNode));
		} catch {
			failPreview(deps);
		}
	}

	const MAX_CONCURRENT_PREVIEWS = 2;
	const pending = [];
	const active = new Set();
	let paused = false;
	function detach(previewImage) {
		const image = previewImage;
		image.onload = null;
		image.onerror = null;
	}
	function removePending(task) {
		const index = pending.indexOf(task);
		if (index >= 0) {
			pending.splice(index, 1);
		}
	}
	function settle(previewTask, loaded) {
		const task = previewTask;
		if (task.settled) {
			return;
		}
		task.settled = true;
		active.delete(task);
		const image = task.image;
		if (image !== null) {
			detach(image);
		}
		try {
			if (loaded && image !== null) {
				task.onLoad(image);
			}
			task.onSettle?.();
		} finally {
			startPending();
		}
	}
	function start(previewTask) {
		const task = previewTask;
		const image = new Image();
		task.image = image;
		active.add(task);
		image.onload = () => settle(task, true);
		image.onerror = () => settle(task, false);
		image.src = task.url;
	}
	function startPending() {
		if (paused) {
			return;
		}
		while (active.size < MAX_CONCURRENT_PREVIEWS && pending.length > 0) {
			const task = pending.shift();
			if (task !== undefined && !task.settled) {
				start(task);
			}
		}
	}
	function cancel(previewTask) {
		const task = previewTask;
		if (task.settled) {
			return;
		}
		task.settled = true;
		removePending(task);
		if (task.image !== null) {
			detach(task.image);
			task.image.src = '';
		}
		active.delete(task);
		task.onSettle?.();
		startPending();
	}
	function enqueuePreview(url, onLoad, onSettle = null, keepOnFeedChange = false) {
		const task = {
			url,
			onLoad,
			onSettle,
			image: null,
			settled: false,
			keepOnFeedChange
		};
		pending.push(task);
		startPending();
		return () => cancel(task);
	}
	function pauseAndClearPreviews() {
		paused = true;
		[...pending, ...active].filter(task => !task.keepOnFeedChange).forEach(task => cancel(task));
	}
	function resumePreviews() {
		paused = false;
		startPending();
	}
	function resetPreviews() {
		paused = true;
		[...pending, ...active].forEach(task => cancel(task));
		paused = false;
	}

	const FOLDER_PAGE_CACHE_LIMIT = 20;
	const pages = new Map();
	function key(request) {
		return JSON.stringify({
			storageId: request.storageId,
			folderId: request.folderId,
			objectTypeFilter: request.filters.objectTypeFilter,
			fileTypeFilters: [...request.filters.fileTypeFilters].sort(),
			allowedFileTypes: [...request.allowedFileTypes].sort(),
			orderField: request.order.field,
			orderDirection: request.order.direction,
			pageSize: request.pageSize
		});
	}
	function copy(result) {
		return {
			items: result.items.map(item => ({
				...item
			})),
			pagination: {
				...result.pagination
			},
			context: {
				storageId: result.context.storageId,
				folderId: result.context.folderId,
				currentFolder: result.context.currentFolder === null ? null : {
					...result.context.currentFolder
				},
				breadcrumbs: result.context.breadcrumbs.map(breadcrumb => ({
					...breadcrumb
				}))
			},
			emptyReason: result.emptyReason
		};
	}
	function getFolderPage(request) {
		if (request.page !== 1) {
			return null;
		}
		const cacheKey = key(request);
		const cached = pages.get(cacheKey);
		if (cached === undefined) {
			return null;
		}
		pages.delete(cacheKey);
		pages.set(cacheKey, cached);
		return copy(cached);
	}
	function setFolderPage(request, result) {
		if (request.page !== 1) {
			return;
		}
		const cacheKey = key(request);
		pages.delete(cacheKey);
		pages.set(cacheKey, copy(result));
		while (pages.size > FOLDER_PAGE_CACHE_LIMIT) {
			const oldestKey = pages.keys().next().value;
			if (oldestKey === undefined) {
				break;
			}
			pages.delete(oldestKey);
		}
	}
	function clearFolderPages() {
		pages.clear();
	}

	const DEFAULT_ORDER_INPUT$1 = DEFAULT_ORDER;
	const FOLDER_NOT_REFRESHED_MESSAGE = 'DISK_PICKER_NOTIFY_FOLDER_NOT_REFRESHED';
	function handleFeedError(session, deps, error, token) {
		const code = pickerErrorCode(error);
		if (code === ErrorCode.InvalidContext) {
			session.invalidateRequests();
			deps.onContextInvalid();
			return;
		}
		if (!session.isCurrentRequest(token)) {
			return;
		}
		session.setContentError(code);
		session.setLoading(false);
	}
	function firstPageRequest(session, feed) {
		return {
			storageId: feed.storageId,
			folderId: feed.folderId,
			filters: session.filters,
			allowedFileTypes: session.constraints.allowedFileTypes,
			order: DEFAULT_ORDER_INPUT$1,
			page: 1,
			pageSize: PageSize.Default,
			signedConfig: session.constraints.signedConfig
		};
	}
	function applyFirstPage(session, item, result) {
		item.replace(result.items);
		useSelectionStore().pruneActive(result.items.map(entry => entry.objectId));
		session.setBreadcrumbsFromContext(result.context);
		session.setHasMore(result.pagination.hasMore);
		session.setEmptyReason(result.emptyReason);
	}
	function finishNavigation(session) {
		session.setNavigationPending(false);
		session.setLoading(false);
		resumePreviews();
	}
	function releaseNavigationHold() {
		const session = useSessionStore();
		if (!session.navigationPending) {
			return;
		}
		session.setNavigationPending(false);
		resumePreviews();
	}
	function handleNavigationError(session, item, deps, error, token, hadCachedPage) {
		const code = pickerErrorCode(error);
		if (code === ErrorCode.InvalidContext) {
			clearFolderPages();
			pauseAndClearPreviews();
			resumePreviews();
			session.invalidateRequests();
			session.setNavigationPending(false);
			deps.onContextInvalid();
			return;
		}
		if (!session.isCurrentRequest(token)) {
			return;
		}
		if (hadCachedPage) {
			session.callbacks.notify(FOLDER_NOT_REFRESHED_MESSAGE);
		} else {
			item.clear();
			session.setContentError(code);
		}
		finishNavigation(session);
	}
	async function changeFeed(nextFeed, deps, optimisticBreadcrumbs = []) {
		const session = useSessionStore();
		const item = useItemStore();
		if (session.isSameFeed(nextFeed)) {
			return;
		}
		if (nextFeed.storageId === null || nextFeed.folderId === null) {
			return;
		}
		const token = session.nextRequestToken();
		pauseAndClearPreviews();
		session.setNavigationPending(true);
		session.setFeed(nextFeed);
		useSelectionStore().setActive(null);
		deps.suppressFilterFind();
		session.setFilterFind('');
		session.resetSearchQuery();
		session.setBreadcrumbs(optimisticBreadcrumbs);
		session.setHasMore(false);
		session.clearContentError();
		const request = firstPageRequest(session, nextFeed);
		const cached = getFolderPage(request);
		if (cached === null) {
			session.setPreserveContentOnLoading(true);
			session.setLoading(true);
		} else {
			applyFirstPage(session, item, cached);
			session.setLoading(false);
		}
		try {
			const result = await listChildren(request);
			if (!session.isCurrentRequest(token)) {
				return;
			}
			applyFirstPage(session, item, result);
			setFolderPage(request, result);
			finishNavigation(session);
		} catch (error) {
			handleNavigationError(session, item, deps, error, token, cached !== null);
		}
	}
	async function reloadCurrentFeed(deps) {
		const session = useSessionStore();
		const item = useItemStore();
		const feed = session.feed;
		if (feed.storageId === null || feed.folderId === null) {
			return;
		}
		releaseNavigationHold();
		session.invalidateConfirmation();
		const token = session.nextRequestToken();
		session.setPreserveContentOnLoading(item.count > 0);
		session.setLoading(true);
		session.clearContentError();
		session.resetPagination();
		try {
			const result = await listChildren({
				storageId: feed.storageId,
				folderId: feed.folderId,
				filters: session.filters,
				allowedFileTypes: session.constraints.allowedFileTypes,
				order: DEFAULT_ORDER_INPUT$1,
				page: 1,
				pageSize: PageSize.Default,
				signedConfig: session.constraints.signedConfig
			});
			if (!session.isCurrentRequest(token)) {
				return;
			}
			item.replace(result.items);
			useSelectionStore().pruneActive(result.items.map(entry => entry.objectId));
			session.setBreadcrumbsFromContext(result.context);
			session.setHasMore(result.pagination.hasMore);
			session.setEmptyReason(result.emptyReason);
			session.setLoading(false);
		} catch (error) {
			handleFeedError(session, deps, error, token);
		}
	}
	function childBreadcrumbs(item) {
		const session = useSessionStore();
		const canInferPath = session.stageType === StageType.Folder && session.storageId === item.sourceId && session.searchQuery === '' && session.breadcrumbs.length > 0;
		if (!canInferPath) {
			return [];
		}
		return [...session.breadcrumbs, {
			objectId: item.objectId,
			name: item.name
		}];
	}
	function openFolder(item, deps) {
		const optimisticBreadcrumbs = childBreadcrumbs(item);
		return changeFeed({
			stageType: StageType.Folder,
			storageId: item.sourceId,
			folderId: item.objectId
		}, deps, optimisticBreadcrumbs);
	}
	function openBreadcrumb(breadcrumb, deps) {
		const session = useSessionStore();
		const feed = session.feed;
		if (feed.stageType !== StageType.Folder || feed.storageId === null || feed.storageId <= 0) {
			return Promise.resolve();
		}
		const breadcrumbIndex = session.breadcrumbs.findIndex(entry => entry.objectId === breadcrumb.objectId);
		const optimisticBreadcrumbs = breadcrumbIndex >= 0 ? session.breadcrumbs.slice(0, breadcrumbIndex + 1) : [];
		return changeFeed({
			stageType: StageType.Folder,
			storageId: feed.storageId,
			folderId: breadcrumb.objectId
		}, deps, optimisticBreadcrumbs);
	}
	function openParentFolder(deps) {
		const session = useSessionStore();
		const parent = session.breadcrumbs.length > 1 ? session.breadcrumbs[session.breadcrumbs.length - 2] : null;
		const blocked = session.contentLoading || session.navigationPending || session.confirming;
		if (session.stageType !== StageType.Folder || parent === null || blocked || session.folderId === null) {
			return null;
		}
		const leavingFolderId = session.folderId;
		void openBreadcrumb(parent, deps);
		return leavingFolderId;
	}

	const DEFAULT_MAX_ITEMS = 100;
	const SELECT_LIMIT_MESSAGE$1 = 'DISK_PICKER_NOTIFY_SELECT_LIMIT';
	const LIMIT_NOTICE_DELAY = 250;
	function effectiveMaxItems(maxItems) {
		return Math.min(maxItems ?? DEFAULT_MAX_ITEMS, DEFAULT_MAX_ITEMS);
	}
	let pendingLimitNotice = null;
	function clearLimitNotice() {
		if (pendingLimitNotice !== null) {
			clearTimeout(pendingLimitNotice.timer);
			pendingLimitNotice = null;
		}
	}
	function resetSelectLimitNotice() {
		clearLimitNotice();
	}
	function cancelSelectLimitNotice(objectId) {
		if (pendingLimitNotice?.objectId === objectId) {
			clearLimitNotice();
		}
	}
	function notifySelectLimit(item, maxItems, deps) {
		const replacements = {
			'#COUNT#': String(maxItems)
		};
		if (!item.previewable) {
			deps.notify(SELECT_LIMIT_MESSAGE$1, replacements);
			return;
		}
		clearLimitNotice();
		const timer = setTimeout(() => {
			pendingLimitNotice = null;
			if (useSessionStore().isSessionActive()) {
				deps.notify(SELECT_LIMIT_MESSAGE$1, replacements);
			}
		}, LIMIT_NOTICE_DELAY);
		pendingLimitNotice = {
			objectId: item.objectId,
			timer
		};
	}
	function lastPickedId(selectedIds) {
		return selectedIds.length > 0 ? selectedIds[selectedIds.length - 1] : null;
	}
	function snapshotOf(item) {
		return {
			objectId: item.objectId,
			size: item.size,
			iconType: item.iconType,
			previewUrl: item.previewUrl,
			createTime: item.createTime,
			updateTime: item.updateTime
		};
	}
	function toggleSelection(item, deps) {
		const session = useSessionStore();
		if (session.confirming || session.contentLoading && session.preserveContentOnLoading) {
			return;
		}
		if (item.isFolder) {
			void openFolder(item, deps);
			return;
		}
		if (!item.selectable) {
			return;
		}
		const selection = useSelectionStore();
		selection.setActive(item.objectId);
		if (session.constraints.selectionMode === SelectionMode.Single) {
			selection.replaceWith(item.objectId, snapshotOf(item));
			return;
		}
		if (selection.has(item.objectId)) {
			selection.remove(item.objectId);
			selection.setActive(lastPickedId(selection.selectedIds));
			return;
		}
		const maxItems = effectiveMaxItems(session.constraints.maxItems);
		if (selection.count >= maxItems) {
			notifySelectLimit(item, maxItems, deps);
			return;
		}
		selection.add(item.objectId, snapshotOf(item));
	}
	function toggleFileSelection(item, deps) {
		if (item.isFolder || !item.selectable) {
			return;
		}
		toggleSelection(item, deps);
	}

	let clickState = null;
	function resetRowActivation() {
		clickState = null;
	}
	function rememberClickState(item) {
		clickState = item.previewable && !item.isFolder ? {
			objectId: item.objectId,
			snapshot: ui_vue3.markRaw(useSelectionStore().captureState())
		} : null;
	}
	function restoreClickState(item) {
		if (clickState?.objectId !== item.objectId) {
			return;
		}
		useSelectionStore().restoreState(clickState.snapshot);
		clickState = null;
	}
	function startPreview(item, initiator, windowContainer) {
		cancelSelectLimitNotice(item.objectId);
		void openPreview(item, initiator, createOpenPreviewDeps(useSessionStore().callbacks.notify, windowContainer));
	}
	function beginClick(item, event) {
		if (event.detail >= 2) {
			return;
		}
		rememberClickState(item);
		toggleSelection(item, useSessionStore().callbacks);
	}
	function openPreviewFromDblclick(item, initiator, windowContainer) {
		if (!canOpenPreview(item)) {
			return;
		}
		restoreClickState(item);
		startPreview(item, initiator, windowContainer);
	}
	function openPreviewFromButton(item, initiator, windowContainer) {
		startPreview(item, initiator, windowContainer);
	}

	function queryLength(query) {
		return [...query].length;
	}
	function handleSearchError(session, deps, error, token) {
		const code = pickerErrorCode(error);
		if (code === ErrorCode.InvalidContext) {
			session.invalidateRequests();
			deps.onContextInvalid();
			return;
		}
		if (!session.isCurrentRequest(token)) {
			return;
		}
		session.setContentError(code);
		session.setLoading(false);
	}
	async function restoreBaseFeed(deps) {
		const session = useSessionStore();
		releaseNavigationHold();
		session.invalidateConfirmation();
		session.resetSearchQuery();
		if (session.stageType === StageType.Sources) {
			session.nextRequestToken();
			useItemStore().replace([]);
			useSelectionStore().pruneActive([]);
			session.setBreadcrumbs([]);
			session.resetPagination();
			session.setHasMore(false);
			session.setEmptyReason(null);
			session.clearContentError();
			session.setLoading(false);
			return;
		}
		if (session.stageType === StageType.Recent) {
			session.nextRequestToken();
			const item = useItemStore();
			const visible = applyLocalFilters(item.recentSnapshot, session.filters);
			item.replace(visible);
			useSelectionStore().pruneActive(visible.map(entry => entry.objectId));
			session.setHasMore(false);
			session.setEmptyReason(visible.length === 0 ? 'empty' : null);
			session.clearContentError();
			session.setLoading(false);
			return;
		}
		await reloadCurrentFeed(deps);
	}
	async function searchItems(rawQuery, deps) {
		const session = useSessionStore();
		if (!session.isSessionActive()) {
			return;
		}
		const query = rawQuery.trim();
		session.setFilterFind(query);
		if (queryLength(query) < SearchQueryLength.Min) {
			if (session.searchQuery !== '') {
				await restoreBaseFeed(deps);
			}
			return;
		}
		session.setSearchQuery(query);
		releaseNavigationHold();
		session.invalidateConfirmation();
		const token = session.nextRequestToken();
		session.setPreserveContentOnLoading(useItemStore().count > 0);
		session.setLoading(true);
		session.clearContentError();
		session.resetPagination();
		session.setHasMore(false);
		try {
			const result = await search({
				query,
				storageId: session.stageType === StageType.Folder ? session.storageId : null,
				filters: session.filters,
				allowedFileTypes: session.constraints.allowedFileTypes,
				page: 1,
				pageSize: PageSize.Default,
				signedConfig: session.constraints.signedConfig
			});
			if (!session.isCurrentRequest(token)) {
				return;
			}
			const item = useItemStore();
			const items = session.stageType === StageType.Recent ? withLocalMatches(result.items, item.recentSnapshot, session.filters, query) : result.items;
			item.replace(items);
			useSelectionStore().pruneActive(items.map(entry => entry.objectId));
			session.setHasMore(result.pagination.hasMore);
			session.setEmptyReason(items.length === 0 ? result.emptyReason : null);
			session.setLoading(false);
		} catch (error) {
			handleSearchError(session, deps, error, token);
		}
	}

	function isSearchActive$1(query) {
		return [...query.trim()].length >= SearchQueryLength.Min;
	}
	async function applyFilters(filters, deps, find) {
		const session = useSessionStore();
		if (!session.isSessionActive()) {
			return;
		}
		session.setFilterFind(find);
		session.setSearchQuery(isSearchActive$1(find) ? find.trim() : '');
		session.setFilters(filters);
		if (isSearchActive$1(session.searchQuery)) {
			await searchItems(session.searchQuery, deps);
			return;
		}
		await restoreBaseFeed(deps);
	}

	const FilterFieldId = Object.freeze({
		Find: 'FIND',
		ObjectType: 'OBJECT_TYPE_FILTER',
		FileType: 'FILE_TYPE_FILTERS'
	});
	const MAX_FIND_LENGTH = 255;
	function limitFind(value) {
		if (!main_core.Type.isStringFilled(value)) {
			return '';
		}
		return [...value.trim()].slice(0, MAX_FIND_LENGTH).join('');
	}
	function readObjectType(raw) {
		const value = raw[FilterFieldId.ObjectType];
		return main_core.Type.isStringFilled(value) ? value : ObjectTypeFilter.All;
	}
	function readFileTypes(raw) {
		const value = raw[FilterFieldId.FileType];
		const aliases = main_core.Type.isArray(value) ? value : main_core.Type.isPlainObject(value) ? Object.values(value) : [];
		return aliases.filter(alias => main_core.Type.isStringFilled(alias));
	}
	function normalizeFilterValues(raw) {
		const source = main_core.Type.isPlainObject(raw) ? raw : {};
		const find = limitFind(source[FilterFieldId.Find]);
		let objectTypeFilter = readObjectType(source);
		let fileTypeFilters = readFileTypes(source);
		const isObjectTypeKnown = OBJECT_TYPE_FILTERS.includes(objectTypeFilter);
		const areFileTypesKnown = fileTypeFilters.every(alias => FILE_TYPE_ALIASES.includes(alias));
		if (!isObjectTypeKnown || !areFileTypesKnown) {
			objectTypeFilter = ObjectTypeFilter.All;
			fileTypeFilters = [];
		} else if (objectTypeFilter === ObjectTypeFilter.Folders && fileTypeFilters.length > 0) {
			fileTypeFilters = [];
		}
		return {
			find,
			objectTypeFilter: objectTypeFilter,
			fileTypeFilters: fileTypeFilters
		};
	}
	function isChanged(raw, normalized) {
		const rawFind = main_core.Type.isStringFilled(raw[FilterFieldId.Find]) ? raw[FilterFieldId.Find] : '';
		const rawObjectType = readObjectType(raw);
		const rawFileTypes = readFileTypes(raw);
		return rawFind !== normalized.find || rawObjectType !== normalized.objectTypeFilter || rawFileTypes.length !== normalized.fileTypeFilters.length || rawFileTypes.some((alias, index) => alias !== normalized.fileTypeFilters[index]);
	}
	function writeBack(filter, normalized) {
		try {
			const api = main_core.Type.isFunction(filter.getApi) ? filter.getApi() : null;
			if (api && main_core.Type.isFunction(api.setFields)) {
				api.setFields({
					[FilterFieldId.Find]: normalized.find,
					[FilterFieldId.ObjectType]: normalized.objectTypeFilter,
					[FilterFieldId.FileType]: normalized.fileTypeFilters
				});
				if (main_core.Type.isFunction(api.apply)) {
					api.apply();
				}
			}
		} catch (error) {
			console.error('DiskPicker: failed to write normalized filter values back', error);
		}
	}
	function applyFindSuppressed(filter, value) {
		try {
			const api = main_core.Type.isFunction(filter?.getApi) ? filter.getApi() : null;
			if (api && main_core.Type.isFunction(api.setFields)) {
				const current = main_core.Type.isFunction(filter.getFilterFieldsValues) ? filter.getFilterFieldsValues() : {};
				if ((current[FilterFieldId.Find] ?? '') === value) {
					return;
				}
				api.setFields({
					...current,
					[FilterFieldId.Find]: value
				});
				if (main_core.Type.isFunction(api.apply)) {
					api.apply();
				}
			}
		} catch (error) {
			console.error('DiskPicker: failed to set filter FIND', error);
		}
	}
	function resetInitialFilterValues(filter) {
		try {
			const api = main_core.Type.isFunction(filter?.getApi) ? filter.getApi() : null;
			if (!api || !main_core.Type.isFunction(api.setFields)) {
				return false;
			}
			api.setFields({
				[FilterFieldId.Find]: '',
				[FilterFieldId.ObjectType]: ObjectTypeFilter.All,
				[FilterFieldId.FileType]: []
			});
			return true;
		} catch (error) {
			console.error('DiskPicker: failed to reset initial filter values', error);
			return false;
		}
	}
	function readInitialFilterValues(filter) {
		const raw = main_core.Type.isFunction(filter?.getFilterFieldsValues) ? filter.getFilterFieldsValues() : {};
		const normalized = normalizeFilterValues(raw);
		if (isChanged(raw, normalized)) {
			writeBack(filter, normalized);
		}
		return normalized;
	}

	const APPLY_EVENT = 'BX.Main.Filter:apply';
	const BEFORE_APPLY_EVENT = 'BX.Main.Filter:beforeApply';
	const BEFORE_APPLY_DIM_TIMEOUT_MS = 10000;
	const SEARCH_SHOWED_CLASS = 'main-ui-filter-search--showed';
	function getCustomEventBus() {
		const bx = main_core.Reflection.getClass('BX');
		if (bx && main_core.Type.isFunction(bx.addCustomEvent) && main_core.Type.isFunction(bx.removeCustomEvent)) {
			return bx;
		}
		return null;
	}
	function getFilterById(filterId) {
		const manager = main_core.Reflection.getClass('BX.Main.filterManager');
		if (manager && main_core.Type.isFunction(manager.getById)) {
			return manager.getById(filterId) ?? null;
		}
		return null;
	}
	function getSearchContainer(filter) {
		if (!main_core.Type.isFunction(filter.getSearch)) {
			return null;
		}
		const search = filter.getSearch();
		return search && main_core.Type.isFunction(search.getContainer) ? search.getContainer() : null;
	}
	function collectAnimatableAncestors(element) {
		const elements = [];
		let node = element;
		while (node) {
			if (main_core.Type.isFunction(node.getAnimations)) {
				elements.push(node);
			}
			node = node.parentElement;
		}
		return elements;
	}
	function waitSearchAnimationsEnd(container) {
		if (!main_core.Type.isFunction(main_core.Animation?.waitAnimationEnd)) {
			return Promise.resolve([]);
		}
		return Promise.all(collectAnimatableAncestors(container).map(element => main_core.Animation.waitAnimationEnd(element)));
	}
	function isPopupShown(popup) {
		return Boolean(popup && main_core.Type.isFunction(popup.isShown) && popup.isShown());
	}
	function filtersDiffer(a, b) {
		return a.objectTypeFilter !== b.objectTypeFilter || a.fileTypeFilters.length !== b.fileTypeFilters.length || a.fileTypeFilters.some((alias, index) => alias !== b.fileTypeFilters[index]);
	}
	class MainUiFilterAdapter {
		#filterId;
		#pinia;
		#deps;
		#bus = null;
		#handler = null;
		#beforeApplyHandler = null;
		#dimmedBeforeApply = false;
		#dimTimeoutTimer = null;
		#unsubscribeSession = null;
		#debounceTimer = null;
		#showPopupTimer = null;
		#showPopupGeneration = 0;
		#suppressing = false;
		#previous;
		constructor(filterId, pinia, deps, initial) {
			this.#filterId = filterId;
			this.#pinia = pinia;
			this.#deps = deps;
			this.#previous = cloneValues(initial);
		}
		subscribe() {
			if (!this.#unsubscribeSession) {
				const session = useSessionStore(this.#pinia);
				let previousSearchOpen = session.searchOpen;
				this.#unsubscribeSession = session.$subscribe((_mutation, state) => {
					const searchCollapsed = previousSearchOpen && !state.searchOpen;
					const searchExpanded = !previousSearchOpen && state.searchOpen;
					previousSearchOpen = state.searchOpen;
					if (searchCollapsed) {
						this.#cancelScheduledShowPopup();
						this.#closePopup();
					} else if (searchExpanded) {
						this.#scheduleShowPopup();
					}
				}, {
					flush: 'sync'
				});
			}
			const bus = getCustomEventBus();
			if (!bus || this.#handler) {
				return;
			}
			this.#bus = bus;
			this.#beforeApplyHandler = filterId => {
				if (filterId !== this.#filterId || this.#suppressing) {
					return;
				}
				this.#dimBeforeApply();
			};
			bus.addCustomEvent(window, BEFORE_APPLY_EVENT, this.#beforeApplyHandler);
			this.#handler = filterId => {
				if (filterId !== this.#filterId || this.#suppressing) {
					return;
				}
				this.#cancelScheduledShowPopup();
				if (this.#filtersChanged() || this.#dimmedBeforeApply) {
					this.#cancelScheduledProcess();
					this.#process();
					return;
				}
				this.#scheduleProcess();
			};
			bus.addCustomEvent(window, APPLY_EVENT, this.#handler);
		}
		#dimBeforeApply() {
			const session = useSessionStore(this.#pinia);
			if (!session.isSessionActive() || session.contentLoading || session.contentError !== null) {
				return;
			}
			const count = useItemStore(this.#pinia).count;
			if (count === 0) {
				return;
			}
			session.setPreserveContentOnLoading(true);
			session.setLoading(true);
			this.#dimmedBeforeApply = true;
			this.#cancelDimTimeout();
			this.#dimTimeoutTimer = setTimeout(() => {
				this.#dimTimeoutTimer = null;
				this.#undimBeforeApply();
			}, BEFORE_APPLY_DIM_TIMEOUT_MS);
		}
		#undimBeforeApply() {
			this.#cancelDimTimeout();
			if (!this.#dimmedBeforeApply) {
				return;
			}
			this.#dimmedBeforeApply = false;
			useSessionStore(this.#pinia).setLoading(false);
		}
		#cancelDimTimeout() {
			if (this.#dimTimeoutTimer !== null) {
				clearTimeout(this.#dimTimeoutTimer);
				this.#dimTimeoutTimer = null;
			}
		}
		dispose() {
			this.#cancelScheduledProcess();
			this.#cancelScheduledShowPopup();
			if (this.#bus && this.#handler) {
				this.#bus.removeCustomEvent(window, APPLY_EVENT, this.#handler);
			}
			if (this.#bus && this.#beforeApplyHandler) {
				this.#bus.removeCustomEvent(window, BEFORE_APPLY_EVENT, this.#beforeApplyHandler);
			}
			this.#handler = null;
			this.#beforeApplyHandler = null;
			this.#bus = null;
			this.#undimBeforeApply();
			this.#unsubscribeSession?.();
			this.#unsubscribeSession = null;
		}
		clearFindSuppressed() {
			const filter = getFilterById(this.#filterId);
			if (!filter) {
				return;
			}
			this.#runSuppressed(() => applyFindSuppressed(filter, ''));
			this.#previous = {
				...this.#previous,
				find: ''
			};
		}
		resetFilters() {
			const filter = getFilterById(this.#filterId);
			if (!filter || !main_core.Type.isFunction(filter.resetFilter)) {
				return;
			}
			try {
				filter.resetFilter();
				this.#process();
			} catch (error) {
				console.error('DiskPicker: failed to reset the standard filter', error);
			}
		}
		#runSuppressed(action) {
			this.#suppressing = true;
			try {
				action();
			} finally {
				setTimeout(() => {
					this.#suppressing = false;
				}, 0);
			}
		}
		#filtersChanged() {
			const filter = getFilterById(this.#filterId);
			if (!filter) {
				return false;
			}
			return filtersDiffer(readInitialFilterValues(filter), this.#previous);
		}
		#cancelScheduledProcess() {
			if (this.#debounceTimer !== null) {
				clearTimeout(this.#debounceTimer);
				this.#debounceTimer = null;
			}
		}
		#scheduleProcess() {
			this.#cancelScheduledProcess();
			this.#debounceTimer = setTimeout(() => {
				this.#debounceTimer = null;
				this.#process();
			}, SEARCH_DEBOUNCE_MS);
		}
		#scheduleShowPopup() {
			this.#cancelScheduledShowPopup();
			this.#showPopupTimer = setTimeout(() => {
				this.#showPopupTimer = null;
				void this.#showPopup();
			}, 0);
		}
		#cancelScheduledShowPopup() {
			this.#showPopupGeneration += 1;
			if (this.#showPopupTimer !== null) {
				clearTimeout(this.#showPopupTimer);
				this.#showPopupTimer = null;
			}
		}
		async #showPopup() {
			const filter = getFilterById(this.#filterId);
			if (!filter || !main_core.Type.isFunction(filter.showPopup)) {
				return;
			}
			const generation = this.#showPopupGeneration;
			try {
				const container = getSearchContainer(filter);
				await waitSearchAnimationsEnd(container);
				if (generation !== this.#showPopupGeneration) {
					return;
				}
				const popup = filter.popup;
				if (!isPopupShown(popup)) {
					filter.showPopup();
					return;
				}
				if (main_core.Dom.hasClass(container, SEARCH_SHOWED_CLASS) || !main_core.Type.isFunction(popup.subscribeOnce)) {
					return;
				}
				popup.subscribeOnce('onAfterClose', () => {
					if (generation === this.#showPopupGeneration) {
						this.#openPopup(filter);
					}
				});
			} catch (error) {
				console.error('DiskPicker: failed to open the standard filter popup', error);
			}
		}
		#openPopup(filter) {
			if (!main_core.Type.isFunction(filter.showPopup)) {
				return;
			}
			try {
				filter.showPopup();
			} catch (error) {
				console.error('DiskPicker: failed to open the standard filter popup', error);
			}
		}
		#closePopup() {
			const filter = getFilterById(this.#filterId);
			if (!filter || !main_core.Type.isFunction(filter.closePopup)) {
				return;
			}
			const container = getSearchContainer(filter);
			if (container && !main_core.Dom.hasClass(container, SEARCH_SHOWED_CLASS)) {
				return;
			}
			const activeBefore = document.activeElement;
			try {
				filter.closePopup();
			} catch (error) {
				console.error('DiskPicker: failed to close the standard filter popup', error);
			}
			this.#restoreFocus(activeBefore);
		}
		#restoreFocus(activeBefore) {
			const active = document.activeElement;
			if (active === activeBefore || !main_core.Type.isElementNode(active)) {
				return;
			}
			if (main_core.Type.isElementNode(activeBefore) && activeBefore !== document.body && activeBefore.isConnected) {
				activeBefore.focus();
				return;
			}
			active.blur();
		}
		#process() {
			const filter = getFilterById(this.#filterId);
			if (!filter) {
				this.#undimBeforeApply();
				return;
			}
			const normalized = readInitialFilterValues(filter);
			const filtersChanged = filtersDiffer(normalized, this.#previous);
			const queryChanged = normalized.find !== this.#previous.find;
			this.#previous = cloneValues(normalized);
			if (!filtersChanged && !queryChanged) {
				this.#undimBeforeApply();
				return;
			}
			ui_vue3_pinia.setActivePinia(this.#pinia);
			if (filtersChanged) {
				this.#dimmedBeforeApply = false;
				this.#cancelDimTimeout();
				void applyFilters({
					objectTypeFilter: normalized.objectTypeFilter,
					fileTypeFilters: [...normalized.fileTypeFilters]
				}, this.#deps, normalized.find);
				return;
			}
			const searchNoop = [...normalized.find.trim()].length < SearchQueryLength.Min && useSessionStore(this.#pinia).searchQuery === '';
			this.#dimmedBeforeApply = this.#dimmedBeforeApply && searchNoop;
			void searchItems(normalized.find, this.#deps);
			this.#undimBeforeApply();
		}
	}
	function cloneValues(values) {
		return {
			find: values.find,
			objectTypeFilter: values.objectTypeFilter,
			fileTypeFilters: [...values.fileTypeFilters]
		};
	}

	const PickerLayout = ui_vue3.defineComponent({
		name: 'DiskPickerLayout',
		computed: {
			isTable() {
				return useSessionStore().viewMode === ViewMode.Table;
			},
			hasContent() {
				const session = useSessionStore();
				return session.contentLoading || session.contentError === null && session.emptyReason === null;
			}
		},
		template: `
		<div
			class="disk-picker-layout --ui-context-content-light"
			:class="{ '--table': isTable, '--no-preview': !hasContent }"
		>
			<div class="disk-picker-layout__sidebar --ui-context-edge-dark">
				<slot name="sidebar"/>
			</div>
			<div class="disk-picker-layout__header --ui-context-edge-dark --air-context-blurred-bg">
				<slot name="header"/>
			</div>
			<div class="disk-picker-layout__workarea">
				<div class="disk-picker-layout__body">
					<div class="disk-picker-layout__list">
						<slot name="list"/>
					</div>
					<div v-if="hasContent" class="disk-picker-layout__preview">
						<slot name="preview"/>
					</div>
				</div>
				<div class="disk-picker-layout__footer">
					<slot name="footer"/>
				</div>
			</div>
		</div>
	`
	});

	const SourceRowSkeleton = ui_vue3.defineComponent({
		name: 'DiskPickerSourceRowSkeleton',
		components: {
			BCircle: ui_system_skeleton_vue.BCircle,
			BLine: ui_system_skeleton_vue.BLine
		},
		props: {
			width: {
				type: Number,
				default: 120
			}
		},
		template: `
		<div class="disk-picker-source-row-skeleton" aria-hidden="true">
			<BCircle :size="24"/>
			<span class="disk-picker-source-row-skeleton__line">
				<BLine :width="width" :height="10" :radius="4"/>
			</span>
		</div>
	`
	});

	const LoadingSkeleton = {
		name: 'DiskPickerLoadingSkeleton',
		components: {
			PickerLayout,
			BLine: ui_system_skeleton_vue.BLine,
			BCircle: ui_system_skeleton_vue.BCircle,
			SourceRowSkeleton
		},
		setup() {
			return {
				sidebarWidths: [120, 130, 126, 110, 122],
				listWidths: [330, 360, 300, 340, 310],
				previewWidths: [240, 172, 115]
			};
		},
		template: `
		<PickerLayout class="disk-picker-skeleton">
			<template #sidebar>
				<SourceRowSkeleton :width="sidebarWidths[0]"/>
				<div class="disk-picker-skeleton__group-title">
					<BLine :width="80" :height="8" :radius="4"/>
				</div>
				<SourceRowSkeleton :width="sidebarWidths[1]"/>
				<div class="disk-picker-skeleton__group-title">
					<BLine :width="80" :height="8" :radius="4"/>
				</div>
				<SourceRowSkeleton
					v-for="width in sidebarWidths.slice(2)"
					:width="width"
				/>
			</template>

			<template #header>
				<span class="--ui-context-edge-dark">
					<BLine :width="120" :height="16" :radius="4"/>
				</span>
				<div class="disk-picker-skeleton__header-actions --ui-context-edge-dark">
					<BLine :width="34" :height="34" :radius="8"/>
					<BLine :width="68" :height="34" :radius="8"/>
				</div>
			</template>

			<template #list>
				<div class="disk-picker-skeleton__group-title --ui-context-edge-dark">
					<BLine :width="72" :height="8" :radius="4"/>
				</div>
				<div class="disk-picker-skeleton__list-rows --ui-context-edge-dark">
					<div
						v-for="width in listWidths"
						class="disk-picker-skeleton__list-row"
					>
						<BCircle :size="24"/>
						<BLine :width="width" :height="10" :radius="4"/>
					</div>
				</div>
			</template>

			<template #preview>
				<div class="disk-picker-skeleton__preview --ui-context-edge-dark">
					<BLine :width="120" :height="120" :radius="16"/>
					<div class="disk-picker-skeleton__preview-lines">
						<BLine
							v-for="width in previewWidths"
							:width="width"
							:height="12"
							:radius="4"
						/>
					</div>
				</div>
			</template>

			<template #footer>
				<div class="disk-picker-skeleton__footer-actions --ui-context-edge-dark">
					<BLine :width="84" :height="38" :radius="8"/>
					<BLine :width="120" :height="38" :radius="8"/>
				</div>
			</template>
		</PickerLayout>
	`
	};

	function requestRunning() {
		const source = useSourceStore();
		return source.sourcesLoading || source.sourcesValidating || source.sourcesLoadingMore;
	}
	function persistSources() {
		const source = useSourceStore();
		if (source.sourcesRevision === null) {
			return;
		}
		setSourceCache({
			sources: source.sources,
			page: source.sourcesPage,
			hasMore: source.sourcesHasMore,
			revision: source.sourcesRevision
		});
	}
	async function loadNextSourcePage() {
		const session = useSessionStore();
		const source = useSourceStore();
		if (!session.isSessionActive() || requestRunning() || !source.sourcesHasMore || source.sourcesRevision === null) {
			return;
		}
		const requestedPage = source.sourcesPage + 1;
		source.setPageError(null);
		source.setLoadingMore(true);
		try {
			const result = await loadInitialStage$1({
				initialStage: {
					type: StageType.Sources,
					storageId: null,
					folderId: null
				},
				filters: {
					objectTypeFilter: ObjectTypeFilter.All,
					fileTypeFilters: []
				},
				allowedFileTypes: session.constraints.allowedFileTypes,
				page: requestedPage,
				pageSize: PageSize.Default,
				signedConfig: session.constraints.signedConfig
			});
			if (!session.isSessionActive()) {
				return;
			}
			if (result.sourceRevision !== source.sourcesRevision) {
				source.setLoadingMore(false);
				await retrySources();
				return;
			}
			if (source.appendPage(result.sources, requestedPage, result.pagination.hasMore, result.sourceRevision)) {
				persistSources();
			}
		} catch (error) {
			const code = pickerErrorCode(error);
			if (code === ErrorCode.InvalidContext) {
				session.invalidateRequests();
				session.callbacks.onContextInvalid();
				return;
			}
			if (session.isSessionActive()) {
				source.setPageError(code);
			}
		} finally {
			if (session.isSessionActive()) {
				source.setLoadingMore(false);
			}
		}
	}
	async function retrySourcePage() {
		useSourceStore().setPageError(null);
		await loadNextSourcePage();
	}

	function switchSource(source, deps) {
		return changeFeed({
			stageType: StageType.Folder,
			storageId: source.storageId,
			folderId: source.folderId
		}, deps);
	}

	const RECENT_FEED = {
		stageType: StageType.Recent,
		storageId: null,
		folderId: null
	};
	async function switchToRecent(deps) {
		const session = useSessionStore();
		const item = useItemStore();
		if (session.isSameFeed(RECENT_FEED)) {
			return;
		}
		releaseNavigationHold();
		const token = session.nextRequestToken();
		session.setLoading(true);
		session.setFeed(RECENT_FEED);
		useSelectionStore().setActive(null);
		deps.suppressFilterFind();
		session.setFilterFind('');
		session.resetSearchQuery();
		item.clear();
		session.setBreadcrumbs([]);
		session.setHasMore(false);
		session.clearContentError();
		try {
			const result = await loadInitialStage$1({
				initialStage: {
					type: StageType.Recent,
					storageId: null,
					folderId: null
				},
				filters: {
					objectTypeFilter: ObjectTypeFilter.All,
					fileTypeFilters: []
				},
				allowedFileTypes: session.constraints.allowedFileTypes,
				page: 1,
				pageSize: PageSize.Recent,
				signedConfig: session.constraints.signedConfig
			});
			if (!session.isCurrentRequest(token)) {
				return;
			}
			session.setBreadcrumbsFromContext(result.context);
			item.setRecentSnapshot(result.items);
			const visible = applyLocalFilters(result.items, session.filters);
			item.replace(visible);
			useSelectionStore().pruneActive(visible.map(entry => entry.objectId));
			session.setHasMore(result.pagination.hasMore);
			session.setEmptyReason(visible.length === 0 ? 'empty' : null);
			session.setLoading(false);
		} catch (error) {
			const code = pickerErrorCode(error);
			if (code === ErrorCode.InvalidContext) {
				session.invalidateRequests();
				deps.onContextInvalid();
				return;
			}
			if (!session.isCurrentRequest(token)) {
				return;
			}
			session.setContentError(code);
			session.setLoading(false);
		}
	}

	const FOCUSABLE_SELECTOR = ['a[href]:not([disabled])', 'button:not([disabled])', 'input:not([disabled])', 'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"]):not([disabled])'].join(',');
	function resolveCompositeNavigationIndex(currentIndex, itemCount, key, pageSize) {
		if (itemCount === 0) {
			return -1;
		}
		const lastIndex = itemCount - 1;
		const current = Math.min(Math.max(currentIndex, 0), lastIndex);
		const page = Math.max(1, pageSize);
		switch (key) {
			case 'ArrowDown':
			case 'ArrowRight':
				return Math.min(current + 1, lastIndex);
			case 'ArrowUp':
			case 'ArrowLeft':
				return Math.max(current - 1, 0);
			case 'Home':
				return 0;
			case 'End':
				return lastIndex;
			case 'PageDown':
				return Math.min(current + page, lastIndex);
			case 'PageUp':
				return Math.max(current - page, 0);
			default:
				return current;
		}
	}
	function resolveFallbackId(ids, preferredId, previousIndex) {
		if (ids.length === 0) {
			return null;
		}
		if (preferredId !== null && ids.includes(preferredId)) {
			return preferredId;
		}
		if (previousIndex < 0) {
			return ids[0];
		}
		return ids[Math.min(previousIndex, ids.length - 1)];
	}
	function takeCurrentFocus(pending, version) {
		return pending !== null && pending.version === version ? pending : null;
	}
	function scrollOffsetForEntry(entryTop, entryHeight, scrollTop, viewportHeight) {
		if (entryTop < scrollTop) {
			return entryTop;
		}
		const entryBottom = entryTop + entryHeight;
		if (entryBottom > scrollTop + viewportHeight) {
			return Math.max(0, entryBottom - viewportHeight);
		}
		return scrollTop;
	}
	function focusCompositeItem(root, id) {
		const item = root.querySelector(`[data-composite-id="${String(id)}"]`);
		item?.focus();
		return item !== null;
	}
	function listFocusableControls(root) {
		return [...root.querySelectorAll(FOCUSABLE_SELECTOR)].filter(element => element.offsetParent !== null || element === document.activeElement);
	}
	function isTextEntryTarget(target) {
		return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
	}
	function moveHorizontalFocus(root, key) {
		const controls = listFocusableControls(root);
		const currentIndex = controls.indexOf(document.activeElement);
		if (currentIndex < 0) {
			return false;
		}
		const nextIndex = resolveCompositeNavigationIndex(currentIndex, controls.length, key, 1);
		controls[nextIndex]?.focus();
		return true;
	}

	const METRIC_PROPERTIES = {
		listRow: '--disk-picker-list-row-advance',
		groupTitle: '--disk-picker-group-title-advance',
		tableRow: '--disk-picker-table-row-advance',
		sourceRow: '--disk-picker-source-row-advance',
		sourceGroup: '--disk-picker-source-group-advance'
	};
	const DEFAULT_METRICS = {
		listRow: 48,
		groupTitle: 36,
		tableRow: 48,
		sourceRow: 48,
		sourceGroup: 46
	};
	function readLength(style, property, fallback) {
		const value = Number.parseFloat(style.getPropertyValue(property));
		return Number.isFinite(value) && value > 0 ? value : fallback;
	}
	function readMetrics(element) {
		const layout = element?.closest('.disk-picker-layout');
		if (!layout) {
			return {
				...DEFAULT_METRICS
			};
		}
		const style = getComputedStyle(layout);
		return {
			listRow: readLength(style, METRIC_PROPERTIES.listRow, DEFAULT_METRICS.listRow),
			groupTitle: readLength(style, METRIC_PROPERTIES.groupTitle, DEFAULT_METRICS.groupTitle),
			tableRow: readLength(style, METRIC_PROPERTIES.tableRow, DEFAULT_METRICS.tableRow),
			sourceRow: readLength(style, METRIC_PROPERTIES.sourceRow, DEFAULT_METRICS.sourceRow),
			sourceGroup: readLength(style, METRIC_PROPERTIES.sourceGroup, DEFAULT_METRICS.sourceGroup)
		};
	}

	const TINT_COUNT = 4;
	function resolveAvatarTint(storageId) {
		return Math.abs(storageId) % TINT_COUNT + 1;
	}
	const INITIAL_SYMBOL_PATTERN = /[\p{L}\p{N} ]/u;
	function resolveAvatarInitials(title) {
		const words = title.split(/[\s,]/).filter(word => INITIAL_SYMBOL_PATTERN.test(word.charAt(0)));
		if (words.length === 0) {
			return '';
		}
		const initials = words.length > 1 ? words[0].charAt(0) + words[1].charAt(0) : words[0].charAt(0);
		return initials.toUpperCase();
	}

	const SOURCE_VIEWPORT_HEIGHT = 640;
	const SOURCE_OVERSCAN = 200;
	const SOURCE_PAGINATION_ROOT_MARGIN = '120px 0px';
	const SOURCE_SKELETON_WIDTHS = Object.freeze([126, 110, 122]);
	const RETRY_KEY = 'retry';
	const VERTICAL_KEYS$1 = ['ArrowDown', 'ArrowUp', 'Home', 'End', 'PageDown', 'PageUp'];
	function sourceWindow(entries, scrollTop) {
		const firstOffset = Math.max(0, scrollTop - SOURCE_OVERSCAN);
		const lastOffset = scrollTop + SOURCE_VIEWPORT_HEIGHT + SOURCE_OVERSCAN;
		const first = entries.findIndex(entry => entry.top + entry.height > firstOffset);
		const start = first < 0 ? entries.length : first;
		let end = start;
		while (end < entries.length && entries[end].top < lastOffset) {
			end += 1;
		}
		const totalHeight = entries.length === 0 ? 0 : entries[entries.length - 1].top + entries[entries.length - 1].height;
		return {
			entries: entries.slice(start, end),
			top: entries[start]?.top ?? totalHeight,
			bottom: Math.max(0, totalHeight - (entries[end - 1]?.top ?? 0) - (entries[end - 1]?.height ?? 0))
		};
	}
	const SourceSidebar = ui_vue3.defineComponent({
		name: 'DiskPickerSourceSidebar',
		components: {
			Avatar: ui_vue3_components_avatar.Avatar,
			BIcon: ui_iconSet_api_vue.BIcon,
			Text3Xs: ui_system_typography_vue.Text3Xs,
			TextSm: ui_system_typography_vue.TextSm,
			TextXs: ui_system_typography_vue.TextXs,
			SourceRowSkeleton
		},
		setup() {
			return {
				recentIcon: ui_iconSet_api_vue.Solid.CLOCK,
				personalIcon: ui_iconSet_api_vue.Solid.STORAGE
			};
		},
		data() {
			return {
				focusedSourceKey: null,
				scrollTop: 0,
				pendingScrollTop: 0,
				scrollFrame: null,
				sourcePaginationObserver: null,
				metrics: {
					...DEFAULT_METRICS
				}
			};
		},
		mounted() {
			this.metrics = readMetrics(this.$el);
			this.sourcePaginationObserver = new IntersectionObserver(entries => {
				if (entries.some(entry => entry.isIntersecting)) {
					void loadNextSourcePage();
				}
			}, {
				root: this.$refs.sourceScroll,
				rootMargin: SOURCE_PAGINATION_ROOT_MARGIN
			});
			this.observeSourceSentinel();
		},
		computed: {
			isRecentActive() {
				return useSessionStore().stageType === StageType.Recent;
			},
			error() {
				return useSourceStore().sourcesError;
			},
			loading() {
				return useSourceStore().sourcesLoading;
			},
			loadingMore() {
				return useSourceStore().sourcesLoadingMore;
			},
			pageError() {
				return useSourceStore().sourcesPageError;
			},
			hasMore() {
				return useSourceStore().sourcesHasMore;
			},
			skeletonWidths() {
				return SOURCE_SKELETON_WIDTHS;
			},
			sourceCount() {
				return useSourceStore().sources.length;
			},
			activeStorageId() {
				return useSessionStore().storageId;
			},
			personal() {
				return useSourceStore().sources.filter(source => source.storageType === StorageType.User);
			},
			groups() {
				const sources = useSourceStore().sources;
				return [{
					titleKey: 'DISK_PICKER_SOURCE_GROUP_COMPANY',
					shortTitleKey: 'DISK_PICKER_SOURCE_GROUP_COMPANY_SHORT',
					sources: sources.filter(source => source.storageType === StorageType.Common)
				}, {
					titleKey: 'DISK_PICKER_SOURCE_GROUP_GROUPS',
					shortTitleKey: 'DISK_PICKER_SOURCE_GROUP_GROUPS_SHORT',
					sources: sources.filter(source => source.storageType === StorageType.Group || source.storageType === StorageType.Project)
				}, {
					titleKey: 'DISK_PICKER_SOURCE_GROUP_COLLABS',
					shortTitleKey: 'DISK_PICKER_SOURCE_GROUP_COLLABS_SHORT',
					sources: sources.filter(source => source.storageType === StorageType.Collab)
				}].filter(group => group.sources.length > 0);
			},
			sourceEntries() {
				const entries = [];
				let top = 0;
				const addSource = source => {
					entries.push({
						key: `source-${source.storageId}`,
						type: 'source',
						titleKey: '',
						shortTitleKey: '',
						source,
						top,
						height: this.metrics.sourceRow
					});
					top += this.metrics.sourceRow;
				};
				this.personal.forEach(source => addSource(source));
				this.groups.forEach(group => {
					entries.push({
						key: `group-${group.titleKey}`,
						type: 'group',
						titleKey: group.titleKey,
						shortTitleKey: group.shortTitleKey,
						source: null,
						top,
						height: this.metrics.sourceGroup
					});
					top += this.metrics.sourceGroup;
					group.sources.forEach(source => addSource(source));
				});
				return entries;
			},
			visibleSourceEntries() {
				return sourceWindow(this.sourceEntries, Math.max(0, this.scrollTop - this.metrics.sourceRow));
			},
			sourceNavigationKeys() {
				const keys = ['recent', ...this.sourceEntries.filter(entry => entry.type === 'source').map(entry => entry.key)];
				if (this.error || this.pageError) {
					keys.push(RETRY_KEY);
				}
				return keys;
			},
			sourceFocusKey() {
				if (this.focusedSourceKey && this.sourceNavigationKeys.includes(this.focusedSourceKey)) {
					return this.focusedSourceKey;
				}
				const activeKey = this.activeStorageId === null ? 'recent' : `source-${this.activeStorageId}`;
				return this.sourceNavigationKeys.includes(activeKey) ? activeKey : 'recent';
			}
		},
		watch: {
			sourceCount() {
				this.$nextTick(() => this.revealActiveSource());
				this.$nextTick(() => this.observeSourceSentinel());
			},
			hasMore() {
				this.$nextTick(() => this.observeSourceSentinel());
			},
			loadingMore() {
				this.$nextTick(() => this.observeSourceSentinel());
			},
			pageError() {
				this.$nextTick(() => this.observeSourceSentinel());
			},
			activeStorageId() {
				this.$nextTick(() => this.revealActiveSource());
			},
			sourceNavigationKeys(keys, previousKeys) {
				const focusedKey = this.focusedSourceKey;
				if (focusedKey === null || keys.includes(focusedKey)) {
					return;
				}
				const root = this.$el;
				const active = document.activeElement;
				if (!root || !(active === document.body || root.contains(active))) {
					return;
				}
				const fallbackKey = resolveFallbackId(keys, null, previousKeys.indexOf(focusedKey));
				this.$nextTick(() => this.moveFocusTo(fallbackKey));
			}
		},
		methods: {
			loc(messageCode) {
				return main_core.Loc.getMessage(messageCode) ?? '';
			},
			avatarType(source) {
				return source.storageType === StorageType.Collab ? 'hexagon-guest' : 'round';
			},
			avatarKey(source) {
				return `${source.storageId}:${this.avatarType(source)}:${source.avatarUrl ?? ''}`;
			},
			avatarOptions(source) {
				return {
					title: source.title,
					picPath: source.avatarUrl ?? undefined,
					size: 28
				};
			},
			isPersonalSource(source) {
				return source.storageType === StorageType.User;
			},
			hasLetterAvatar(source) {
				return source.avatarUrl === null && source.storageType !== StorageType.Collab;
			},
			letterAvatarClass(source) {
				return `--tint-${resolveAvatarTint(source.storageId)}`;
			},
			sourceInitials(source) {
				return resolveAvatarInitials(source.title);
			},
			isActive(source) {
				return useSessionStore().storageId === source.storageId;
			},
			handleSelect(source) {
				void switchSource(source, useSessionStore().callbacks);
			},
			handleSelectRecent() {
				void switchToRecent(useSessionStore().callbacks);
			},
			handleScroll(event) {
				this.pendingScrollTop = event.target.scrollTop;
				if (this.scrollFrame !== null) {
					return;
				}
				this.scrollFrame = requestAnimationFrame(() => {
					this.scrollTop = this.pendingScrollTop;
					this.scrollFrame = null;
				});
			},
			handleCompositeFocus(event) {
				const target = event.target.closest('[data-composite-id]');
				if (target) {
					this.focusedSourceKey = target.dataset.compositeId ?? null;
				}
			},
			handleCompositeKeydown(event) {
				if (!VERTICAL_KEYS$1.includes(event.key)) {
					return;
				}
				const target = event.target.closest('[data-composite-id]');
				const currentKey = target?.dataset.compositeId ?? '';
				const currentIndex = this.sourceNavigationKeys.indexOf(currentKey);
				if (currentIndex < 0) {
					return;
				}
				event.preventDefault();
				const scroll = this.$refs.sourceScroll;
				const metrics = this.metrics ?? DEFAULT_METRICS;
				const pageSize = Math.max(1, Math.floor((scroll.clientHeight || SOURCE_VIEWPORT_HEIGHT) / metrics.sourceRow));
				const nextIndex = resolveCompositeNavigationIndex(currentIndex, this.sourceNavigationKeys.length, event.key, pageSize);
				this.moveFocusTo(this.sourceNavigationKeys[nextIndex]);
			},
			focusEntry() {
				if (!this.$refs.sourceScroll) {
					return false;
				}
				this.moveFocusTo(this.sourceFocusKey);
				return true;
			},
			moveFocusTo(key) {
				const scroll = this.$refs.sourceScroll;
				const viewportHeight = scroll.clientHeight || SOURCE_VIEWPORT_HEIGHT;
				const metrics = this.metrics ?? DEFAULT_METRICS;
				const entry = this.sourceEntries.find(sourceEntry => sourceEntry.key === key);
				const entryTop = key === 'recent' ? 0 : metrics.sourceRow + (entry?.top ?? 0);
				const nextScrollTop = key === RETRY_KEY ? Math.max(0, scroll.scrollHeight - viewportHeight) : scrollOffsetForEntry(entryTop, metrics.sourceRow, scroll.scrollTop, viewportHeight);
				this.focusedSourceKey = key;
				scroll.scrollTop = nextScrollTop;
				this.scrollTop = nextScrollTop;
				this.pendingScrollTop = nextScrollTop;
				this.$nextTick(() => focusCompositeItem(scroll, key));
			},
			handleRetrySources() {
				void retrySources();
			},
			handleRetrySourcePage() {
				void retrySourcePage();
			},
			observeSourceSentinel() {
				const sentinel = this.$refs.sourceSentinel;
				this.sourcePaginationObserver?.disconnect();
				if (sentinel) {
					this.sourcePaginationObserver?.observe(sentinel);
				}
			},
			revealActiveSource() {
				const storageId = useSessionStore().storageId;
				if (storageId === null) {
					return;
				}
				const active = this.sourceEntries.find(entry => entry.source?.storageId === storageId);
				const scroll = this.$refs.sourceScroll;
				if (!active || !scroll) {
					return;
				}
				const metrics = this.metrics ?? DEFAULT_METRICS;
				const activeTop = metrics.sourceRow + active.top;
				if (activeTop < scroll.scrollTop || activeTop + active.height > scroll.scrollTop + scroll.clientHeight) {
					scroll.scrollTop = Math.max(0, activeTop - metrics.sourceGroup);
					this.scrollTop = scroll.scrollTop;
					this.pendingScrollTop = scroll.scrollTop;
				}
			}
		},
		beforeUnmount() {
			this.sourcePaginationObserver?.disconnect();
			this.sourcePaginationObserver = null;
			if (this.scrollFrame !== null) {
				cancelAnimationFrame(this.scrollFrame);
				this.scrollFrame = null;
			}
		},
		template: `
		<div
			class="disk-picker-source-sidebar"
			data-disk-picker-group="storage"
			data-testid="universal-disk-picker-sidebar"
		>
			<div
				ref="sourceScroll"
				class="disk-picker-source-sidebar__scroll"
				@focusin="handleCompositeFocus"
				@keydown="handleCompositeKeydown"
				@scroll.passive="handleScroll"
			>
				<button
					type="button"
					class="disk-picker-source-sidebar__item --recent"
					:class="{ '--active': isRecentActive }"
					:title="loc('DISK_PICKER_SOURCE_RECENT')"
					:aria-current="isRecentActive ? 'page' : null"
					:tabindex="sourceFocusKey === 'recent' ? 0 : -1"
					data-composite-id="recent"
					data-testid="universal-disk-picker-source-recent"
					@click="handleSelectRecent"
				>
					<span
						class="disk-picker-source-sidebar__icon-avatar --recent --ui-context-content-light"
						aria-hidden="true"
					>
						<BIcon :name="recentIcon" :size="20"/>
					</span>
					<TextSm class="disk-picker-source-sidebar__name">{{ loc('DISK_PICKER_SOURCE_RECENT') }}</TextSm>
				</button>
				<div
					v-if="loading && sourceCount === 0"
					class="disk-picker-source-sidebar__skeleton"
					data-testid="universal-disk-picker-source-skeleton"
				>
					<SourceRowSkeleton
						v-for="(width, index) in skeletonWidths"
						:key="index"
						:width="width"
					/>
				</div>
				<div v-else-if="error" class="disk-picker-source-sidebar__error">
					<TextXs>{{ loc('DISK_PICKER_SOURCE_LOAD_FAILED') }}</TextXs>
					<button
						type="button"
						class="disk-picker-source-sidebar__retry"
						:disabled="loading"
						:tabindex="sourceFocusKey === 'retry' ? 0 : -1"
						data-composite-id="retry"
						data-testid="universal-disk-picker-sources-retry"
						@click="handleRetrySources"
					>
						<TextXs>{{ loc('DISK_PICKER_RETRY') }}</TextXs>
					</button>
				</div>
				<template v-else>
					<div
						class="disk-picker-source-sidebar__spacer"
						:style="{ height: visibleSourceEntries.top + 'px' }"
						aria-hidden="true"
					></div>
					<template v-for="entry in visibleSourceEntries.entries" :key="entry.key">
						<TextXs
							v-if="entry.type === 'group'"
							class="disk-picker-source-sidebar__group-title"
						><span class="disk-picker-source-sidebar__group-title-full">{{ loc(entry.titleKey) }}</span><span
							class="disk-picker-source-sidebar__group-title-short"
						>{{ loc(entry.shortTitleKey) }}</span></TextXs>
						<button
							v-else
							type="button"
							class="disk-picker-source-sidebar__item"
							:class="{ '--active': isActive(entry.source) }"
							:title="entry.source.title"
							:aria-current="isActive(entry.source) ? 'page' : null"
							:tabindex="sourceFocusKey === entry.key ? 0 : -1"
							:data-composite-id="entry.key"
							:data-testid="'universal-disk-picker-source-' + entry.source.storageId"
							@click="handleSelect(entry.source)"
						>
							<span
								class="disk-picker-source-sidebar__avatar --ui-context-content-light"
								:data-testid="'universal-disk-picker-source-' + entry.source.storageId + '-avatar'"
								aria-hidden="true"
							>
								<span
									v-if="isPersonalSource(entry.source)"
									class="disk-picker-source-sidebar__icon-avatar --personal"
								>
									<BIcon :name="personalIcon" :size="20"/>
								</span>
								<span
									v-else-if="hasLetterAvatar(entry.source)"
									class="disk-picker-source-sidebar__icon-avatar"
									:class="letterAvatarClass(entry.source)"
								>
									<Text3Xs
										accent
										class="disk-picker-source-sidebar__initials"
									>{{ sourceInitials(entry.source) }}</Text3Xs>
								</span>
								<Avatar
									v-else
									:key="avatarKey(entry.source)"
									:type="avatarType(entry.source)"
									:options="avatarOptions(entry.source)"
								/>
							</span>
							<TextSm class="disk-picker-source-sidebar__name">{{ entry.source.title }}</TextSm>
						</button>
					</template>
					<div
						class="disk-picker-source-sidebar__spacer"
						:style="{ height: visibleSourceEntries.bottom + 'px' }"
						aria-hidden="true"
					></div>
					<div
						v-if="loadingMore"
						class="disk-picker-source-sidebar__skeleton"
						data-testid="universal-disk-picker-source-more-skeleton"
					>
						<SourceRowSkeleton
							v-for="(width, index) in skeletonWidths"
							:key="index"
							:width="width"
						/>
					</div>
					<div v-else-if="pageError" class="disk-picker-source-sidebar__error --page">
						<button
							type="button"
							class="disk-picker-source-sidebar__retry"
							:tabindex="sourceFocusKey === 'retry' ? 0 : -1"
							data-composite-id="retry"
							data-testid="universal-disk-picker-source-page-retry"
							@click="handleRetrySourcePage"
						>
							<TextXs>{{ loc('DISK_PICKER_RETRY') }}</TextXs>
						</button>
					</div>
					<div
						v-if="hasMore && !pageError"
						ref="sourceSentinel"
						class="disk-picker-source-sidebar__sentinel"
						data-testid="universal-disk-picker-source-sentinel"
						aria-hidden="true"
					></div>
				</template>
			</div>
		</div>
	`
	});

	const Breadcrumbs = ui_vue3.defineComponent({
		name: 'DiskPickerBreadcrumbs',
		components: {
			HeadlineSm: ui_system_typography_vue.HeadlineSm,
			TextSm: ui_system_typography_vue.TextSm
		},
		computed: {
			crumbs() {
				return useSessionStore().breadcrumbs;
			},
			rootCrumb() {
				return this.crumbs.length > 3 ? this.crumbs[0] : null;
			},
			hiddenCrumbs() {
				return this.crumbs.length > 3 ? this.crumbs.slice(1, -2) : [];
			},
			overflowCrumb() {
				return this.hiddenCrumbs.length > 0 ? this.hiddenCrumbs[this.hiddenCrumbs.length - 1] : null;
			},
			linkCrumbs() {
				if (this.crumbs.length > 3) {
					return [this.crumbs[this.crumbs.length - 2]];
				}
				return this.crumbs.slice(0, -1);
			},
			current() {
				return this.crumbs.length > 0 ? this.crumbs[this.crumbs.length - 1] : null;
			},
			hasPath() {
				return this.crumbs.length > 1;
			},
			currentTypography() {
				return this.hasPath ? 'TextSm' : 'HeadlineSm';
			}
		},
		methods: {
			loc(messageCode, replacements) {
				return main_core.Loc.getMessage(messageCode, replacements) ?? '';
			},
			navigateLabel(crumb) {
				return this.loc('DISK_PICKER_BREADCRUMB_NAVIGATE', {
					'#NAME#': crumb.name
				});
			},
			handleAncestor(crumb, event) {
				const keyboardActivated = event === undefined || event.detail === 0;
				if (keyboardActivated && event?.currentTarget instanceof HTMLElement && event.currentTarget === document.activeElement) {
					useSessionStore().requestFocusHandoffToFiles();
				}
				void openBreadcrumb(crumb, useSessionStore().callbacks);
			},
			handleOverflow(event) {
				const closestHiddenCrumb = this.hiddenCrumbs[this.hiddenCrumbs.length - 1];
				if (closestHiddenCrumb) {
					this.handleAncestor(closestHiddenCrumb, event);
				}
			}
		},
		template: `
		<nav class="disk-picker-breadcrumbs" data-testid="universal-disk-picker-breadcrumbs">
			<template v-if="rootCrumb">
				<button
					type="button"
					class="disk-picker-breadcrumbs__link"
					:title="rootCrumb.name"
					:aria-label="navigateLabel(rootCrumb)"
					data-testid="universal-disk-picker-breadcrumb-root"
					@click="handleAncestor(rootCrumb, $event)"
				>
					<TextSm class="disk-picker-breadcrumbs__label">{{ rootCrumb.name }}</TextSm>
				</button>
				<span class="disk-picker-breadcrumbs__separator" aria-hidden="true">&rsaquo;</span>
			</template>
			<template v-if="overflowCrumb">
				<button
					type="button"
					class="disk-picker-breadcrumbs__link disk-picker-breadcrumbs__overflow"
					:title="overflowCrumb.name"
					:aria-label="navigateLabel(overflowCrumb)"
					data-testid="universal-disk-picker-breadcrumb-overflow"
					@click="handleOverflow($event)"
				>&hellip;</button>
				<span class="disk-picker-breadcrumbs__separator" aria-hidden="true">&rsaquo;</span>
			</template>
			<template v-for="crumb in linkCrumbs" :key="crumb.objectId">
				<button
					type="button"
					class="disk-picker-breadcrumbs__link"
					:title="crumb.name"
					:aria-label="navigateLabel(crumb)"
					data-testid="universal-disk-picker-breadcrumb-link"
					@click="handleAncestor(crumb, $event)"
				>
					<TextSm class="disk-picker-breadcrumbs__label">{{ crumb.name }}</TextSm>
				</button>
				<span class="disk-picker-breadcrumbs__separator" aria-hidden="true">&rsaquo;</span>
			</template>
			<component
				:is="currentTypography"
				v-if="current"
				class="disk-picker-breadcrumbs__current"
				:title="current.name"
			>{{ current.name }}</component>
		</nav>
	`
	});

	const PickerToolbar = ui_vue3.defineComponent({
		name: 'DiskPickerToolbar',
		components: {
			Breadcrumbs,
			HeadlineSm: ui_system_typography_vue.HeadlineSm,
			UiButton: ui_vue3_components_button.Button
		},
		setup() {
			return {
				ViewMode,
				Outline: ui_iconSet_api_vue.Outline,
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize
			};
		},
		data() {
			return {
				lastFocused: null
			};
		},
		computed: {
			viewMode() {
				return useSessionStore().viewMode;
			},
			searchOpen() {
				return useSessionStore().searchOpen;
			},
			hasBreadcrumbs() {
				return useSessionStore().breadcrumbs.length > 0;
			},
			fallbackTitle() {
				const session = useSessionStore();
				if (session.stageType === StageType.Recent) {
					return this.loc('DISK_PICKER_SOURCE_RECENT');
				}
				const source = useSourceStore().sources.find(entry => entry.storageId === session.storageId);
				return source?.title ?? '';
			}
		},
		methods: {
			loc(messageCode) {
				return main_core.Loc.getMessage(messageCode) ?? '';
			},
			setViewMode(mode) {
				useSessionStore().setViewMode(mode);
			},
			viewButtonStyle(mode) {
				return this.viewMode === mode ? ui_vue3_components_button.AirButtonStyle.PLAIN_ACCENT : ui_vue3_components_button.AirButtonStyle.PLAIN_NO_ACCENT;
			},
			openSearch() {
				useSessionStore().setSearchOpen(true);
			},
			handleCompositeFocus(event) {
				this.lastFocused = event.target instanceof HTMLElement ? event.target : null;
			},
			handleCompositeKeydown(event) {
				if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' || isTextEntryTarget(event.target)) {
					return;
				}
				if (moveHorizontalFocus(this.$el, event.key)) {
					event.preventDefault();
				}
			},
			focusEntry() {
				const root = this.$el;
				if (!root || this.searchOpen) {
					return false;
				}
				const controls = listFocusableControls(root);
				const target = this.lastFocused !== null && controls.includes(this.lastFocused) ? this.lastFocused : controls[0];
				target?.focus();
				return target !== undefined;
			}
		},
		template: `
		<div
			class="disk-picker-toolbar"
			data-disk-picker-group="header"
			data-testid="universal-disk-picker-header"
			@focusin="handleCompositeFocus"
			@keydown="handleCompositeKeydown"
		>
			<div class="disk-picker-toolbar__title" :class="{ '--search-open': searchOpen }">
				<Breadcrumbs v-if="hasBreadcrumbs"/>
				<HeadlineSm
					v-else
					class="disk-picker-toolbar__title-text"
					:title="fallbackTitle"
				>{{ fallbackTitle }}</HeadlineSm>
			</div>
			<span v-if="!searchOpen" class="disk-picker-toolbar__search">
				<UiButton
					class="disk-picker-toolbar__button"
					:size="ButtonSize.MEDIUM"
					:style="AirButtonStyle.PLAIN_NO_ACCENT"
					:leftIcon="Outline.SEARCH"
					:aria-label="loc('DISK_PICKER_SEARCH_OPEN')"
					:dataset="{ testid: 'universal-disk-picker-search-btn' }"
					@click="openSearch"
				/>
			</span>
			<div
				v-else
				class="disk-picker-toolbar__search-slot"
				data-disk-picker-search-slot
			></div>
			<div class="disk-picker-toolbar__view-toggle" role="group" :aria-label="loc('DISK_PICKER_VIEW_TOGGLE')">
				<UiButton
					class="disk-picker-toolbar__button"
					:class="{ '--view-active': viewMode === ViewMode.List }"
					:size="ButtonSize.MEDIUM"
					:style="viewButtonStyle(ViewMode.List)"
					:leftIcon="Outline.LIST_VIEWER"
					removeRightCorners
					:aria-pressed="viewMode === ViewMode.List"
					:aria-label="loc('DISK_PICKER_VIEW_LIST')"
					:dataset="{ testid: 'universal-disk-picker-view-list' }"
					@click="setViewMode(ViewMode.List)"
				/>
				<span class="disk-picker-toolbar__view-divider" aria-hidden="true"></span>
				<UiButton
					class="disk-picker-toolbar__button"
					:class="{ '--view-active': viewMode === ViewMode.Table }"
					:size="ButtonSize.MEDIUM"
					:style="viewButtonStyle(ViewMode.Table)"
					:leftIcon="Outline.BULLETED_LIST"
					removeLeftCorners
					:aria-pressed="viewMode === ViewMode.Table"
					:aria-label="loc('DISK_PICKER_VIEW_TABLE')"
					:dataset="{ testid: 'universal-disk-picker-view-table' }"
					@click="setViewMode(ViewMode.Table)"
				/>
			</div>
		</div>
	`
	});

	const MAX_EMPTY_STREAK = 3;
	const DEFAULT_ORDER_INPUT = DEFAULT_ORDER;
	function isSearchActive(session) {
		return [...session.searchQuery.trim()].length >= SearchQueryLength.Min;
	}
	function fetchPage(session, page) {
		if (isSearchActive(session)) {
			return search({
				query: session.searchQuery.trim(),
				storageId: session.stageType === StageType.Folder ? session.storageId : null,
				filters: session.filters,
				allowedFileTypes: session.constraints.allowedFileTypes,
				page,
				pageSize: PageSize.Default,
				signedConfig: session.constraints.signedConfig
			});
		}
		return listChildren({
			storageId: session.storageId,
			folderId: session.folderId,
			filters: session.filters,
			allowedFileTypes: session.constraints.allowedFileTypes,
			order: DEFAULT_ORDER_INPUT,
			page,
			pageSize: PageSize.Default,
			signedConfig: session.constraints.signedConfig
		});
	}
	async function fetchPageOrHandle(deps, session, token, nextPage) {
		try {
			return await fetchPage(session, nextPage);
		} catch (error) {
			if (pickerErrorCode(error) === ErrorCode.InvalidContext) {
				session.invalidateRequests();
				deps.onContextInvalid();
				return null;
			}
			if (session.isCurrentRequest(token)) {
				session.setLoadingMore(false);
				session.setPaginationStalled(true);
			}
			return null;
		}
	}
	async function runNextPage(deps, session, item) {
		session.setLoadingMore(true);
		const token = session.nextRequestToken();
		const nextPage = session.page + 1;
		const result = await fetchPageOrHandle(deps, session, token, nextPage);
		if (result === null || !session.isCurrentRequest(token)) {
			return;
		}
		const added = item.append(result.items);
		session.setPage(nextPage);
		session.setHasMore(result.pagination.hasMore);
		session.setLoadingMore(false);
		if (added > 0) {
			session.setEmptyStreak(0);
			return;
		}
		const streak = session.emptyStreak + 1;
		session.setEmptyStreak(streak);
		if (!result.pagination.hasMore) {
			return;
		}
		if (streak >= MAX_EMPTY_STREAK) {
			session.setPaginationStalled(true);
			return;
		}
		await runNextPage(deps, session, item);
	}
	function loadNextPage(deps) {
		const session = useSessionStore();
		const item = useItemStore();
		if (session.navigationPending || !session.hasMore || session.loadingMore || session.paginationStalled || session.stageType === StageType.Sources && !isSearchActive(session) || session.stageType === StageType.Recent && !isSearchActive(session)) {
			return Promise.resolve();
		}
		return runNextPage(deps, session, item);
	}
	function retryNextPage(deps) {
		const session = useSessionStore();
		session.setPaginationStalled(false);
		return loadNextPage(deps);
	}

	const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;
	const GroupRank = Object.freeze({
		Today: 0,
		Yesterday: 1,
		Previous7Days: 2,
		Previous30Days: 3,
		Month: 4,
		Year: 5,
		NoDate: 6
	});
	const DateGroupKey = Object.freeze({
		Today: 'DISK_PICKER_GROUP_TODAY',
		Yesterday: 'DISK_PICKER_GROUP_YESTERDAY',
		Previous7Days: 'DISK_PICKER_GROUP_PREVIOUS_7_DAYS',
		Previous30Days: 'DISK_PICKER_GROUP_PREVIOUS_30_DAYS',
		NoDate: 'DISK_PICKER_GROUP_NO_DATE'
	});
	function calendarDate(timestampInSeconds) {
		const [year, month, day] = main_date.DateTimeFormat.format('Y-m-d', timestampInSeconds).split('-').map(part => Number(part));
		return {
			year,
			month,
			ordinal: Date.UTC(year, month - 1, day) / DAY_MILLISECONDS
		};
	}
	function relativeGroup(key, rank) {
		return {
			key,
			labelCode: key,
			label: null,
			rank,
			sortValue: 0
		};
	}
	function resolveDateGroup(timestampInSeconds, nowInSeconds) {
		if (!main_core.Type.isNumber(timestampInSeconds)) {
			return relativeGroup(DateGroupKey.NoDate, GroupRank.NoDate);
		}
		const itemDate = calendarDate(timestampInSeconds);
		const currentDate = calendarDate(nowInSeconds);
		const dayDifference = currentDate.ordinal - itemDate.ordinal;
		if (dayDifference <= 0) {
			return relativeGroup(DateGroupKey.Today, GroupRank.Today);
		}
		if (dayDifference === 1) {
			return relativeGroup(DateGroupKey.Yesterday, GroupRank.Yesterday);
		}
		if (dayDifference >= 2 && dayDifference <= 7) {
			return relativeGroup(DateGroupKey.Previous7Days, GroupRank.Previous7Days);
		}
		if (dayDifference >= 8 && dayDifference <= 30) {
			return relativeGroup(DateGroupKey.Previous30Days, GroupRank.Previous30Days);
		}
		if (itemDate.year === currentDate.year) {
			return {
				key: `month:${itemDate.year}-${String(itemDate.month).padStart(2, '0')}`,
				labelCode: null,
				label: main_date.DateTimeFormat.format('f', timestampInSeconds),
				rank: GroupRank.Month,
				sortValue: itemDate.month
			};
		}
		return {
			key: `year:${itemDate.year}`,
			labelCode: null,
			label: String(itemDate.year),
			rank: GroupRank.Year,
			sortValue: itemDate.year
		};
	}
	function compareDateGroups(left, right) {
		return left.rank - right.rank || right.sortValue - left.sortValue;
	}

	const MESSAGE_BY_CODE = Object.freeze({
		[ErrorCode.InvalidFilter]: 'DISK_PICKER_ERROR_INVALID_FILTER',
		[ErrorCode.InvalidOrder]: 'DISK_PICKER_ERROR_INVALID_ORDER',
		[ErrorCode.InvalidQuery]: 'DISK_PICKER_ERROR_INVALID_QUERY',
		[ErrorCode.NotFound]: 'DISK_PICKER_ERROR_NOT_FOUND',
		[ErrorCode.TotalUnavailable]: 'DISK_PICKER_ERROR_TOTAL_UNAVAILABLE',
		[ErrorCode.TooManyItems]: 'DISK_PICKER_ERROR_TOO_MANY_ITEMS'
	});
	const GENERIC_MESSAGE = 'DISK_PICKER_ERROR_GENERIC';
	function errorMessageCode(code) {
		if (code !== null && Object.prototype.hasOwnProperty.call(MESSAGE_BY_CODE, code)) {
			return MESSAGE_BY_CODE[code];
		}
		return GENERIC_MESSAGE;
	}

	const ItemRowSkeleton = ui_vue3.defineComponent({
		name: 'DiskPickerItemRowSkeleton',
		components: {
			BLine: ui_system_skeleton_vue.BLine
		},
		props: {
			width: {
				type: Number,
				default: 220
			}
		},
		template: `
		<div class="disk-picker-item-row-skeleton --ui-context-edge-dark" aria-hidden="true">
			<BLine :width="24" :height="24" :radius="6"/>
			<BLine :width="width" :height="10" :radius="4"/>
		</div>
	`
	});

	const EmptyState = ui_vue3.defineComponent({
		name: 'DiskPickerEmptyState',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			TextSm: ui_system_typography_vue.TextSm,
			UiButton: ui_vue3_components_button.Button
		},
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize
			};
		},
		props: {
			icon: {
				type: String,
				required: true
			},
			graphic: {
				type: String,
				default: ''
			},
			title: {
				type: String,
				required: true
			},
			actionLabel: {
				type: String,
				default: ''
			},
			testId: {
				type: String,
				default: 'universal-disk-picker-empty-state'
			},
			actionTestId: {
				type: String,
				default: 'universal-disk-picker-empty-action'
			}
		},
		emits: ['action'],
		template: `
		<div class="disk-picker-empty-state" :data-testid="testId">
			<span
				v-if="graphic"
				class="disk-picker-empty-state__graphic"
				:class="'--' + graphic"
				aria-hidden="true"
			></span>
			<BIcon v-else :name="icon" :size="48" class="disk-picker-empty-state__icon"/>
			<TextSm class="disk-picker-empty-state__title">{{ title }}</TextSm>
			<UiButton
				v-if="actionLabel"
				class="disk-picker-empty-state__action"
				:size="ButtonSize.MEDIUM"
				:style="AirButtonStyle.OUTLINE_ACCENT_2"
				:text="actionLabel"
				:dataset="{ testid: actionTestId }"
				@click="$emit('action')"
			/>
		</div>
	`
	});

	const PARTIAL_MESSAGE = 'DISK_PICKER_NOTIFY_PARTIAL';
	const CONFIRM_FAILED_MESSAGE = 'DISK_PICKER_NOTIFY_CONFIRM_FAILED';
	const SELECT_LIMIT_MESSAGE = 'DISK_PICKER_NOTIFY_SELECT_LIMIT';
	const BACKEND_MAX_ITEMS = 100;
	function toResultItem(item) {
		return {
			objectId: item.objectId,
			name: item.name,
			size: item.size ?? 0,
			extension: item.extension === null ? null : item.extension.toLowerCase(),
			fileType: item.fileType ?? 'other',
			previewUrl: item.previewUrl,
			sourceTitle: item.sourceTitle,
			parentFolderName: item.parentFolderName,
			editorFileType: item.editorFileType
		};
	}
	function buildResultItems(items) {
		return items.filter(item => !item.isFolder).map(item => toResultItem(item));
	}
	function handleConfirmError(session, deps, error, token) {
		const code = pickerErrorCode(error);
		if (code === ErrorCode.InvalidContext) {
			session.invalidateRequests();
			deps.onContextInvalid();
			return;
		}
		if (!session.isCurrentConfirmation(token)) {
			return;
		}
		session.setConfirming(false);
		if (code === ErrorCode.TooManyItems) {
			deps.notify(SELECT_LIMIT_MESSAGE, {
				'#COUNT#': String(BACKEND_MAX_ITEMS)
			});
			return;
		}
		deps.notify(CONFIRM_FAILED_MESSAGE);
	}
	async function submitSelection(deps) {
		const session = useSessionStore();
		const selection = useSelectionStore();
		if (session.confirming || selection.count === 0) {
			return;
		}
		const objectIds = [...selection.selectedIds];
		session.setConfirming(true);
		const token = session.nextConfirmationToken();
		try {
			const result = await resolveSelection({
				objectIds,
				selectionMode: session.constraints.selectionMode,
				allowedFileTypes: session.constraints.allowedFileTypes,
				signedConfig: session.constraints.signedConfig
			});
			if (!session.isCurrentConfirmation(token)) {
				return;
			}
			session.setConfirming(false);
			const items = buildResultItems(result.items);
			if (items.length === 0) {
				deps.notify(PARTIAL_MESSAGE);
				return;
			}
			if (result.partial) {
				deps.notify(PARTIAL_MESSAGE);
			}
			deps.emitSelection({
				items
			});
		} catch (error) {
			handleConfirmError(session, deps, error, token);
		}
	}
	function confirmItem(item, deps) {
		const session = useSessionStore();
		if (session.confirming || session.contentLoading && session.preserveContentOnLoading) {
			return Promise.resolve();
		}
		if (item.isFolder) {
			return openFolder(item, deps);
		}
		if (!item.selectable) {
			return Promise.resolve();
		}
		if (useSelectionStore().count === 0) {
			toggleFileSelection(item, deps);
		}
		return submitSelection(deps);
	}

	const PREVIEW_PLACEHOLDER_RADIUS = 6;
	const PREVIEW_OBSERVER_OPTIONS = {
		root: null,
		rootMargin: '50px',
		threshold: 0.1
	};
	const DiskIconView = ui_vue3.defineComponent({
		name: 'DiskPickerDiskIcon',
		props: {
			type: {
				type: String,
				default: 'file'
			},
			size: {
				type: Number,
				default: 24
			},
			previewUrl: {
				type: String,
				default: null
			},
			keepPreviewOnFeedChange: {
				type: Boolean,
				default: false
			}
		},
		data() {
			return {
				icon: null,
				previewObserver: null,
				cancelPreviewLoad: null,
				previewImage: null,
				previewPlaceholder: null
			};
		},
		watch: {
			type() {
				this.icon?.setType(this.type);
			},
			size() {
				this.icon?.setSize(this.size);
			},
			previewUrl() {
				this.resetPreview();
				this.observePreview();
			}
		},
		mounted() {
			const icon = ui_vue3.markRaw(new ui_iconSet_api_disk.DiskIcon({
				type: this.type,
				size: this.size,
				previewUrl: null
			}));
			icon.renderOnNode(this.$el);
			main_core.Dom.addClass(this.$el, 'disk-picker-disk-icon');
			this.icon = icon;
			this.observePreview();
		},
		beforeUnmount() {
			this.resetPreview();
			this.icon?.destroy();
			this.icon = null;
		},
		methods: {
			observePreview() {
				const url = this.previewUrl ?? null;
				const node = this.$el;
				if (url === null || !node || this.icon === null) {
					return;
				}
				const observer = new IntersectionObserver(entries => {
					if (!entries.some(entry => entry.isIntersecting)) {
						return;
					}
					this.stopPreviewObserver();
					this.showPreviewPlaceholder();
					this.cancelPreviewLoad = enqueuePreview(url, image => {
						this.cancelPreviewLoad = null;
						if (this.icon === null || this.previewUrl !== url) {
							return;
						}
						main_core.Dom.addClass(image, 'disk-picker-disk-icon__preview');
						main_core.Dom.attr(image, 'alt', '');
						node.append(image);
						main_core.Dom.addClass(node, '--with-preview');
						this.previewImage = image;
					}, () => {
						this.hidePreviewPlaceholder();
					}, this.keepPreviewOnFeedChange);
				}, PREVIEW_OBSERVER_OPTIONS);
				observer.observe(node);
				this.previewObserver = ui_vue3.markRaw(observer);
			},
			showPreviewPlaceholder() {
				const node = this.$el;
				if (!node || this.previewPlaceholder || this.previewImage) {
					return;
				}
				const placeholder = ui_system_skeleton.Line(this.size, this.size, PREVIEW_PLACEHOLDER_RADIUS);
				main_core.Dom.addClass(placeholder, 'disk-picker-disk-icon__placeholder');
				main_core.Dom.addClass(placeholder, '--ui-context-edge-dark');
				node.append(placeholder);
				this.previewPlaceholder = placeholder;
			},
			hidePreviewPlaceholder() {
				this.previewPlaceholder?.remove();
				this.previewPlaceholder = null;
			},
			stopPreviewObserver() {
				this.previewObserver?.disconnect();
				this.previewObserver = null;
			},
			resetPreview() {
				this.stopPreviewObserver();
				this.cancelPreviewLoad?.();
				this.cancelPreviewLoad = null;
				this.previewImage?.remove();
				this.previewImage = null;
				this.hidePreviewPlaceholder();
				main_core.Dom.removeClass(this.$el, '--with-preview');
			}
		},
		template: `
		<span class="disk-picker-disk-icon"></span>
	`
	});

	const LABEL_MESSAGE = 'DISK_PICKER_PREVIEW_OPEN';
	const PreviewButton = ui_vue3.defineComponent({
		name: 'DiskPickerPreviewButton',
		components: {
			UiButton: ui_vue3_components_button.Button
		},
		props: {
			item: {
				type: Object,
				required: true
			},
			tabIndex: {
				type: Number,
				default: -1
			},
			onAccent: {
				type: Boolean,
				default: false
			}
		},
		emits: ['open'],
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		computed: {
			label() {
				return main_core.Loc.getMessage(LABEL_MESSAGE) ?? '';
			},
			buttonTestId() {
				return `universal-disk-picker-preview-btn-${this.item.objectId}`;
			}
		},
		watch: {
			tabIndex() {
				this.syncButton();
			}
		},
		mounted() {
			this.syncButton();
		},
		updated() {
			this.syncButton();
		},
		methods: {
			buttonNode() {
				const root = this.$el;
				return root instanceof HTMLElement ? root.querySelector('button') : null;
			},
			syncButton() {
				void this.$nextTick(() => {
					const button = this.buttonNode();
					if (button === null) {
						return;
					}
					button.tabIndex = this.tabIndex;
					button.setAttribute('aria-label', this.label);
				});
			},
			handleOpen() {
				this.$emit('open', this.buttonNode());
			}
		},
		template: `
		<div
			v-if="item.previewable"
			class="disk-picker-preview-button"
			:title="label"
			@click.stop="handleOpen"
			@dblclick.stop
		>
			<UiButton
				:text="label"
				:size="ButtonSize.SMALL"
				:style="onAccent ? AirButtonStyle.PLAIN : AirButtonStyle.PLAIN_NO_ACCENT"
				:left-icon="Outline.ZOOM_IN"
				collapsed
				:dataset="{ testid: buttonTestId }"
			/>
		</div>
	`
	});

	const ItemRow = ui_vue3.defineComponent({
		name: 'DiskPickerItemRow',
		components: {
			BDiskIcon: DiskIconView,
			PreviewButton,
			TextMd: ui_system_typography_vue.TextMd
		},
		props: {
			item: {
				type: Object,
				required: true
			},
			selected: {
				type: Boolean,
				default: false
			},
			active: {
				type: Boolean,
				default: false
			},
			tabIndex: {
				type: Number,
				default: -1
			}
		},
		computed: {
			disabled() {
				return !this.item.isFolder && !this.item.selectable;
			},
			ariaPressed() {
				return !this.item.isFolder && this.item.selectable ? this.selected : null;
			},
			rowClass() {
				return {
					'--selected': this.selected,
					'--active': this.active
				};
			},
			testId() {
				return `universal-disk-picker-file-row-${this.item.objectId}`;
			}
		},
		methods: {
			handleClick(event) {
				beginClick(this.item, event);
			},
			handleDblclick(event) {
				openPreviewFromDblclick(this.item, event.currentTarget, this.windowContainer());
			},
			handlePreviewOpen(initiator) {
				openPreviewFromButton(this.item, initiator, this.windowContainer());
			},
			windowContainer() {
				return this.$el.closest('.disk-picker');
			},
			handleKeydown(event) {
				if (event.key === ' ' || event.key === 'Spacebar') {
					event.preventDefault();
					toggleFileSelection(this.item, useSessionStore().callbacks);
				} else if (event.key === 'Enter') {
					event.preventDefault();
					void confirmItem(this.item, useSessionStore().callbacks);
				}
			}
		},
		template: `
		<div class="disk-picker-item-row-wrap" :class="rowClass">
			<button
				type="button"
				class="disk-picker-item-row"
				:tabindex="tabIndex"
				:aria-pressed="ariaPressed"
				:aria-disabled="disabled ? 'true' : null"
				:data-composite-id="item.objectId"
				:data-testid="testId"
				@click="handleClick"
				@dblclick="handleDblclick"
				@keydown="handleKeydown"
			>
				<BDiskIcon :type="item.iconType" :size="24" :preview-url="item.previewUrl"/>
				<TextMd class="disk-picker-item-row__name">{{ item.name }}</TextMd>
			</button>
			<PreviewButton
				:item="item"
				:tab-index="tabIndex"
				:class="{ '--ui-context-edge-dark': selected, '--air-context-blurred-bg': selected }"
				:on-accent="selected"
				@open="handlePreviewOpen"
			/>
		</div>
	`
	});

	function formatDate(timestampInSeconds) {
		if (!main_core.Type.isNumber(timestampInSeconds)) {
			return '';
		}
		return main_date.DateTimeFormat.format(main_date.DateTimeFormat.getFormat('FORMAT_DATE'), timestampInSeconds);
	}
	function formatRelativeDate(timestampInSeconds, todayText, nowInSeconds) {
		const dayKey = timestamp => main_date.DateTimeFormat.format('Y-m-d', timestamp);
		if (dayKey(timestampInSeconds) === dayKey(nowInSeconds)) {
			return todayText;
		}
		if (main_date.DateTimeFormat.format('Y', timestampInSeconds) === main_date.DateTimeFormat.format('Y', nowInSeconds)) {
			return main_date.DateTimeFormat.format(main_date.DateTimeFormat.getFormat('DAY_MONTH_FORMAT'), timestampInSeconds);
		}
		return formatDate(timestampInSeconds);
	}
	function formatTableDate(timestampInSeconds, todayText, nowInSeconds = Math.floor(Date.now() / 1000)) {
		if (!main_core.Type.isNumber(timestampInSeconds)) {
			return '';
		}
		return formatRelativeDate(timestampInSeconds, todayText, nowInSeconds);
	}

	const UNIT_MESSAGE_KEYS = Object.freeze(['DISK_PICKER_SIZE_UNIT_BYTES', 'DISK_PICKER_SIZE_UNIT_KB', 'DISK_PICKER_SIZE_UNIT_MB', 'DISK_PICKER_SIZE_UNIT_GB', 'DISK_PICKER_SIZE_UNIT_TB']);
	const STEP = 1024;
	const DECIMAL_SEPARATOR = ',';
	function formatNumber(value, fractionDigits) {
		return value.toFixed(fractionDigits).replace('.', DECIMAL_SEPARATOR);
	}
	function formatSize(bytes) {
		if (!main_core.Type.isNumber(bytes) || bytes < 0) {
			return '';
		}
		let value = bytes;
		let unitIndex = 0;
		while (value >= STEP && unitIndex < UNIT_MESSAGE_KEYS.length - 1) {
			value /= STEP;
			unitIndex += 1;
		}
		const fractionDigits = unitIndex === 0 || Number.isInteger(value) ? 0 : 1;
		const number = formatNumber(value, fractionDigits);
		const unit = main_core.Loc.getMessage(UNIT_MESSAGE_KEYS[unitIndex]) ?? '';
		return unit === '' ? number : `${number} ${unit}`;
	}

	const ItemTable = ui_vue3.defineComponent({
		name: 'DiskPickerItemTable',
		components: {
			BDiskIcon: DiskIconView,
			PreviewButton,
			TextMd: ui_system_typography_vue.TextMd,
			TextXs: ui_system_typography_vue.TextXs
		},
		compilerOptions: {
			isCustomElement: tag => tag === 'visually-hidden'
		},
		props: {
			items: {
				type: Array,
				default: () => useItemStore().items
			},
			topSpacerHeight: {
				type: Number,
				default: 0
			},
			bottomSpacerHeight: {
				type: Number,
				default: 0
			},
			focusObjectId: {
				type: Number,
				default: null
			}
		},
		methods: {
			loc(messageCode) {
				return main_core.Loc.getMessage(messageCode) ?? '';
			},
			isSelected(item) {
				return useSelectionStore().selectedIdSet.has(item.objectId);
			},
			isActive(item) {
				return useSelectionStore().activeObjectId === item.objectId;
			},
			isDisabled(item) {
				return !item.isFolder && !item.selectable;
			},
			ariaPressed(item) {
				return !item.isFolder && item.selectable ? this.isSelected(item) : null;
			},
			rowClass(item) {
				return {
					'--selected': this.isSelected(item),
					'--active': this.isActive(item)
				};
			},
			testId(item) {
				return `universal-disk-picker-file-row-${item.objectId}`;
			},
			sizeText(item) {
				return item.isFolder ? '' : formatSize(item.size);
			},
			dateColumnLabel() {
				return this.loc(useSessionStore().stageType === StageType.Recent ? 'DISK_PICKER_TABLE_CHANGED' : 'DISK_PICKER_TABLE_ADDED');
			},
			dateText(item) {
				const timestamp = useSessionStore().stageType === StageType.Recent ? item.updateTime : item.createTime;
				return formatTableDate(timestamp, this.loc('DISK_PICKER_TABLE_TODAY'));
			},
			handleClick(item, event) {
				beginClick(item, event);
			},
			handleDblclick(item, event) {
				const row = event.currentTarget;
				const initiator = row.querySelector('.disk-picker-item-table__action') ?? row;
				openPreviewFromDblclick(item, initiator, this.windowContainer());
			},
			handlePreviewOpen(item, initiator) {
				openPreviewFromButton(item, initiator, this.windowContainer());
			},
			windowContainer() {
				return this.$el.closest('.disk-picker');
			},
			handleKeydown(item, event) {
				if (event.key === ' ' || event.key === 'Spacebar') {
					event.preventDefault();
					toggleFileSelection(item, useSessionStore().callbacks);
				} else if (event.key === 'Enter') {
					event.preventDefault();
					void confirmItem(item, useSessionStore().callbacks);
				}
			}
		},
		template: `
		<table class="disk-picker-item-table" data-testid="universal-disk-picker-table">
			<colgroup>
				<col class="--name">
				<col class="--size">
				<col class="--added">
				<col class="--preview">
			</colgroup>
			<thead>
				<tr class="disk-picker-item-table__head">
					<th scope="col" class="disk-picker-item-table__cell --name">
						<TextXs class="disk-picker-item-table__head-label">{{ loc('DISK_PICKER_TABLE_NAME') }}</TextXs>
					</th>
					<th scope="col" class="disk-picker-item-table__cell --size">
						<TextXs class="disk-picker-item-table__head-label">{{ loc('DISK_PICKER_TABLE_SIZE') }}</TextXs>
					</th>
					<th scope="col" class="disk-picker-item-table__cell --added">
						<TextXs class="disk-picker-item-table__head-label">{{ dateColumnLabel() }}</TextXs>
					</th>
					<th scope="col" class="disk-picker-item-table__cell --preview">
						<visually-hidden>{{ loc('DISK_PICKER_PREVIEW_OPEN') }}</visually-hidden>
					</th>
				</tr>
			</thead>
			<tbody>
				<tr v-if="topSpacerHeight > 0" aria-hidden="true">
					<td :style="{ height: topSpacerHeight + 'px' }" colspan="4"></td>
				</tr>
				<tr
					v-for="item in items"
					:key="item.objectId"
					class="disk-picker-item-table__row"
					:class="rowClass(item)"
					:data-testid="testId(item)"
					@click="handleClick(item, $event)"
					@dblclick="handleDblclick(item, $event)"
				>
					<td class="disk-picker-item-table__cell --name">
						<button
							type="button"
							class="disk-picker-item-table__action"
							:tabindex="item.objectId === focusObjectId ? 0 : -1"
							:aria-pressed="ariaPressed(item)"
							:aria-disabled="isDisabled(item) ? 'true' : null"
							:data-composite-id="item.objectId"
							@keydown="handleKeydown(item, $event)"
						>
							<BDiskIcon :type="item.iconType" :size="24" :preview-url="item.previewUrl"/>
							<TextMd class="disk-picker-item-table__name">{{ item.name }}</TextMd>
						</button>
					</td>
					<td class="disk-picker-item-table__cell --size">
						<TextMd class="disk-picker-item-table__value">{{ sizeText(item) }}</TextMd>
					</td>
					<td class="disk-picker-item-table__cell --added">
						<TextMd class="disk-picker-item-table__value">{{ dateText(item) }}</TextMd>
					</td>
					<td class="disk-picker-item-table__cell --preview">
						<PreviewButton
							:item="item"
							:tab-index="item.objectId === focusObjectId ? 0 : -1"
							:class="{ '--ui-context-edge-dark': isSelected(item), '--air-context-blurred-bg': isSelected(item) }"
							:on-accent="isSelected(item)"
							@open="handlePreviewOpen(item, $event)"
						/>
					</td>
				</tr>
				<tr v-if="bottomSpacerHeight > 0" aria-hidden="true">
					<td :style="{ height: bottomSpacerHeight + 'px' }" colspan="4"></td>
				</tr>
			</tbody>
		</table>
	`
	});

	const VIRTUAL_VIEWPORT_HEIGHT = 640;
	const VIRTUAL_OVERSCAN = 440;
	const PAGINATION_ROOT_MARGIN = '120px 0px';
	const SWITCH_ANIMATION_MS = 510;
	const RETRY_ID = 'retry';
	const VERTICAL_KEYS = ['ArrowDown', 'ArrowUp', 'Home', 'End', 'PageDown', 'PageUp'];
	const ROW_SELECTOR = '.disk-picker-item-row-wrap, .disk-picker-item-table__row';
	function compositeIdOfEvent(event) {
		const target = event.target;
		const holder = target.closest('[data-composite-id]') ?? target.closest(ROW_SELECTOR)?.querySelector('[data-composite-id]') ?? null;
		if (holder === null) {
			return null;
		}
		const rawId = holder.dataset.compositeId ?? '';
		return rawId === RETRY_ID ? RETRY_ID : Number(rawId);
	}
	function firstEntryAfter(items, offset) {
		let low = 0;
		let high = items.length;
		while (low < high) {
			const middle = Math.floor((low + high) / 2);
			if (items[middle].top + items[middle].height <= offset) {
				low = middle + 1;
			} else {
				high = middle;
			}
		}
		return low;
	}
	function firstEntryAtOrAfter(items, offset) {
		let low = 0;
		let high = items.length;
		while (low < high) {
			const middle = Math.floor((low + high) / 2);
			if (items[middle].top < offset) {
				low = middle + 1;
			} else {
				high = middle;
			}
		}
		return low;
	}
	function windowByOffset(items, scrollTop) {
		const last = items[items.length - 1];
		const totalHeight = last ? last.top + last.height : 0;
		const startOffset = Math.max(0, scrollTop - VIRTUAL_OVERSCAN);
		const endOffset = scrollTop + VIRTUAL_VIEWPORT_HEIGHT + VIRTUAL_OVERSCAN;
		const start = firstEntryAfter(items, startOffset);
		const end = firstEntryAtOrAfter(items, endOffset);
		return {
			items: items.slice(start, end),
			top: items[start]?.top ?? totalHeight,
			bottom: Math.max(0, totalHeight - (items[end - 1]?.top ?? 0) - (items[end - 1]?.height ?? 0))
		};
	}
	const ItemBrowser = ui_vue3.defineComponent({
		name: 'DiskPickerItemBrowser',
		components: {
			ItemRowSkeleton,
			EmptyState,
			ItemRow,
			ItemTable,
			TextXs: ui_system_typography_vue.TextXs
		},
		setup() {
			return {
				ViewMode,
				skeletonWidths: [230, 180, 260, 200, 150, 240, 190]
			};
		},
		data() {
			return {
				pendingNavFocus: false,
				preferredNavFocusId: null,
				pendingFocus: null,
				focusedObjectId: null,
				virtualScrollTop: 0,
				paginationObserver: null,
				scrollFrame: null,
				pendingScrollTop: 0,
				switching: false,
				switchTimer: null,
				switchPending: false,
				switchDirection: 'none',
				crumbCount: 0,
				metrics: {
					...DEFAULT_METRICS
				}
			};
		},
		computed: {
			scrolled() {
				return this.virtualScrollTop > 0;
			},
			items() {
				return useItemStore().items;
			},
			session() {
				return useSessionStore();
			},
			viewMode() {
				return this.session.viewMode;
			},
			focusObjectId() {
				if (this.focusedObjectId !== null && this.navigationIds.includes(this.focusedObjectId)) {
					return this.focusedObjectId;
				}
				const activeObjectId = useSelectionStore().activeObjectId;
				return this.items.some(item => item.objectId === activeObjectId) ? activeObjectId : this.items[0]?.objectId ?? null;
			},
			tableFocusObjectId() {
				return typeof this.focusObjectId === 'number' ? this.focusObjectId : null;
			},
			navigationIds() {
				const ids = this.items.map(item => item.objectId);
				if (this.session.paginationStalled) {
					ids.push(RETRY_ID);
				}
				return ids;
			},
			focusVersion() {
				return `${this.feedKey}|${this.viewMode}|${this.session.searchQuery}`;
			},
			contentLoading() {
				return this.session.contentLoading;
			},
			fullContentLoading() {
				return this.contentLoading && !this.session.preserveContentOnLoading;
			},
			overlayContentLoading() {
				return this.contentLoading && this.session.preserveContentOnLoading;
			},
			navigationPending() {
				return this.session.navigationPending;
			},
			feedKey() {
				const feed = this.session.feed;
				return `${feed.stageType}:${feed.storageId}:${feed.folderId}`;
			},
			searchActive() {
				return [...this.session.searchQuery.trim()].length >= SearchQueryLength.Min;
			},
			filtersActive() {
				return this.session.objectTypeFilter !== ObjectTypeFilter.All || this.session.fileTypeFilters.length > 0;
			},
			hasError() {
				return this.session.contentError !== null;
			},
			isEmpty() {
				return !this.session.contentLoading && !this.hasError && this.session.emptyReason === 'empty';
			},
			rowsRendered() {
				return !this.fullContentLoading && !this.hasError && !this.isEmpty;
			},
			errorTitle() {
				return this.loc(errorMessageCode(this.session.contentError));
			},
			errorIcon() {
				return ui_iconSet_api_vue.Outline.ALERT;
			},
			emptyIcon() {
				if (this.searchActive || this.filtersActive) {
					return ui_iconSet_api_vue.Outline.SEARCH;
				}
				return this.session.stageType === StageType.Folder ? ui_iconSet_api_vue.Outline.FOLDER : ui_iconSet_api_vue.Outline.FILE;
			},
			emptyGraphic() {
				if (this.searchActive || this.filtersActive) {
					return 'no-results';
				}
				return this.session.stageType === StageType.Folder ? 'folder' : 'no-file';
			},
			emptyTitle() {
				if (this.searchActive || this.filtersActive) {
					return this.loc('DISK_PICKER_NOTHING_FOUND');
				}
				if (this.session.stageType === StageType.Folder) {
					return this.loc('DISK_PICKER_EMPTY_FOLDER');
				}
				return this.session.stageType === StageType.Recent ? this.loc('DISK_PICKER_EMPTY_RECENT') : this.loc('DISK_PICKER_EMPTY_DISK');
			},
			emptyActionLabel() {
				return this.searchActive || this.filtersActive ? this.loc('DISK_PICKER_RESET_FILTERS') : '';
			},
			groups() {
				if (!this.searchActive && this.session.stageType === StageType.Folder) {
					return [{
						key: 'folder',
						label: '',
						items: this.items
					}];
				}
				const useRecentTime = !this.searchActive && this.session.stageType === StageType.Recent;
				const now = Math.floor(Date.now() / 1000);
				const buckets = new Map();
				this.items.forEach(item => {
					const group = resolveDateGroup(useRecentTime ? item.recentTime : item.updateTime, now);
					const bucket = buckets.get(group.key) ?? {
						group,
						items: []
					};
					bucket.items.push(item);
					buckets.set(group.key, bucket);
				});
				return [...buckets.values()].sort((left, right) => compareDateGroups(left.group, right.group)).map(({
					group,
					items
				}) => ({
					key: group.key,
					label: group.labelCode ? this.loc(group.labelCode) : group.label ?? '',
					items
				}));
			},
			virtualEntries() {
				const entries = [];
				let top = 0;
				this.groups.forEach(group => {
					if (group.label) {
						entries.push({
							key: `group-${group.key}`,
							type: 'group',
							label: group.label,
							item: null,
							top,
							height: this.metrics.groupTitle
						});
						top += this.metrics.groupTitle;
					}
					group.items.forEach(item => {
						entries.push({
							key: `item-${item.objectId}`,
							type: 'item',
							label: '',
							item,
							top,
							height: this.metrics.listRow
						});
						top += this.metrics.listRow;
					});
				});
				return entries;
			},
			virtualListWindow() {
				return windowByOffset(this.virtualEntries, this.virtualScrollTop);
			},
			virtualTableWindow() {
				const rowHeight = this.metrics.tableRow;
				const start = Math.max(0, Math.floor((this.virtualScrollTop - VIRTUAL_OVERSCAN) / rowHeight));
				const visibleCount = Math.ceil((VIRTUAL_VIEWPORT_HEIGHT + 2 * VIRTUAL_OVERSCAN) / rowHeight);
				const end = Math.min(this.items.length, start + visibleCount);
				return {
					items: this.items.slice(start, end),
					top: start * rowHeight,
					bottom: (this.items.length - end) * rowHeight
				};
			},
			announcement() {
				if (this.session.contentLoading) {
					return this.loc('DISK_PICKER_LOADING');
				}
				if (this.hasError) {
					return this.errorTitle;
				}
				if (this.isEmpty) {
					return this.emptyTitle;
				}
				return this.loc('DISK_PICKER_ANNOUNCE_COUNT', {
					'#COUNT#': String(this.items.length)
				});
			}
		},
		watch: {
			feedKey() {
				const root = this.$el;
				this.switchPending = true;
				this.virtualScrollTop = 0;
				this.$nextTick(() => this.runPendingSwitch());
				const handoff = this.session.consumeFocusHandoffToFiles();
				if (handoff || root && root.contains(document.activeElement)) {
					this.pendingNavFocus = true;
				}
				if (root) {
					root.scrollTop = 0;
				}
			},
			viewMode() {
				this.switchDirection = 'none';
				this.markSwitch();
				const root = this.$el;
				if (root) {
					root.scrollTop = 0;
				}
				this.virtualScrollTop = 0;
				this.pendingScrollTop = 0;
				this.$nextTick(() => this.observePaginationSentinel());
				if (root && root.contains(document.activeElement) && this.focusObjectId !== null) {
					this.$nextTick(() => this.moveFocusTo(this.focusObjectId));
				}
			},
			'items.length': function () {
				this.$nextTick(() => this.observePaginationSentinel());
				if (this.pendingNavFocus) {
					this.pendingNavFocus = false;
					this.$nextTick(() => this.focusAfterNavigation());
				}
			},
			navigationIds(ids, previousIds) {
				const active = document.activeElement;
				const focusedKey = active instanceof HTMLElement ? active.dataset.compositeId ?? null : null;
				if (focusedKey === null || ids.some(id => String(id) === focusedKey)) {
					return;
				}
				const root = this.$el;
				if (!root || !(active === document.body || root.contains(active))) {
					return;
				}
				if (this.pendingNavFocus) {
					this.pendingNavFocus = false;
					this.$nextTick(() => this.focusAfterNavigation());
					return;
				}
				const previousIndex = previousIds.findIndex(id => String(id) === focusedKey);
				const fallbackId = resolveFallbackId(ids, null, previousIndex);
				this.$nextTick(() => this.focusRowOrStablePoint(fallbackId));
			},
			contentLoading(loading) {
				if (!loading) {
					this.$nextTick(() => this.observePaginationSentinel());
				}
				if (!loading) {
					this.runPendingSwitch();
				}
				if (!loading && this.pendingNavFocus) {
					this.pendingNavFocus = false;
					this.$nextTick(() => this.focusAfterNavigation());
				}
			},
			navigationPending(pending) {
				if (!pending) {
					this.$nextTick(() => this.observePaginationSentinel());
				}
			}
		},
		mounted() {
			this.metrics = readMetrics(this.$el);
			this.crumbCount = this.session.breadcrumbs.length;
			this.paginationObserver = new IntersectionObserver(entries => {
				if (entries.some(entry => entry.isIntersecting)) {
					void loadNextPage(this.session.callbacks);
				}
			}, {
				root: this.$el,
				rootMargin: PAGINATION_ROOT_MARGIN
			});
			this.observePaginationSentinel();
		},
		beforeUnmount() {
			this.paginationObserver?.disconnect();
			this.paginationObserver = null;
			if (this.scrollFrame !== null) {
				cancelAnimationFrame(this.scrollFrame);
				this.scrollFrame = null;
			}
			if (this.switchTimer !== null) {
				clearTimeout(this.switchTimer);
				this.switchTimer = null;
			}
		},
		methods: {
			runPendingSwitch() {
				if (!this.switchPending || this.contentLoading) {
					return;
				}
				this.switchPending = false;
				this.resolveSwitchDirection();
				this.markSwitch();
			},
			resolveSwitchDirection() {
				const crumbCount = this.session.breadcrumbs.length;
				if (crumbCount > this.crumbCount && this.crumbCount > 0) {
					this.switchDirection = 'forward';
				} else if (crumbCount < this.crumbCount && crumbCount > 0) {
					this.switchDirection = 'back';
				} else {
					this.switchDirection = 'none';
				}
				this.crumbCount = crumbCount;
			},
			markSwitch() {
				if (this.switchTimer !== null) {
					clearTimeout(this.switchTimer);
				}
				this.switching = true;
				this.switchTimer = setTimeout(() => {
					this.switching = false;
					this.switchTimer = null;
				}, SWITCH_ANIMATION_MS);
			},
			loc(messageCode, replacements) {
				return main_core.Loc.getMessage(messageCode, replacements) ?? '';
			},
			focusAfterNavigation() {
				const root = this.$el;
				const preferredId = this.preferredNavFocusId;
				this.preferredNavFocusId = null;
				if (!root) {
					return;
				}
				const active = document.activeElement;
				const focusLostOrStillInList = active === document.body || root.contains(active);
				if (!focusLostOrStillInList) {
					return;
				}
				this.focusRowOrStablePoint(resolveFallbackId(this.navigationIds, preferredId, 0));
			},
			focusEntry() {
				if (!this.$el) {
					return false;
				}
				this.focusRowOrStablePoint(resolveFallbackId(this.navigationIds, this.focusObjectId, 0));
				return true;
			},
			focusRowOrStablePoint(id) {
				if (id !== null) {
					this.moveFocusTo(id);
					return;
				}
				const root = this.$el;
				(root.querySelector('button:not([disabled])') ?? root).focus();
			},
			claimStableFocus() {
				const root = this.$el;
				if (root && root.contains(document.activeElement)) {
					root.focus();
				}
			},
			moveFocusTo(id) {
				const root = this.$el;
				const index = this.navigationIds.indexOf(id);
				if (index < 0) {
					return;
				}
				const metrics = this.metrics ?? DEFAULT_METRICS;
				const rowHeight = this.viewMode === ViewMode.Table ? metrics.tableRow : metrics.listRow;
				const viewportHeight = root.clientHeight || VIRTUAL_VIEWPORT_HEIGHT;
				let nextScrollTop = root.scrollHeight - viewportHeight;
				if (id !== RETRY_ID) {
					const entryTop = this.viewMode === ViewMode.Table ? index * metrics.tableRow : this.virtualEntries.find(entry => entry.item?.objectId === id)?.top ?? 0;
					nextScrollTop = scrollOffsetForEntry(entryTop, rowHeight, root.scrollTop, viewportHeight);
				}
				this.focusedObjectId = id;
				root.scrollTop = Math.max(0, nextScrollTop);
				this.pendingScrollTop = root.scrollTop;
				this.virtualScrollTop = root.scrollTop;
				this.pendingFocus = {
					id,
					version: this.focusVersion
				};
				this.$nextTick(() => this.applyPendingFocus());
			},
			applyPendingFocus() {
				const pending = takeCurrentFocus(this.pendingFocus, this.focusVersion);
				this.pendingFocus = null;
				if (pending === null) {
					return;
				}
				if (focusCompositeItem(this.$el, pending.id)) {
					return;
				}
				if (!this.rowsRendered) {
					this.pendingNavFocus = true;
					this.focusRowOrStablePoint(null);
					return;
				}
				this.focusRowOrStablePoint(resolveFallbackId(this.navigationIds, null, 0));
			},
			handleBackspace(event) {
				if (isTextEntryTarget(event.target)) {
					return;
				}
				event.preventDefault();
				const leavingFolderId = openParentFolder(this.session.callbacks);
				if (leavingFolderId !== null) {
					this.preferredNavFocusId = leavingFolderId;
				}
			},
			handleCompositeFocus(event) {
				const compositeId = compositeIdOfEvent(event);
				if (compositeId !== null) {
					this.focusedObjectId = compositeId;
				}
			},
			handleCompositeKeydown(event) {
				if (event.key === 'Backspace') {
					this.handleBackspace(event);
					return;
				}
				if (!VERTICAL_KEYS.includes(event.key) || isTextEntryTarget(event.target)) {
					return;
				}
				if (this.overlayContentLoading) {
					event.preventDefault();
					event.stopPropagation();
					return;
				}
				const compositeId = compositeIdOfEvent(event);
				const currentIndex = compositeId === null ? -1 : this.navigationIds.indexOf(compositeId);
				if (currentIndex < 0) {
					return;
				}
				event.preventDefault();
				const root = this.$el;
				const metrics = this.metrics ?? DEFAULT_METRICS;
				const rowHeight = this.viewMode === ViewMode.Table ? metrics.tableRow : metrics.listRow;
				const pageSize = Math.max(1, Math.floor((root.clientHeight || VIRTUAL_VIEWPORT_HEIGHT) / rowHeight));
				const nextIndex = resolveCompositeNavigationIndex(currentIndex, this.navigationIds.length, event.key, pageSize);
				this.moveFocusTo(this.navigationIds[nextIndex]);
			},
			isActive(item) {
				return useSelectionStore().activeObjectId === item.objectId;
			},
			isSelected(item) {
				return useSelectionStore().selectedIdSet.has(item.objectId);
			},
			handleVirtualScroll(event) {
				this.pendingScrollTop = event.target.scrollTop;
				if (this.scrollFrame !== null) {
					return;
				}
				this.scrollFrame = requestAnimationFrame(() => {
					this.virtualScrollTop = this.pendingScrollTop;
					this.scrollFrame = null;
				});
			},
			observePaginationSentinel() {
				const sentinel = this.$refs.paginationSentinel;
				this.paginationObserver?.disconnect();
				if (sentinel && !this.session.navigationPending) {
					this.paginationObserver?.observe(sentinel);
				}
			},
			handleRetryContent() {
				if (this.overlayContentLoading) {
					return;
				}
				this.pendingNavFocus = true;
				this.claimStableFocus();
				if (this.searchActive) {
					void searchItems(this.session.searchQuery, this.session.callbacks);
					return;
				}
				if (this.session.stageType === StageType.Folder) {
					void reloadCurrentFeed(this.session.callbacks);
					return;
				}
				void retryInitialStage();
			},
			handleRetryNextPage() {
				if (this.overlayContentLoading) {
					return;
				}
				void retryNextPage(this.session.callbacks);
			},
			handleResetFilters() {
				this.pendingNavFocus = true;
				this.claimStableFocus();
				this.session.callbacks.resetFilters();
			}
		},
		template: `
		<div
			class="disk-picker-item-browser"
			data-disk-picker-group="files"
			:class="{
				'--navigation-blocked': overlayContentLoading,
				'--scrolled': scrolled,
				'--switching': switching,
				'--switch-forward': switching && switchDirection === 'forward',
				'--switch-back': switching && switchDirection === 'back',
				'--table': viewMode === ViewMode.Table,
			}"
			tabindex="-1"
			:aria-busy="contentLoading"
			:aria-label="announcement"
			@focusin="handleCompositeFocus"
			@keydown="handleCompositeKeydown"
			@scroll.passive="handleVirtualScroll"
		>
			<div class="disk-picker-item-browser__status" role="status" aria-live="polite">{{ announcement }}</div>

			<div
				v-if="fullContentLoading"
				class="disk-picker-item-browser__skeleton"
				data-testid="universal-disk-picker-content-loader"
				aria-hidden="true"
			>
				<ItemRowSkeleton
					v-for="(width, index) in skeletonWidths"
					:key="index"
					:width="width"
				/>
			</div>

			<EmptyState
				v-else-if="hasError"
				:icon="errorIcon"
				:title="errorTitle"
				:action-label="loc('DISK_PICKER_RETRY')"
				test-id="universal-disk-picker-error-state"
				action-test-id="universal-disk-picker-error-retry"
				@action="handleRetryContent"
			/>

			<EmptyState
				v-else-if="isEmpty"
				:icon="emptyIcon"
				:graphic="emptyGraphic"
				:title="emptyTitle"
				:action-label="emptyActionLabel"
				test-id="universal-disk-picker-empty-state"
				@action="handleResetFilters"
			/>

			<template v-else>
				<ItemTable
					v-if="viewMode === ViewMode.Table"
					:items="virtualTableWindow.items"
					:top-spacer-height="virtualTableWindow.top"
					:bottom-spacer-height="virtualTableWindow.bottom"
					:focus-object-id="tableFocusObjectId"
				/>

				<template v-else>
					<div
						class="disk-picker-item-browser__spacer"
						:style="{ height: virtualListWindow.top + 'px' }"
						aria-hidden="true"
					></div>
					<template v-for="entry in virtualListWindow.items" :key="entry.key">
						<TextXs
							v-if="entry.type === 'group'"
							class="disk-picker-item-browser__group-title"
						>{{ entry.label }}</TextXs>
						<ItemRow
							v-else
							:item="entry.item"
							:active="isActive(entry.item)"
							:selected="isSelected(entry.item)"
							:tab-index="entry.item.objectId === focusObjectId ? 0 : -1"
						/>
					</template>
					<div
						class="disk-picker-item-browser__spacer"
						:style="{ height: virtualListWindow.bottom + 'px' }"
						aria-hidden="true"
					></div>
				</template>

				<div v-if="session.paginationStalled" class="disk-picker-item-browser__more">
					<button
						type="button"
						class="disk-picker-item-browser__retry"
						:tabindex="focusObjectId === 'retry' ? 0 : -1"
						data-composite-id="retry"
						data-testid="universal-disk-picker-load-more-retry"
						@click="handleRetryNextPage"
					>
						{{ loc('DISK_PICKER_RETRY') }}
					</button>
				</div>
				<div ref="paginationSentinel" class="disk-picker-item-browser__sentinel" aria-hidden="true"></div>
				<div
					v-if="overlayContentLoading"
					class="disk-picker-item-browser__loading-overlay"
					data-testid="universal-disk-picker-content-loading-overlay"
					aria-hidden="true"
					@wheel.prevent
					@touchmove.prevent
				></div>
			</template>
		</div>
	`
	});

	function formatDateRange(timestamps) {
		const known = timestamps.filter(value => value !== null);
		if (known.length === 0) {
			return '';
		}
		const from = formatDate(Math.min(...known));
		const to = formatDate(Math.max(...known));
		return from === to ? from : `${from} - ${to}`;
	}
	const PreviewPanel = ui_vue3.defineComponent({
		name: 'DiskPickerPreviewPanel',
		components: {
			BDiskIcon: DiskIconView,
			BLine: ui_system_skeleton_vue.BLine,
			HeadlineSm: ui_system_typography_vue.HeadlineSm,
			TextXs: ui_system_typography_vue.TextXs
		},
		data() {
			return {
				loadedPreviewUrl: null
			};
		},
		watch: {
			'activeItem.previewUrl': function () {
				this.loadedPreviewUrl = null;
			}
		},
		computed: {
			previewImageLoaded() {
				return this.loadedPreviewUrl !== null && this.loadedPreviewUrl === this.activeItem?.previewUrl;
			},
			activeItem() {
				const activeObjectId = useSelectionStore().activeObjectId;
				if (activeObjectId === null) {
					return null;
				}
				return useItemStore().getById(activeObjectId);
			},
			count() {
				return useSelectionStore().count;
			},
			selectedSnapshots() {
				return useSelectionStore().selectedSnapshotList;
			},
			showEmpty() {
				return !this.showMulti && this.activeItem === null;
			},
			showMulti() {
				return this.count > 1;
			},
			showSingle() {
				return !this.showMulti && this.activeItem !== null;
			},
			previewImageAllowed() {
				return !useSessionStore().navigationPending;
			},
			showsPreviewImage() {
				return main_core.Type.isStringFilled(this.activeItem?.previewUrl) && this.previewImageAllowed;
			},
			fanItems() {
				return this.selectedSnapshots.slice(-3);
			},
			formatLabel() {
				const extension = this.activeItem?.extension ?? null;
				return extension ? extension.toUpperCase() : '';
			},
			multiTitle() {
				return this.loc('DISK_PICKER_PREVIEW_MULTI_TITLE', {
					'#COUNT#': String(this.count)
				});
			},
			multiSize() {
				const total = this.selectedSnapshots.reduce((sum, snapshot) => sum + (snapshot.size ?? 0), 0);
				return formatSize(total);
			},
			multiProps() {
				return [{
					key: 'size',
					label: this.loc('DISK_PICKER_PREVIEW_PROP_SIZE'),
					value: this.multiSize
				}, {
					key: 'created',
					label: this.loc('DISK_PICKER_PREVIEW_PROP_CREATED'),
					value: formatDateRange(this.selectedSnapshots.map(snapshot => snapshot.createTime))
				}, {
					key: 'changed',
					label: this.loc('DISK_PICKER_PREVIEW_PROP_CHANGED'),
					value: formatDateRange(this.selectedSnapshots.map(snapshot => snapshot.updateTime))
				}].filter(prop => prop.value !== '');
			},
			fileProps() {
				const item = this.activeItem;
				if (item === null) {
					return [];
				}
				return [{
					key: 'size',
					label: this.loc('DISK_PICKER_PREVIEW_PROP_SIZE'),
					value: formatSize(item.size)
				}, {
					key: 'created',
					label: this.loc('DISK_PICKER_PREVIEW_PROP_CREATED'),
					value: formatDate(item.createTime)
				}, {
					key: 'changed',
					label: this.loc('DISK_PICKER_PREVIEW_PROP_CHANGED'),
					value: formatDate(item.updateTime)
				}];
			},
			originProps() {
				const item = this.activeItem;
				if (item === null) {
					return [];
				}
				return [{
					key: 'source',
					label: this.loc('DISK_PICKER_PREVIEW_PROP_SOURCE'),
					value: item.sourceTitle
				}];
			}
		},
		methods: {
			handlePreviewLoad() {
				this.loadedPreviewUrl = this.activeItem?.previewUrl ?? null;
			},
			loc(messageCode, replacements) {
				return main_core.Loc.getMessage(messageCode, replacements) ?? '';
			}
		},
		template: `
		<div class="disk-picker-preview-panel" data-testid="universal-disk-picker-preview-pane">
			<div v-if="showEmpty" class="disk-picker-preview-panel__empty" data-testid="universal-disk-picker-preview-empty">
				<div
					class="disk-picker-preview-panel__empty-graphic"
					data-testid="universal-disk-picker-preview-empty-graphic"
					aria-hidden="true"
				></div>
				<div class="disk-picker-preview-panel__empty-hint">
					<TextXs class="disk-picker-preview-panel__empty-hint-text">{{ loc('DISK_PICKER_PREVIEW_EMPTY_HINT') }}</TextXs>
				</div>
			</div>

			<div v-else-if="showMulti" :key="'multi'" class="disk-picker-preview-panel__multi" data-testid="universal-disk-picker-preview-multi">
				<div class="disk-picker-preview-panel__fan">
					<div
						v-for="snapshot in fanItems"
						:key="snapshot.objectId"
						class="disk-picker-preview-panel__fan-thumb"
					>
						<BDiskIcon
							:type="snapshot.iconType"
							:size="138"
							:preview-url="snapshot.previewUrl"
							keep-preview-on-feed-change
						/>
					</div>
				</div>
				<HeadlineSm accent class="disk-picker-preview-panel__multi-title">{{ multiTitle }}</HeadlineSm>
				<div class="disk-picker-preview-panel__props">
					<div
						v-for="prop in multiProps"
						:key="prop.key"
						class="disk-picker-preview-panel__prop"
					>
						<TextXs class="disk-picker-preview-panel__prop-label">{{ prop.label }}</TextXs>
						<TextXs class="disk-picker-preview-panel__prop-value">{{ prop.value }}</TextXs>
					</div>
				</div>
			</div>

			<div v-else-if="showSingle" :key="'single-' + activeItem.objectId" class="disk-picker-preview-panel__single" data-testid="universal-disk-picker-preview-single">
				<div class="disk-picker-preview-panel__thumb">
					<div
						v-if="showsPreviewImage && !previewImageLoaded"
						class="disk-picker-preview-panel__thumb-skeleton"
						aria-hidden="true"
					>
						<BLine :height="154" :radius="12"/>
					</div>
					<img
						v-if="showsPreviewImage"
						v-show="previewImageLoaded"
						class="disk-picker-preview-panel__image"
						:src="activeItem.previewUrl"
						:alt="activeItem.name"
						@load="handlePreviewLoad"
						@error="handlePreviewLoad"
					/>
					<BDiskIcon
						v-else
						:key="activeItem.objectId"
						:type="activeItem.iconType"
						:size="128"
					/>
				</div>
				<div class="disk-picker-preview-panel__title">
					<HeadlineSm accent class="disk-picker-preview-panel__name">{{ activeItem.name }}</HeadlineSm>
					<TextXs
						v-if="formatLabel"
						class="disk-picker-preview-panel__format"
						data-testid="universal-disk-picker-preview-format"
					>{{ formatLabel }}</TextXs>
				</div>
				<div class="disk-picker-preview-panel__props">
					<div
						v-for="prop in fileProps"
						:key="prop.key"
						class="disk-picker-preview-panel__prop"
					>
						<TextXs class="disk-picker-preview-panel__prop-label">{{ prop.label }}</TextXs>
						<TextXs class="disk-picker-preview-panel__prop-value">{{ prop.value }}</TextXs>
					</div>
				</div>
				<div class="disk-picker-preview-panel__props --origin">
					<div
						v-for="prop in originProps"
						:key="prop.key"
						class="disk-picker-preview-panel__prop"
					>
						<TextXs class="disk-picker-preview-panel__prop-label">{{ prop.label }}</TextXs>
						<TextXs class="disk-picker-preview-panel__prop-value">{{ prop.value }}</TextXs>
					</div>
				</div>
			</div>
		</div>
	`
	});

	const SelectionFooter = ui_vue3.defineComponent({
		name: 'DiskPickerSelectionFooter',
		components: {
			Button: ui_vue3_components_button.Button
		},
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				CounterStyle: ui_cnt.CounterStyle,
				Outline: ui_iconSet_api_vue.Outline
			};
		},
		watch: {
			chipVisible: {
				immediate: true,
				handler(visible) {
					if (visible) {
						void this.$nextTick(() => this.nameReset());
					}
				}
			},
			count() {
				void this.$nextTick(() => this.nameReset());
			},
			confirming(confirming) {
				const root = this.$el;
				const active = document.activeElement;
				if (!root || !(active === document.body || root.contains(active))) {
					return;
				}
				if (confirming) {
					const controls = listFocusableControls(root);
					const cancel = controls[controls.length - 1];
					if (active !== cancel) {
						cancel?.focus();
					}
					return;
				}
				this.$nextTick(() => this.focusEntry());
			}
		},
		computed: {
			chipVisible() {
				return this.multipleMode && this.canConfirm;
			},
			count() {
				return useSelectionStore().count;
			},
			canConfirm() {
				return useSelectionStore().canConfirm;
			},
			confirming() {
				return useSessionStore().confirming;
			},
			confirmText() {
				return this.loc('DISK_PICKER_CONFIRM_ATTACH');
			},
			countLabel() {
				return this.loc('DISK_PICKER_CONFIRM');
			},
			multipleMode() {
				return useSessionStore().constraints.selectionMode === SelectionMode.Multiple;
			}
		},
		methods: {
			nameReset() {
				const chip = this.$refs.chip;
				chip?.querySelector('button')?.setAttribute('aria-label', this.loc('DISK_PICKER_RESET_SELECTION_LABEL', {
					'#COUNT#': String(this.count)
				}));
			},
			loc(messageCode, replacements) {
				return main_core.Loc.getMessage(messageCode, replacements) ?? '';
			},
			handleCancel() {
				useSessionStore().callbacks.requestCancel();
			},
			handleConfirm() {
				void submitSelection(useSessionStore().callbacks);
			},
			handleReset() {
				if (this.confirming) {
					return;
				}
				this.focusFooter();
				useSelectionStore().clear();
				ui_a11y.LiveAnnouncer.announce(this.loc('DISK_PICKER_RESET_SELECTION_DONE'));
			},
			focusFooter() {
				this.$refs.root?.focus();
			},
			focusEntry() {
				const root = this.$el;
				if (!root) {
					return false;
				}
				const target = listFocusableControls(root)[0];
				target?.focus();
				return target !== undefined;
			}
		},
		template: `
		<div
			ref="root"
			class="disk-picker-selection-footer"
			data-disk-picker-group="actions"
			tabindex="-1"
		>
			<div
				v-if="chipVisible"
				ref="chip"
				class="disk-picker-selection-footer__chip"
				:title="loc('DISK_PICKER_RESET_SELECTION')"
				data-testid="universal-disk-picker-selection-chip"
			>
				<Button
					:text="countLabel"
					:rightCounterValue="count"
					:rightCounterColor="CounterStyle.FILLED"
					:rightIcon="Outline.CROSS_M"
					:style="AirButtonStyle.OUTLINE_ACCENT_2"
					:size="ButtonSize.LARGE"
					:disabled="confirming"
					:dataset="{ testid: 'universal-disk-picker-reset-selection-btn' }"
					@click="handleReset"
				/>
			</div>
			<div class="disk-picker-selection-footer__actions">
				<Button
					:text="confirmText"
					:style="AirButtonStyle.FILLED"
					:size="ButtonSize.LARGE"
					:disabled="!canConfirm"
					:loading="confirming"
					:dataset="{ testid: 'universal-disk-picker-confirm-btn' }"
					@click="handleConfirm"
				/>
				<Button
					:text="loc('DISK_PICKER_CANCEL')"
					:style="AirButtonStyle.PLAIN"
					:size="ButtonSize.LARGE"
					:dataset="{ testid: 'universal-disk-picker-cancel-btn' }"
					@click="handleCancel"
				/>
			</div>
		</div>
	`
	});

	const SCROLL_EDGE_THRESHOLD = 1;
	const SCROLLABLE_OVERFLOW_VALUES = new Set(['auto', 'scroll', 'overlay']);
	function resolveWheelTarget(target) {
		if (target instanceof HTMLElement) {
			return target;
		}
		if (target instanceof Node && target.parentElement instanceof HTMLElement) {
			return target.parentElement;
		}
		return null;
	}
	function canScrollWithDelta(element, deltaY) {
		const maxScrollTop = Math.max(0, element.scrollHeight - element.clientHeight);
		const canScrollUp = element.scrollTop > SCROLL_EDGE_THRESHOLD;
		const canScrollDown = element.scrollTop < maxScrollTop - SCROLL_EDGE_THRESHOLD;
		return deltaY < 0 ? canScrollUp : canScrollDown;
	}
	function preventWheelScrollChaining(event) {
		const container = event.currentTarget;
		if (!(container instanceof HTMLElement) || event.deltaY === 0 || event.ctrlKey) {
			return;
		}
		let current = resolveWheelTarget(event.target);
		while (current) {
			const style = getComputedStyle(current);
			const isScrollable = SCROLLABLE_OVERFLOW_VALUES.has(style.overflowY) && current.scrollHeight > current.clientHeight;
			if (isScrollable && canScrollWithDelta(current, event.deltaY)) {
				return;
			}
			if (current === container) {
				break;
			}
			current = current.parentElement;
		}
		event.preventDefault();
	}

	const GROUP_ATTRIBUTE = 'data-disk-picker-group';
	const GROUP_ORDER = ['storage', 'files', 'header', 'actions'];
	const RELATED_POPUP_SELECTOR = '.menu-popup.popup-window-show, .main-ui-select-inner.--open';
	const FILTER_PRESET_SELECTOR = '.main-ui-filter-sidebar-item';
	const OPEN_POPUP_SELECTOR = '.popup-window.--open';
	const FILTER_SEARCH_CONTAINER_SUFFIX = '_search_container';
	const FILTER_FIND_SELECTOR = ['.main-ui-filter-field-search input', 'input.main-ui-filter-search-filter', 'input[name="FIND"]'].join(',');
	const FILTER_CLEAR_SELECTOR = '.main-ui-item-icon-block .main-ui-delete';
	const FILTER_CLEAR_CONTAINER_SELECTOR = '.main-ui-item-icon-block';
	const FILTER_CLEAR_VISIBLE_CLASS = 'main-ui-show';
	function getFilterSettingsPopup(filterHost) {
		if (!filterHost) {
			return null;
		}
		const searchContainer = filterHost.querySelector(`[id$="${FILTER_SEARCH_CONTAINER_SUFFIX}"]`);
		if (!searchContainer?.id) {
			return null;
		}
		return [...document.querySelectorAll(OPEN_POPUP_SELECTOR)].find(popup => popup.id === searchContainer.id && !filterHost.contains(popup)) ?? null;
	}
	function isRelatedFilterTarget(target, filterHost) {
		const settingsPopup = getFilterSettingsPopup(filterHost);
		const preset = target.closest(FILTER_PRESET_SELECTOR);
		return settingsPopup?.contains(target) === true || target.closest(RELATED_POPUP_SELECTOR) !== null || preset !== null && preset.closest(OPEN_POPUP_SELECTOR) !== null;
	}
	const App = ui_vue3.defineComponent({
		name: 'DiskPickerApp',
		components: {
			LoadingSkeleton,
			PickerLayout,
			SourceSidebar,
			PickerToolbar,
			ItemBrowser,
			PreviewPanel,
			SelectionFooter
		},
		data() {
			return {
				trapHandler: null,
				escapeHandler: null,
				viewerKeydownHandler: null,
				viewerEscapeArmed: false,
				filterPointerdownHandler: null,
				filterPointerdownActive: false,
				filterFocusoutHandler: null,
				filterInputHandler: null,
				filterKeydownHandler: null,
				filterClickHandler: null,
				resizeObserver: null,
				observedBreadcrumbs: null,
				initialFocusHandled: false
			};
		},
		computed: {
			initialized() {
				return useSessionStore().initialized;
			},
			searchOpen() {
				return useSessionStore().searchOpen;
			},
			filtersActive() {
				const session = useSessionStore();
				return session.objectTypeFilter !== ObjectTypeFilter.All || session.fileTypeFilters.length > 0;
			}
		},
		watch: {
			searchOpen(open) {
				if (open) {
					this.$nextTick(() => {
						this.focusFilterFind();
						this.syncFilterHost();
					});
				}
			},
			filtersActive(active) {
				if (active) {
					useSessionStore().setSearchOpen(true);
				}
			},
			initialized() {
				this.$nextTick(() => {
					this.syncFilterHost();
					this.focusInitialGroup();
				});
			}
		},
		mounted() {
			this.trapHandler = event => this.handleTrap(event);
			main_core.Event.bind(this.$el, 'keydown', this.trapHandler);
			this.escapeHandler = event => this.handleDocumentEscape(event);
			main_core.Event.bind(document, 'keyup', this.escapeHandler, true);
			this.viewerKeydownHandler = event => this.handleDocumentKeydown(event);
			main_core.Event.bind(document, 'keydown', this.viewerKeydownHandler, true);
			this.filterPointerdownHandler = event => {
				this.handleDocumentPointerdown(event);
			};
			main_core.Event.bind(document, 'pointerdown', this.filterPointerdownHandler, true);
			const host = this.getFilterHost();
			if (host) {
				this.filterFocusoutHandler = event => this.handleFilterFocusout(event);
				main_core.Event.bind(host, 'focusout', this.filterFocusoutHandler);
				this.filterInputHandler = event => this.handleFilterInput(event);
				main_core.Event.bind(host, 'input', this.filterInputHandler);
				this.filterKeydownHandler = event => this.handleFilterKeydown(event);
				main_core.Event.bind(host, 'keydown', this.filterKeydownHandler);
				this.filterClickHandler = () => this.enhanceFilterClearButton(host);
				main_core.Event.bind(host, 'click', this.filterClickHandler);
				this.enhanceFilterClearButton(host);
			}
			this.resizeObserver = new ResizeObserver(() => this.syncFilterHost());
			this.resizeObserver.observe(this.$el);
			this.$nextTick(() => this.syncFilterHost());
		},
		beforeUnmount() {
			const root = this.$el;
			if (this.trapHandler) {
				main_core.Event.unbind(root, 'keydown', this.trapHandler);
				this.trapHandler = null;
			}
			if (this.escapeHandler) {
				main_core.Event.unbind(document, 'keyup', this.escapeHandler, true);
				this.escapeHandler = null;
			}
			if (this.viewerKeydownHandler) {
				main_core.Event.unbind(document, 'keydown', this.viewerKeydownHandler, true);
				this.viewerKeydownHandler = null;
			}
			if (this.filterPointerdownHandler) {
				main_core.Event.unbind(document, 'pointerdown', this.filterPointerdownHandler, true);
				this.filterPointerdownHandler = null;
			}
			const host = this.getFilterHost();
			if (host && this.filterFocusoutHandler) {
				main_core.Event.unbind(host, 'focusout', this.filterFocusoutHandler);
			}
			this.filterFocusoutHandler = null;
			if (host && this.filterInputHandler) {
				main_core.Event.unbind(host, 'input', this.filterInputHandler);
			}
			this.filterInputHandler = null;
			if (host && this.filterKeydownHandler) {
				main_core.Event.unbind(host, 'keydown', this.filterKeydownHandler);
			}
			this.filterKeydownHandler = null;
			if (host && this.filterClickHandler) {
				main_core.Event.unbind(host, 'click', this.filterClickHandler);
			}
			this.filterClickHandler = null;
			if (this.resizeObserver) {
				this.resizeObserver.disconnect();
				this.resizeObserver = null;
			}
			this.observedBreadcrumbs = null;
			releasePreviewLayer();
		},
		methods: {
			getFilterHost() {
				return this.$el.querySelector('[data-disk-picker-filter-host]');
			},
			syncFilterHost() {
				const host = this.getFilterHost();
				if (!host) {
					return;
				}
				this.enhanceFilterClearButton(host);
				const root = this.$el;
				const slot = root.querySelector('[data-disk-picker-search-slot]');
				if (!useSessionStore().searchOpen || !slot) {
					return;
				}
				this.observeHeader(slot);
				const rootRect = root.getBoundingClientRect();
				const slotRect = slot.getBoundingClientRect();
				main_core.Dom.style(host, 'left', `${slotRect.left - rootRect.left}px`);
				main_core.Dom.style(host, 'top', `${slotRect.top - rootRect.top}px`);
				main_core.Dom.style(host, 'width', `${slotRect.width}px`);
				main_core.Dom.style(host, 'height', `${slotRect.height}px`);
			},
			observeHeader(slot) {
				if (!this.resizeObserver) {
					return;
				}
				this.resizeObserver.observe(slot);
				const breadcrumbs = this.$el.querySelector('[data-testid="universal-disk-picker-breadcrumbs"]');
				if (breadcrumbs !== this.observedBreadcrumbs) {
					if (this.observedBreadcrumbs) {
						this.resizeObserver.unobserve(this.observedBreadcrumbs);
					}
					if (breadcrumbs) {
						this.resizeObserver.observe(breadcrumbs);
					}
					this.observedBreadcrumbs = breadcrumbs;
				}
			},
			focusFilterFind() {
				const host = this.getFilterHost();
				const input = host?.querySelector(FILTER_FIND_SELECTOR) ?? null;
				try {
					input?.focus();
				} catch {
				}
				return input !== null;
			},
			isSearchMeaningless() {
				const session = useSessionStore();
				return session.filterFind === '' && session.objectTypeFilter === ObjectTypeFilter.All && session.fileTypeFilters.length === 0;
			},
			handleFilterInput(event) {
				const target = event.target;
				if (target instanceof HTMLInputElement && target.matches(FILTER_FIND_SELECTOR)) {
					useSessionStore().setFilterFind(target.value);
				}
				const host = this.getFilterHost();
				if (host) {
					this.enhanceFilterClearButton(host);
				}
			},
			enhanceFilterClearButton(host) {
				const button = host.querySelector(FILTER_CLEAR_SELECTOR);
				if (!button) {
					return;
				}
				if (button.getAttribute('role') !== 'button') {
					button.setAttribute('role', 'button');
					button.setAttribute('aria-label', this.loc('DISK_PICKER_SEARCH_CLEAR'));
				}
				const container = button.closest(FILTER_CLEAR_CONTAINER_SELECTOR);
				const visible = container !== null && main_core.Dom.hasClass(container, FILTER_CLEAR_VISIBLE_CLASS);
				if (visible) {
					button.setAttribute('tabindex', '0');
				} else {
					button.removeAttribute('tabindex');
				}
			},
			handleFilterKeydown(event) {
				if (event.key !== 'Enter' && event.key !== ' ') {
					return;
				}
				const target = event.target;
				if (!(target instanceof HTMLElement) || !target.matches(FILTER_CLEAR_SELECTOR)) {
					return;
				}
				event.preventDefault();
				target.click();
			},
			loc(messageCode) {
				return main_core.Loc.getMessage(messageCode) ?? '';
			},
			collapseSearch() {
				useSessionStore().setSearchOpen(false);
				this.$nextTick(() => {
					const button = this.$el.querySelector('[data-testid="universal-disk-picker-search-btn"]');
					button?.focus();
				});
			},
			handleDocumentKeydown(event) {
				if (event.key === 'Escape' && !event.repeat) {
					this.viewerEscapeArmed = useViewerStore().open;
				}
			},
			handleDocumentEscape(event) {
				if (event.key !== 'Escape') {
					return;
				}
				const armed = this.viewerEscapeArmed;
				this.viewerEscapeArmed = false;
				if (armed || useViewerStore().open) {
					event.stopImmediatePropagation();
					return;
				}
				if (!useSessionStore().searchOpen) {
					return;
				}
				const host = this.getFilterHost();
				const target = event.target;
				if (host === null || target === null) {
					return;
				}
				const insideHost = host.contains(target);
				if (!insideHost && !isRelatedFilterTarget(target, host)) {
					return;
				}
				event.stopImmediatePropagation();
				if (this.isSearchMeaningless()) {
					this.collapseSearch();
				} else if (!insideHost) {
					this.focusFilterFind();
				}
			},
			handleDocumentPointerdown(event) {
				const target = event.target;
				this.filterPointerdownActive = target instanceof Element && isRelatedFilterTarget(target, this.getFilterHost());
				setTimeout(() => {
					this.filterPointerdownActive = false;
				}, 0);
			},
			handleFilterFocusout(event) {
				const host = this.getFilterHost();
				const relatedTarget = event.relatedTarget;
				const movedToRelatedPopup = relatedTarget instanceof Element && isRelatedFilterTarget(relatedTarget, host);
				const filterPointerdownActive = this.filterPointerdownActive;
				this.filterPointerdownActive = false;
				setTimeout(() => {
					if (!useSessionStore().searchOpen) {
						return;
					}
					const active = document.activeElement;
					const activeInRelatedPopup = active instanceof Element && isRelatedFilterTarget(active, host);
					const stillInside = filterPointerdownActive || movedToRelatedPopup || host !== null && active !== null && (host.contains(active) || activeInRelatedPopup);
					if (!stillInside && this.isSearchMeaningless()) {
						useSessionStore().setSearchOpen(false);
					}
				}, 0);
			},
			handleTrap(event) {
				if (event.key !== 'Tab') {
					return;
				}
				if (useViewerStore().open) {
					return;
				}
				if (getFilterSettingsPopup(this.getFilterHost()) || document.querySelector(RELATED_POPUP_SELECTOR)) {
					return;
				}
				const active = document.activeElement;
				if (this.isInsideSearchAwayFromEdge(active, event.shiftKey) || this.isInsideActionsAwayFromEdge(active, event.shiftKey)) {
					return;
				}
				event.preventDefault();
				this.focusAdjacentGroup(this.groupOf(active), event.shiftKey ? -1 : 1);
			},
			groupOf(element) {
				const container = element?.closest(`[${GROUP_ATTRIBUTE}]`) ?? null;
				const id = container?.getAttribute(GROUP_ATTRIBUTE) ?? '';
				return GROUP_ORDER.includes(id) ? id : null;
			},
			isInsideSearchAwayFromEdge(active, backwards) {
				const host = this.getFilterHost();
				if (!host || !this.searchOpen || !(active instanceof HTMLElement) || !host.contains(active)) {
					return false;
				}
				const controls = listFocusableControls(host);
				const edge = backwards ? controls[0] : controls[controls.length - 1];
				return active !== edge;
			},
			isInsideActionsAwayFromEdge(active, backwards) {
				const root = this.$refs.actions?.$el ?? null;
				if (!root || !(active instanceof HTMLElement) || !root.contains(active)) {
					return false;
				}
				const controls = listFocusableControls(root);
				const edge = backwards ? controls[0] : controls[controls.length - 1];
				return active !== edge;
			},
			focusAdjacentGroup(from, direction) {
				const count = GROUP_ORDER.length;
				let index = from === null ? direction > 0 ? -1 : count : GROUP_ORDER.indexOf(from);
				for (let step = 0; step < count; step++) {
					index = (index + direction + count) % count;
					if (this.focusGroup(GROUP_ORDER[index], direction)) {
						return;
					}
				}
			},
			focusGroup(id, direction) {
				if (id === 'header' && this.searchOpen) {
					return direction > 0 ? this.focusFilterFind() : this.focusFilterLastControl();
				}
				if (id === 'actions' && direction < 0) {
					return this.focusActionsLastControl();
				}
				const owners = this.$refs;
				return owners[id]?.focusEntry?.() === true;
			},
			focusFilterLastControl() {
				const host = this.getFilterHost();
				const controls = host ? listFocusableControls(host) : [];
				const last = controls[controls.length - 1] ?? null;
				try {
					last?.focus();
				} catch {
				}
				return last !== null;
			},
			focusActionsLastControl() {
				const root = this.$refs.actions?.$el ?? null;
				const controls = root ? listFocusableControls(root) : [];
				const last = controls[controls.length - 1] ?? null;
				last?.focus();
				return last !== null;
			},
			focusInitialGroup() {
				if (this.initialFocusHandled) {
					return;
				}
				this.initialFocusHandled = true;
				const container = this.$el.closest('.disk-picker');
				const active = document.activeElement;
				const focusOnContainer = active === null || active === document.body || active === container;
				if (!focusOnContainer) {
					return;
				}
				const owners = this.$refs;
				owners.files?.focusEntry?.();
			},
			handleBoundaryWheel(event) {
				preventWheelScrollChaining(event);
			}
		},
		template: `
		<div class="disk-picker__root" @wheel="handleBoundaryWheel">
			<div
				data-disk-picker-filter-host
				data-disk-picker-group="header"
				data-testid="universal-disk-picker-search-filter"
				class="disk-picker__filter-host --ui-context-edge-dark"
				:class="{ '--open': searchOpen }"
			></div>
			<LoadingSkeleton v-if="!initialized"/>
			<PickerLayout v-else>
				<template #sidebar>
					<SourceSidebar ref="storage"/>
				</template>
				<template #header>
					<PickerToolbar ref="header"/>
				</template>
				<template #list>
					<ItemBrowser ref="files"/>
				</template>
				<template #preview>
					<PreviewPanel/>
				</template>
				<template #footer>
					<SelectionFooter ref="actions"/>
				</template>
			</PickerLayout>
		</div>
	`
	});

	const locMixin = {
		methods: {
			loc(name, replacements) {
				return main_core.Loc.getMessage(name, replacements) ?? '';
			}
		}
	};
	function mountPickerApp(container, props = {}) {
		const app = ui_vue3.BitrixVue.createApp(App, props);
		const pinia = ui_vue3_pinia.createPinia();
		app.use(pinia);
		ui_vue3_pinia.setActivePinia(pinia);
		app.mixin(locMixin);
		app.mount(container);
		let filterAdapter = null;
		return {
			unmount() {
				clearFolderPages();
				resetPreviews();
				resetRowActivation();
				resetSelectLimitNotice();
				filterAdapter?.dispose();
				filterAdapter = null;
				app.unmount();
				ui_vue3_pinia.disposePinia(pinia);
				if (ui_vue3_pinia.getActivePinia() === pinia) {
					ui_vue3_pinia.setActivePinia(undefined);
				}
			},
			start(options) {
				ui_vue3_pinia.setActivePinia(pinia);
				clearFolderPages();
				resetPreviews();
				const adapter = new MainUiFilterAdapter(options.filterId, pinia, options.callbacks, options.restoredFilter);
				filterAdapter = adapter;
				const restored = options.restoredFilter;
				const restoredMeaningful = restored.find !== '' || restored.objectTypeFilter !== ObjectTypeFilter.All || restored.fileTypeFilters.length > 0;
				useSessionStore().setSearchOpen(restoredMeaningful);
				useSessionStore().setCallbacks({
					...options.callbacks,
					suppressFilterFind: () => adapter.clearFindSuppressed(),
					resetFilters: () => adapter.resetFilters()
				});
				adapter.subscribe();
				void loadInitialStage({
					constraints: options.constraints,
					restoredFilter: options.restoredFilter,
					notify: options.callbacks.notify,
					onContextInvalid: options.callbacks.onContextInvalid
				});
			},
			notifyClosing() {
				ui_vue3_pinia.setActivePinia(pinia);
				clearFolderPages();
				resetPreviews();
				resetRowActivation();
				resetSelectLimitNotice();
				filterAdapter?.dispose();
				filterAdapter = null;
				const session = useSessionStore();
				session.setNavigationPending(false);
				session.setLoading(false);
				session.invalidateRequests();
			}
		};
	}

	exports.FILE_TYPE_ALIASES = FILE_TYPE_ALIASES;
	exports.applyFindSuppressed = applyFindSuppressed;
	exports.mountPickerApp = mountPickerApp;
	exports.normalizeFilterValues = normalizeFilterValues;
	exports.readInitialFilterValues = readInitialFilterValues;
	exports.resetInitialFilterValues = resetInitialFilterValues;

})(this.BX.Disk.DiskPickerInternal = this.BX.Disk.DiskPickerInternal || {}, BX.Main, window, window, window, window, BX, BX.Vue3, BX.Vue3.Pinia, BX.UI.IconSet.Api.Disk, BX.Event, BX.UI.System.Skeleton.Vue, BX, BX.UI.IconSet, BX.UI.Vue3.Components, BX.UI.System.Typography.Vue, BX.Vue3.Components, BX.UI.System, BX.UI.Accessibility, BX.UI);
//# sourceMappingURL=internal.bundle.js.map
