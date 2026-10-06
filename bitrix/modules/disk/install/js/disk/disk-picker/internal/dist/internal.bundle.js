/* eslint-disable */
this.BX = this.BX || {};
this.BX.Disk = this.BX.Disk || {};
(function (exports, main_date, ui_designTokens, ui_designTokens_air, ui_iconSet_outline, main_core, ui_vue3, ui_vue3_pinia, ui_iconSet_api_disk, ui_system_skeleton_vue, ui_iconSet_api_vue, ui_vue3_components_avatar, ui_system_typography_vue, main_polyfill_intersectionobserver, ui_vue3_components_button) {
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
		Collab: 'collab'
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
		ResolveSelection: 'disk.api.FilePicker.resolveSelection'
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

	const ITEM_KEYS = Object.freeze(['objectId', 'type', 'name', 'extension', 'size', 'updateTime', 'createTime', 'recentTime', 'selectable', 'fileType', 'source', 'preview']);
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
	const INITIAL_STAGE_RESPONSE_KEYS = Object.freeze(['stage', 'items', 'sources', 'pagination', 'context', 'emptyReason']);
	const LIST_CHILDREN_RESPONSE_KEYS = Object.freeze(['items', 'pagination', 'context', 'emptyReason']);
	const SEARCH_RESPONSE_KEYS = Object.freeze(['items', 'pagination', 'emptyReason']);
	const RESOLVE_RESPONSE_KEYS = Object.freeze(['items', 'rejectedItems', 'partial']);
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
		return {
			stage: mapStage(schema, response.stage, 'data.stage'),
			items: mapItems(schema, response.items, 'data.items'),
			sources: mapSources(schema, response.sources, 'data.sources'),
			pagination: mapPagination(schema, response.pagination, 'data.pagination'),
			context: mapContext(schema, response.context, 'data.context'),
			emptyReason: mapEmptyReason(schema, response.emptyReason, 'data.emptyReason')
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
			selectedSizes: {},
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
			}
		},
		actions: {
			has(objectId) {
				return this.selectedIds.includes(objectId);
			},
			add(objectId, size) {
				if (!this.selectedIds.includes(objectId)) {
					this.selectedIds = [...this.selectedIds, objectId];
					if (size !== undefined) {
						this.selectedSizes = {
							...this.selectedSizes,
							[objectId]: size
						};
					}
				}
			},
			remove(objectId) {
				this.selectedIds = this.selectedIds.filter(id => id !== objectId);
				const selectedSizes = {
					...this.selectedSizes
				};
				delete selectedSizes[objectId];
				this.selectedSizes = selectedSizes;
			},
			replaceWith(objectId, size) {
				this.selectedIds = [objectId];
				this.selectedSizes = size === undefined ? {} : {
					[objectId]: size
				};
			},
			setActive(objectId) {
				this.activeObjectId = objectId;
			},
			clear() {
				this.selectedIds = [];
				this.selectedSizes = {};
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
		requestCancel: () => {}
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
			contentError: null,
			emptyReason: null,
			hasMore: false,
			page: 1,
			loadingMore: false,
			emptyStreak: 0,
			paginationStalled: false,
			confirming: false,
			confirmationEpoch: 0,
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
				this.objectTypeFilter = filters.objectTypeFilter;
				this.fileTypeFilters = [...filters.fileTypeFilters];
			},
			setSearchQuery(query) {
				this.searchQuery = query;
			},
			setFilterFind(find) {
				this.filterFind = find.trim();
			},
			setSearchOpen(open) {
				this.searchOpen = open;
			},
			resetSearchQuery() {
				this.searchQuery = '';
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

	const useSourceStore = ui_vue3_pinia.defineStore('diskPickerSource', {
		state: () => ({
			sources: [],
			sourcesLoading: false,
			sourcesError: null
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
			reset() {
				this.sources = [];
				this.sourcesLoading = false;
				this.sourcesError = null;
			}
		}
	});

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
	function applySearchResult(session, item, result) {
		session.setBreadcrumbsFromContext(null);
		item.replace(result.items);
		useSelectionStore().pruneActive(result.items.map(entry => entry.objectId));
		session.setHasMore(result.pagination.hasMore);
		session.setEmptyReason(result.emptyReason);
		session.setLoading(false);
		session.markInitialized();
	}
	function startSourcesLoading(source) {
		source.setLoading(true);
		source.setError(null);
	}
	function applySourcesResult(source, result) {
		source.setSources(result.sources);
		source.setLoading(false);
	}
	function applySourcesError(source, code) {
		source.setError(code);
		source.setLoading(false);
	}
	async function loadSources(deps, session) {
		if (!session.isSessionActive()) {
			return;
		}
		const source = useSourceStore();
		startSourcesLoading(source);
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
				pageSize: PageSize.Recent,
				signedConfig: session.constraints.signedConfig
			});
			if (!session.isSessionActive()) {
				return;
			}
			applySourcesResult(source, result);
		} catch (error) {
			if (pickerErrorCode(error) === ErrorCode.InvalidContext) {
				session.invalidateRequests();
				deps.onContextInvalid();
				return;
			}
			if (!session.isSessionActive()) {
				return;
			}
			applySourcesError(source, pickerErrorCode(error));
		}
	}
	async function runRecovery(deps, session, item) {
		const recentFeed = {
			stageType: StageType.Recent,
			storageId: null,
			folderId: null
		};
		session.setFeed(recentFeed);
		useSelectionStore().clear();
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
		if (source !== null) {
			startSourcesLoading(source);
		}
		try {
			if (searchActive) {
				const result = await requestSearchPage(session, startFeed, query);
				if (session.isCurrentRequest(token)) {
					applySearchResult(session, item, result);
				}
				return;
			}
			const result = await requestStagePage(session, startFeed);
			if (source !== null && session.isSessionActive()) {
				applySourcesResult(source, result);
			}
			if (session.isCurrentRequest(token)) {
				const localFilters = startFeed.stageType === StageType.Recent ? session.filters : null;
				applyInitialStageResult(session, item, result, localFilters);
			}
		} catch (error) {
			const code = pickerErrorCode(error);
			if (source !== null && code !== ErrorCode.InvalidContext && session.isSessionActive()) {
				applySourcesError(source, code);
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

	const DEFAULT_ORDER_INPUT$1 = DEFAULT_ORDER;
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
	async function changeFeed(nextFeed, deps) {
		const session = useSessionStore();
		const item = useItemStore();
		if (session.isSameFeed(nextFeed)) {
			return;
		}
		if (nextFeed.storageId === null || nextFeed.folderId === null) {
			return;
		}
		const token = session.nextRequestToken();
		session.setLoading(true);
		session.setFeed(nextFeed);
		useSelectionStore().clear();
		deps.suppressFilterFind();
		session.setFilterFind('');
		session.resetSearchQuery();
		item.clear();
		session.setBreadcrumbs([]);
		session.setHasMore(false);
		session.clearContentError();
		try {
			const result = await listChildren({
				storageId: nextFeed.storageId,
				folderId: nextFeed.folderId,
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
			session.setBreadcrumbsFromContext(result.context);
			session.setHasMore(result.pagination.hasMore);
			session.setEmptyReason(result.emptyReason);
			session.setLoading(false);
		} catch (error) {
			handleFeedError(session, deps, error, token);
		}
	}
	async function reloadCurrentFeed(deps) {
		const session = useSessionStore();
		const item = useItemStore();
		const feed = session.feed;
		if (feed.storageId === null || feed.folderId === null) {
			return;
		}
		session.invalidateConfirmation();
		const token = session.nextRequestToken();
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
	function openFolder(item, deps) {
		return changeFeed({
			stageType: StageType.Folder,
			storageId: item.sourceId,
			folderId: item.objectId
		}, deps);
	}
	function openBreadcrumb(breadcrumb, deps) {
		const session = useSessionStore();
		const feed = session.feed;
		if (feed.stageType !== StageType.Folder || feed.storageId === null || feed.storageId <= 0) {
			return Promise.resolve();
		}
		return changeFeed({
			stageType: StageType.Folder,
			storageId: feed.storageId,
			folderId: breadcrumb.objectId
		}, deps);
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
		session.invalidateConfirmation();
		const token = session.nextRequestToken();
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
			item.replace(result.items);
			useSelectionStore().pruneActive(result.items.map(entry => entry.objectId));
			session.setHasMore(result.pagination.hasMore);
			session.setEmptyReason(result.emptyReason);
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
	function filtersDiffer(a, b) {
		return a.objectTypeFilter !== b.objectTypeFilter || a.fileTypeFilters.length !== b.fileTypeFilters.length || a.fileTypeFilters.some((alias, index) => alias !== b.fileTypeFilters[index]);
	}
	class MainUiFilterAdapter {
		#filterId;
		#pinia;
		#deps;
		#bus = null;
		#handler = null;
		#debounceTimer = null;
		#suppressing = false;
		#previous;
		constructor(filterId, pinia, deps, initial) {
			this.#filterId = filterId;
			this.#pinia = pinia;
			this.#deps = deps;
			this.#previous = cloneValues(initial);
		}
		subscribe() {
			const bus = getCustomEventBus();
			if (!bus || this.#handler) {
				return;
			}
			this.#bus = bus;
			this.#handler = filterId => {
				if (filterId !== this.#filterId || this.#suppressing) {
					return;
				}
				this.#scheduleProcess();
			};
			bus.addCustomEvent(window, APPLY_EVENT, this.#handler);
		}
		dispose() {
			if (this.#debounceTimer !== null) {
				clearTimeout(this.#debounceTimer);
				this.#debounceTimer = null;
			}
			if (this.#bus && this.#handler) {
				this.#bus.removeCustomEvent(window, APPLY_EVENT, this.#handler);
			}
			this.#handler = null;
			this.#bus = null;
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
		#scheduleProcess() {
			if (this.#debounceTimer !== null) {
				clearTimeout(this.#debounceTimer);
			}
			this.#debounceTimer = setTimeout(() => {
				this.#debounceTimer = null;
				this.#process();
			}, SEARCH_DEBOUNCE_MS);
		}
		#process() {
			const filter = getFilterById(this.#filterId);
			if (!filter) {
				return;
			}
			const normalized = readInitialFilterValues(filter);
			const filtersChanged = filtersDiffer(normalized, this.#previous);
			const queryChanged = normalized.find !== this.#previous.find;
			this.#previous = cloneValues(normalized);
			if (!filtersChanged && !queryChanged) {
				return;
			}
			ui_vue3_pinia.setActivePinia(this.#pinia);
			if (filtersChanged) {
				void applyFilters({
					objectTypeFilter: normalized.objectTypeFilter,
					fileTypeFilters: [...normalized.fileTypeFilters]
				}, this.#deps, normalized.find);
				return;
			}
			void searchItems(normalized.find, this.#deps);
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
			}
		},
		template: `
		<div class="disk-picker-layout" :class="{ '--table': isTable }">
			<div class="disk-picker-layout__sidebar">
				<slot name="sidebar"/>
			</div>
			<div class="disk-picker-layout__workarea">
				<div class="disk-picker-layout__header">
					<slot name="header"/>
				</div>
				<div class="disk-picker-layout__body">
					<div class="disk-picker-layout__list">
						<slot name="list"/>
					</div>
					<div class="disk-picker-layout__preview">
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

	const LoadingSkeleton = {
		name: 'DiskPickerLoadingSkeleton',
		components: {
			PickerLayout,
			BLine: ui_system_skeleton_vue.BLine,
			BCircle: ui_system_skeleton_vue.BCircle
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
				<div class="disk-picker-skeleton__sidebar-row">
					<BCircle :size="24"/>
					<BLine :width="sidebarWidths[0]" :height="10" :radius="4"/>
				</div>
				<div class="disk-picker-skeleton__group-title">
					<BLine :width="80" :height="8" :radius="4"/>
				</div>
				<div class="disk-picker-skeleton__sidebar-row">
					<BCircle :size="24"/>
					<BLine :width="sidebarWidths[1]" :height="10" :radius="4"/>
				</div>
				<div class="disk-picker-skeleton__group-title">
					<BLine :width="80" :height="8" :radius="4"/>
				</div>
				<div
					v-for="width in sidebarWidths.slice(2)"
					class="disk-picker-skeleton__sidebar-row"
				>
					<BCircle :size="24"/>
					<BLine :width="width" :height="10" :radius="4"/>
				</div>
			</template>

			<template #header>
				<BLine :width="120" :height="16" :radius="4"/>
				<div class="disk-picker-skeleton__header-actions">
					<BLine :width="34" :height="34" :radius="8"/>
					<BLine :width="68" :height="34" :radius="8"/>
				</div>
			</template>

			<template #list>
				<div class="disk-picker-skeleton__group-title">
					<BLine :width="72" :height="8" :radius="4"/>
				</div>
				<div class="disk-picker-skeleton__list-rows">
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
				<div class="disk-picker-skeleton__preview">
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
				<BLine :width="84" :height="38" :radius="8"/>
				<BLine :width="120" :height="38" :radius="8"/>
			</template>
		</PickerLayout>
	`
	};

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
		const token = session.nextRequestToken();
		session.setLoading(true);
		session.setFeed(RECENT_FEED);
		useSelectionStore().clear();
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

	function resolveCompositeNavigationIndex(currentIndex, itemCount, key, pageSize) {
		if (itemCount === 0) {
			return -1;
		}
		const lastIndex = itemCount - 1;
		const current = Math.min(Math.max(currentIndex, 0), lastIndex);
		const page = Math.max(1, pageSize);
		switch (key) {
			case 'ArrowDown':
				return Math.min(current + 1, lastIndex);
			case 'ArrowUp':
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

	const SOURCE_ROW_HEIGHT = 40;
	const SOURCE_GROUP_HEIGHT = 28;
	const SOURCE_VIEWPORT_HEIGHT = 640;
	const SOURCE_OVERSCAN = 200;
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
			TextSm: ui_system_typography_vue.TextSm,
			TextXs: ui_system_typography_vue.TextXs
		},
		setup() {
			return {
				recentIcon: ui_iconSet_api_vue.Outline.RECENT_ITEMS
			};
		},
		data() {
			return {
				focusHandled: false,
				focusedSourceKey: null,
				scrollTop: 0,
				pendingScrollTop: 0,
				scrollFrame: null
			};
		},
		mounted() {
			this.maybeFocusFirstStorage();
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
					sources: sources.filter(source => source.storageType === StorageType.Common)
				}, {
					titleKey: 'DISK_PICKER_SOURCE_GROUP_GROUPS',
					sources: sources.filter(source => source.storageType === StorageType.Group || source.storageType === StorageType.Project)
				}, {
					titleKey: 'DISK_PICKER_SOURCE_GROUP_COLLABS',
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
						source,
						top,
						height: SOURCE_ROW_HEIGHT
					});
					top += SOURCE_ROW_HEIGHT;
				};
				this.personal.forEach(source => addSource(source));
				this.groups.forEach(group => {
					entries.push({
						key: `group-${group.titleKey}`,
						type: 'group',
						titleKey: group.titleKey,
						source: null,
						top,
						height: SOURCE_GROUP_HEIGHT
					});
					top += SOURCE_GROUP_HEIGHT;
					group.sources.forEach(source => addSource(source));
				});
				return entries;
			},
			visibleSourceEntries() {
				return sourceWindow(this.sourceEntries, Math.max(0, this.scrollTop - SOURCE_ROW_HEIGHT));
			},
			sourceNavigationKeys() {
				return ['recent', ...this.sourceEntries.filter(entry => entry.type === 'source').map(entry => entry.key)];
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
				this.maybeFocusFirstStorage();
				this.$nextTick(() => this.revealActiveSource());
			},
			activeStorageId() {
				this.$nextTick(() => this.revealActiveSource());
			}
		},
		methods: {
			loc(messageCode) {
				return main_core.Loc.getMessage(messageCode) ?? '';
			},
			maybeFocusFirstStorage() {
				if (this.focusHandled || this.sourceCount === 0) {
					return;
				}
				this.$nextTick(() => {
					const container = this.$el.closest('.disk-picker');
					const active = document.activeElement;
					const focusOnContainer = active === null || active === document.body || active === container;
					if (!focusOnContainer) {
						this.focusHandled = true;
						return;
					}
					const first = this.$el.querySelector('.disk-picker-source-sidebar__item:not(.--recent)');
					if (first) {
						this.focusedSourceKey = first.dataset.compositeId ?? null;
						first.focus();
						this.focusHandled = true;
					}
				});
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
					size: 24
				};
			},
			isPersonalSource(source) {
				return source.storageType === StorageType.User;
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
				const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End', 'PageDown', 'PageUp'];
				if (!keys.includes(event.key)) {
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
				const pageSize = Math.max(1, Math.floor((scroll.clientHeight || SOURCE_VIEWPORT_HEIGHT) / SOURCE_ROW_HEIGHT));
				const nextIndex = resolveCompositeNavigationIndex(currentIndex, this.sourceNavigationKeys.length, event.key, pageSize);
				const key = this.sourceNavigationKeys[nextIndex];
				const entry = this.sourceEntries.find(sourceEntry => sourceEntry.key === key);
				const entryTop = key === 'recent' ? 0 : SOURCE_ROW_HEIGHT + (entry?.top ?? 0);
				const nextScrollTop = scrollOffsetForEntry(entryTop, SOURCE_ROW_HEIGHT, scroll.scrollTop, scroll.clientHeight || SOURCE_VIEWPORT_HEIGHT);
				this.focusedSourceKey = key;
				scroll.scrollTop = nextScrollTop;
				this.scrollTop = nextScrollTop;
				this.pendingScrollTop = nextScrollTop;
				this.$nextTick(() => focusCompositeItem(scroll, key));
			},
			handleRetrySources() {
				void retrySources();
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
				const activeTop = SOURCE_ROW_HEIGHT + active.top;
				if (activeTop < scroll.scrollTop || activeTop + active.height > scroll.scrollTop + scroll.clientHeight) {
					scroll.scrollTop = Math.max(0, activeTop - SOURCE_GROUP_HEIGHT);
					this.scrollTop = scroll.scrollTop;
					this.pendingScrollTop = scroll.scrollTop;
				}
			}
		},
		beforeUnmount() {
			if (this.scrollFrame !== null) {
				cancelAnimationFrame(this.scrollFrame);
				this.scrollFrame = null;
			}
		},
		template: `
		<div class="disk-picker-source-sidebar" data-testid="universal-disk-picker-sidebar">
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
					:aria-current="isRecentActive ? 'page' : null"
					:tabindex="sourceFocusKey === 'recent' ? 0 : -1"
					data-composite-id="recent"
					data-testid="universal-disk-picker-source-recent"
					@click="handleSelectRecent"
				>
					<BIcon :name="recentIcon" :size="24"/>
					<TextSm class="disk-picker-source-sidebar__name">{{ loc('DISK_PICKER_SOURCE_RECENT') }}</TextSm>
				</button>
				<div v-if="error" class="disk-picker-source-sidebar__error">
					<TextXs>{{ loc('DISK_PICKER_SOURCE_LOAD_FAILED') }}</TextXs>
					<button
						type="button"
						class="disk-picker-source-sidebar__retry"
						:disabled="loading"
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
						>{{ loc(entry.titleKey) }}</TextXs>
						<button
							v-else
							type="button"
							class="disk-picker-source-sidebar__item"
							:class="{ '--active': isActive(entry.source) }"
							:aria-current="isActive(entry.source) ? 'page' : null"
							:tabindex="sourceFocusKey === entry.key ? 0 : -1"
							:data-composite-id="entry.key"
							:data-testid="'universal-disk-picker-source-' + entry.source.storageId"
							@click="handleSelect(entry.source)"
						>
							<span
								class="disk-picker-source-sidebar__avatar"
								:data-testid="'universal-disk-picker-source-' + entry.source.storageId + '-avatar'"
								aria-hidden="true"
							>
								<span
									v-if="isPersonalSource(entry.source)"
									class="disk-picker-source-sidebar__personal-avatar"
								></span>
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
				</template>
			</div>
		</div>
	`
	});

	const Breadcrumbs = ui_vue3.defineComponent({
		name: 'DiskPickerBreadcrumbs',
		components: {
			TextSm: ui_system_typography_vue.TextSm
		},
		computed: {
			crumbs() {
				return useSessionStore().breadcrumbs;
			},
			overflowCrumb() {
				return this.crumbs.length >= 3 ? this.crumbs[this.crumbs.length - 3] : null;
			},
			linkCrumbs() {
				if (this.crumbs.length >= 3) {
					return [this.crumbs[this.crumbs.length - 2]];
				}
				return this.crumbs.slice(0, -1);
			},
			current() {
				return this.crumbs.length > 0 ? this.crumbs[this.crumbs.length - 1] : null;
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
			handleAncestor(crumb) {
				void openBreadcrumb(crumb, useSessionStore().callbacks);
			}
		},
		template: `
		<nav class="disk-picker-breadcrumbs" data-testid="universal-disk-picker-breadcrumbs">
			<template v-if="overflowCrumb">
				<button
					type="button"
					class="disk-picker-breadcrumbs__link disk-picker-breadcrumbs__overflow"
					:title="overflowCrumb.name"
					:aria-label="navigateLabel(overflowCrumb)"
					data-testid="universal-disk-picker-breadcrumb-overflow"
					@click="handleAncestor(overflowCrumb)"
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
					@click="handleAncestor(crumb)"
				>
					<TextSm class="disk-picker-breadcrumbs__label">{{ crumb.name }}</TextSm>
				</button>
				<span class="disk-picker-breadcrumbs__separator" aria-hidden="true">&rsaquo;</span>
			</template>
			<TextSm
				v-if="current"
				class="disk-picker-breadcrumbs__current"
				:title="current.name"
			>{{ current.name }}</TextSm>
		</nav>
	`
	});

	const PickerToolbar = ui_vue3.defineComponent({
		name: 'DiskPickerToolbar',
		components: {
			Breadcrumbs,
			BIcon: ui_iconSet_api_vue.BIcon,
			TextSm: ui_system_typography_vue.TextSm
		},
		setup() {
			return {
				ViewMode,
				Outline: ui_iconSet_api_vue.Outline
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
			openSearch() {
				useSessionStore().setSearchOpen(true);
			}
		},
		template: `
		<div class="disk-picker-toolbar" data-testid="universal-disk-picker-header">
			<div class="disk-picker-toolbar__title" :class="{ '--search-open': searchOpen }">
				<Breadcrumbs v-if="hasBreadcrumbs"/>
				<TextSm v-else class="disk-picker-toolbar__title-text" :title="fallbackTitle">{{ fallbackTitle }}</TextSm>
			</div>
			<button
				v-if="!searchOpen"
				type="button"
				class="disk-picker-toolbar__search-button"
				:aria-label="loc('DISK_PICKER_SEARCH_OPEN')"
				data-testid="universal-disk-picker-search-btn"
				@click="openSearch"
			>
				<BIcon :name="Outline.SEARCH" :size="20"/>
			</button>
			<div
				v-else
				class="disk-picker-toolbar__search-slot"
				data-disk-picker-search-slot
			></div>
			<div class="disk-picker-toolbar__view-toggle" role="group" :aria-label="loc('DISK_PICKER_VIEW_TOGGLE')">
				<button
					type="button"
					class="disk-picker-toolbar__view-button"
					:class="{ '--active': viewMode === ViewMode.List }"
					:aria-pressed="viewMode === ViewMode.List"
					:aria-label="loc('DISK_PICKER_VIEW_LIST')"
					data-testid="universal-disk-picker-view-list"
					@click="setViewMode(ViewMode.List)"
				>
					<BIcon :name="Outline.LIST_VIEWER" :size="22"/>
				</button>
				<button
					type="button"
					class="disk-picker-toolbar__view-button"
					:class="{ '--active': viewMode === ViewMode.Table }"
					:aria-pressed="viewMode === ViewMode.Table"
					:aria-label="loc('DISK_PICKER_VIEW_TABLE')"
					data-testid="universal-disk-picker-view-table"
					@click="setViewMode(ViewMode.Table)"
				>
					<BIcon :name="Outline.BULLETED_LIST" :size="22"/>
				</button>
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
		if (!session.hasMore || session.loadingMore || session.paginationStalled || session.stageType === StageType.Sources && !isSearchActive(session) || session.stageType === StageType.Recent && !isSearchActive(session)) {
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

	const EmptyState = ui_vue3.defineComponent({
		name: 'DiskPickerEmptyState',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon,
			TextSm: ui_system_typography_vue.TextSm
		},
		props: {
			icon: {
				type: String,
				required: true
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
			<BIcon :name="icon" :size="48" class="disk-picker-empty-state__icon"/>
			<TextSm class="disk-picker-empty-state__title">{{ title }}</TextSm>
			<button
				v-if="actionLabel"
				type="button"
				class="disk-picker-empty-state__action"
				:data-testid="actionTestId"
				@click="$emit('action')"
			>
				{{ actionLabel }}
			</button>
		</div>
	`
	});

	const DEFAULT_MAX_ITEMS = 100;
	const SELECT_LIMIT_MESSAGE$1 = 'DISK_PICKER_NOTIFY_SELECT_LIMIT';
	function effectiveMaxItems(maxItems) {
		return Math.min(maxItems ?? DEFAULT_MAX_ITEMS, DEFAULT_MAX_ITEMS);
	}
	function toggleSelection(item, modifier, deps) {
		const session = useSessionStore();
		if (session.confirming) {
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
			selection.replaceWith(item.objectId, item.size ?? 0);
			return;
		}
		if (!modifier) {
			selection.replaceWith(item.objectId, item.size ?? 0);
			return;
		}
		if (selection.has(item.objectId)) {
			selection.remove(item.objectId);
			return;
		}
		const maxItems = effectiveMaxItems(session.constraints.maxItems);
		if (selection.count >= maxItems) {
			deps.notify(SELECT_LIMIT_MESSAGE$1, {
				'#COUNT#': String(maxItems)
			});
			return;
		}
		selection.add(item.objectId, item.size ?? 0);
	}

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
			}
		},
		data() {
			return {
				icon: null,
				previewObserver: null
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
				this.stopPreviewObserver();
				this.icon?.setPreviewUrl(null);
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
			this.icon = icon;
			this.observePreview();
		},
		beforeUnmount() {
			this.stopPreviewObserver();
			this.icon?.destroy();
			this.icon = null;
		},
		methods: {
			observePreview() {
				const url = this.previewUrl ?? null;
				const node = this.$el;
				if (url === null || !node) {
					return;
				}
				const observer = new IntersectionObserver(entries => {
					if (!entries.some(entry => entry.isIntersecting)) {
						return;
					}
					this.stopPreviewObserver();
					this.icon?.setPreviewUrl(url);
				}, PREVIEW_OBSERVER_OPTIONS);
				observer.observe(node);
				this.previewObserver = ui_vue3.markRaw(observer);
			},
			stopPreviewObserver() {
				this.previewObserver?.disconnect();
				this.previewObserver = null;
			}
		},
		template: `
		<span class="disk-picker-disk-icon"></span>
	`
	});

	const ItemRow = ui_vue3.defineComponent({
		name: 'DiskPickerItemRow',
		components: {
			BDiskIcon: DiskIconView,
			TextSm: ui_system_typography_vue.TextSm
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
			activate(modifier) {
				if (this.disabled) {
					return;
				}
				toggleSelection(this.item, modifier, useSessionStore().callbacks);
			},
			handleClick(event) {
				this.activate(event.metaKey || event.ctrlKey);
			},
			handleKeydown(event) {
				if (event.key === ' ' || event.key === 'Spacebar') {
					event.preventDefault();
					this.activate(true);
				}
			}
		},
		template: `
		<button
			type="button"
			class="disk-picker-item-row"
			:class="rowClass"
			:tabindex="tabIndex"
			:aria-pressed="ariaPressed"
			:aria-disabled="disabled ? 'true' : null"
			:data-composite-id="item.objectId"
			:data-testid="testId"
			@click="handleClick"
			@keydown="handleKeydown"
		>
			<BDiskIcon :type="item.iconType" :size="24" :preview-url="item.previewUrl"/>
			<TextSm class="disk-picker-item-row__name">{{ item.name }}</TextSm>
		</button>
	`
	});

	function formatDate(timestampInSeconds) {
		if (!main_core.Type.isNumber(timestampInSeconds)) {
			return '';
		}
		return main_date.DateTimeFormat.format(main_date.DateTimeFormat.getFormat('FORMAT_DATE'), timestampInSeconds);
	}
	function formatTableDate(timestampInSeconds, todayText, nowInSeconds = Math.floor(Date.now() / 1000)) {
		if (!main_core.Type.isNumber(timestampInSeconds)) {
			return '';
		}
		const dateKey = main_date.DateTimeFormat.format('Y-m-d', timestampInSeconds);
		const todayKey = main_date.DateTimeFormat.format('Y-m-d', nowInSeconds);
		if (dateKey === todayKey) {
			return todayText;
		}
		const year = main_date.DateTimeFormat.format('Y', timestampInSeconds);
		const currentYear = main_date.DateTimeFormat.format('Y', nowInSeconds);
		if (year === currentYear) {
			return main_date.DateTimeFormat.format(main_date.DateTimeFormat.getFormat('DAY_MONTH_FORMAT'), timestampInSeconds);
		}
		return formatDate(timestampInSeconds);
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
			Text2Xs: ui_system_typography_vue.Text2Xs,
			TextSm: ui_system_typography_vue.TextSm
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
			addedText(item) {
				return formatTableDate(item.createTime, this.loc('DISK_PICKER_TABLE_TODAY'));
			},
			activate(item, modifier) {
				if (this.isDisabled(item)) {
					return;
				}
				toggleSelection(item, modifier, useSessionStore().callbacks);
			},
			handleClick(item, event) {
				this.activate(item, event.metaKey || event.ctrlKey);
			},
			handleKeydown(item, event) {
				if (event.key === ' ' || event.key === 'Spacebar') {
					event.preventDefault();
					this.activate(item, true);
				}
			}
		},
		template: `
		<table class="disk-picker-item-table" data-testid="universal-disk-picker-table">
			<colgroup>
				<col class="--name">
				<col class="--size">
				<col class="--added">
			</colgroup>
			<thead>
				<tr class="disk-picker-item-table__head">
					<th scope="col" class="disk-picker-item-table__cell --name">
						<Text2Xs :accent="true">{{ loc('DISK_PICKER_TABLE_NAME') }}</Text2Xs>
					</th>
					<th scope="col" class="disk-picker-item-table__cell --size">
						<Text2Xs :accent="true">{{ loc('DISK_PICKER_TABLE_SIZE') }}</Text2Xs>
					</th>
					<th scope="col" class="disk-picker-item-table__cell --added">
						<Text2Xs :accent="true">{{ loc('DISK_PICKER_TABLE_ADDED') }}</Text2Xs>
					</th>
				</tr>
			</thead>
			<tbody>
				<tr v-if="topSpacerHeight > 0" aria-hidden="true">
					<td :style="{ height: topSpacerHeight + 'px' }" colspan="3"></td>
				</tr>
				<tr
					v-for="item in items"
					:key="item.objectId"
					class="disk-picker-item-table__row"
					:class="rowClass(item)"
					:data-testid="testId(item)"
					@click="handleClick(item, $event)"
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
							<TextSm class="disk-picker-item-table__name">{{ item.name }}</TextSm>
						</button>
					</td>
					<td class="disk-picker-item-table__cell --size"><TextSm>{{ sizeText(item) }}</TextSm></td>
					<td class="disk-picker-item-table__cell --added"><TextSm>{{ addedText(item) }}</TextSm></td>
				</tr>
				<tr v-if="bottomSpacerHeight > 0" aria-hidden="true">
					<td :style="{ height: bottomSpacerHeight + 'px' }" colspan="3"></td>
				</tr>
			</tbody>
		</table>
	`
	});

	const LIST_ROW_HEIGHT = 44;
	const GROUP_TITLE_HEIGHT = 28;
	const TABLE_ROW_HEIGHT = 45;
	const VIRTUAL_VIEWPORT_HEIGHT = 640;
	const VIRTUAL_OVERSCAN = 440;
	const PAGINATION_ROOT_MARGIN = '120px 0px';
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
			EmptyState,
			ItemRow,
			ItemTable,
			TextXs: ui_system_typography_vue.TextXs
		},
		setup() {
			return {
				ViewMode
			};
		},
		data() {
			return {
				pendingNavFocus: false,
				focusedObjectId: null,
				virtualScrollTop: 0,
				paginationObserver: null,
				scrollFrame: null,
				pendingScrollTop: 0
			};
		},
		computed: {
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
				const focusedExists = this.items.some(item => item.objectId === this.focusedObjectId);
				if (focusedExists) {
					return this.focusedObjectId;
				}
				const activeObjectId = useSelectionStore().activeObjectId;
				return this.items.some(item => item.objectId === activeObjectId) ? activeObjectId : this.items[0]?.objectId ?? null;
			},
			contentLoading() {
				return this.session.contentLoading;
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
							height: GROUP_TITLE_HEIGHT
						});
						top += GROUP_TITLE_HEIGHT;
					}
					group.items.forEach(item => {
						entries.push({
							key: `item-${item.objectId}`,
							type: 'item',
							label: '',
							item,
							top,
							height: LIST_ROW_HEIGHT
						});
						top += LIST_ROW_HEIGHT;
					});
				});
				return entries;
			},
			virtualListWindow() {
				return windowByOffset(this.virtualEntries, this.virtualScrollTop);
			},
			virtualTableWindow() {
				const start = Math.max(0, Math.floor((this.virtualScrollTop - VIRTUAL_OVERSCAN) / TABLE_ROW_HEIGHT));
				const visibleCount = Math.ceil((VIRTUAL_VIEWPORT_HEIGHT + 2 * VIRTUAL_OVERSCAN) / TABLE_ROW_HEIGHT);
				const end = Math.min(this.items.length, start + visibleCount);
				return {
					items: this.items.slice(start, end),
					top: start * TABLE_ROW_HEIGHT,
					bottom: (this.items.length - end) * TABLE_ROW_HEIGHT
				};
			},
			announcement() {
				if (this.session.contentLoading) {
					return '';
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
				this.virtualScrollTop = 0;
				if (root && root.contains(document.activeElement)) {
					this.pendingNavFocus = true;
				}
				if (root) {
					root.scrollTop = 0;
				}
			},
			viewMode() {
				this.virtualScrollTop = 0;
				this.$nextTick(() => this.observePaginationSentinel());
			},
			'items.length': function () {
				this.$nextTick(() => this.observePaginationSentinel());
			},
			contentLoading(loading) {
				if (!loading) {
					this.$nextTick(() => this.observePaginationSentinel());
				}
				if (!loading && this.pendingNavFocus) {
					this.pendingNavFocus = false;
					this.$nextTick(() => this.focusAfterNavigation());
				}
			}
		},
		mounted() {
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
		},
		methods: {
			loc(messageCode, replacements) {
				return main_core.Loc.getMessage(messageCode, replacements) ?? '';
			},
			focusAfterNavigation() {
				const root = this.$el;
				if (!root) {
					return;
				}
				const active = document.activeElement;
				const focusLostOrStillInList = active === document.body || root.contains(active);
				if (!focusLostOrStillInList) {
					return;
				}
				const first = root.querySelector('[data-composite-id]');
				(first ?? root).focus();
			},
			handleCompositeFocus(event) {
				const target = event.target.closest('[data-composite-id]');
				if (target) {
					this.focusedObjectId = Number(target.dataset.compositeId);
				}
			},
			handleCompositeKeydown(event) {
				const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End', 'PageDown', 'PageUp'];
				if (!keys.includes(event.key)) {
					return;
				}
				const target = event.target.closest('[data-composite-id]');
				const currentIndex = this.items.findIndex(item => item.objectId === Number(target?.dataset.compositeId));
				if (currentIndex < 0) {
					return;
				}
				event.preventDefault();
				const root = this.$el;
				const rowHeight = this.viewMode === ViewMode.Table ? TABLE_ROW_HEIGHT : LIST_ROW_HEIGHT;
				const pageSize = Math.max(1, Math.floor((root.clientHeight || VIRTUAL_VIEWPORT_HEIGHT) / rowHeight));
				const nextIndex = resolveCompositeNavigationIndex(currentIndex, this.items.length, event.key, pageSize);
				const item = this.items[nextIndex];
				if (!item) {
					return;
				}
				const entryTop = this.viewMode === ViewMode.Table ? nextIndex * TABLE_ROW_HEIGHT : this.virtualEntries.find(entry => entry.item?.objectId === item.objectId)?.top ?? 0;
				const nextScrollTop = scrollOffsetForEntry(entryTop, rowHeight, root.scrollTop, root.clientHeight || VIRTUAL_VIEWPORT_HEIGHT);
				this.focusedObjectId = item.objectId;
				root.scrollTop = nextScrollTop;
				this.pendingScrollTop = nextScrollTop;
				this.virtualScrollTop = nextScrollTop;
				this.$nextTick(() => focusCompositeItem(root, item.objectId));
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
				if (sentinel) {
					this.paginationObserver?.observe(sentinel);
				}
			},
			handleRetryContent() {
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
				void retryNextPage(this.session.callbacks);
			},
			handleResetFilters() {
				this.session.callbacks.resetFilters();
			}
		},
		template: `
		<div
			class="disk-picker-item-browser"
			tabindex="-1"
			@focusin="handleCompositeFocus"
			@keydown="handleCompositeKeydown"
			@scroll.passive="handleVirtualScroll"
		>
			<div class="disk-picker-item-browser__status" role="status" aria-live="polite">{{ announcement }}</div>

			<EmptyState
				v-if="hasError"
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
					:focus-object-id="focusObjectId"
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
						data-testid="universal-disk-picker-load-more-retry"
						@click="handleRetryNextPage"
					>
						{{ loc('DISK_PICKER_RETRY') }}
					</button>
				</div>
				<div ref="paginationSentinel" class="disk-picker-item-browser__sentinel" aria-hidden="true"></div>
			</template>
		</div>
	`
	});

	const FAN_LIMIT = 5;
	const PreviewPanel = ui_vue3.defineComponent({
		name: 'DiskPickerPreviewPanel',
		components: {
			BDiskIcon: DiskIconView,
			TextSm: ui_system_typography_vue.TextSm,
			TextXs: ui_system_typography_vue.TextXs
		},
		computed: {
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
			isMultipleMode() {
				return useSessionStore().constraints.selectionMode === SelectionMode.Multiple;
			},
			multiSelectShortcut() {
				return main_core.Browser.isMac() ? 'Cmd' : 'Ctrl';
			},
			selectedItems() {
				const item = useItemStore();
				return useSelectionStore().selectedIds.map(objectId => item.getById(objectId)).filter(entry => entry !== null);
			},
			showEmpty() {
				return this.activeItem === null;
			},
			showMulti() {
				return this.activeItem !== null && this.count > 1;
			},
			showSingle() {
				return this.activeItem !== null && this.count <= 1;
			},
			fanItems() {
				return this.selectedItems.slice(0, FAN_LIMIT);
			},
			multiTitle() {
				return this.loc('DISK_PICKER_PREVIEW_MULTI_TITLE', {
					'#COUNT#': String(this.count)
				});
			},
			multiSize() {
				const selection = useSelectionStore();
				const item = useItemStore();
				const total = selection.selectedIds.reduce((sum, objectId) => {
					return sum + (selection.selectedSizes[objectId] ?? item.getById(objectId)?.size ?? 0);
				}, 0);
				return formatSize(total);
			},
			singleProps() {
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
				}, {
					key: 'source',
					label: this.loc('DISK_PICKER_PREVIEW_PROP_SOURCE'),
					value: item.sourceTitle
				}];
			}
		},
		methods: {
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
					<TextXs>{{ loc('DISK_PICKER_PREVIEW_EMPTY_HINT') }}</TextXs>
					<TextXs
						v-if="isMultipleMode"
						class="disk-picker-preview-panel__multi-hint"
						data-testid="universal-disk-picker-preview-empty-shortcut"
					>
						<span>{{ loc('DISK_PICKER_PREVIEW_EMPTY_HINT_MULTI') }}</span>
						<span class="disk-picker-preview-panel__multi-hint-action">
							<span>{{ loc('DISK_PICKER_PREVIEW_EMPTY_HINT_MULTI_ACTION') }}</span>
							<kbd>{{ multiSelectShortcut }}</kbd>
							<span aria-hidden="true">+</span>
							<span
								class="disk-picker-preview-panel__click"
								data-testid="universal-disk-picker-preview-empty-click"
								role="img"
								:aria-label="loc('DISK_PICKER_PREVIEW_MOUSE_CLICK_ARIA')"
							></span>
						</span>
					</TextXs>
				</div>
			</div>

			<div v-else-if="showMulti" class="disk-picker-preview-panel__multi" data-testid="universal-disk-picker-preview-multi">
				<div class="disk-picker-preview-panel__fan">
					<div
						v-for="item in fanItems"
						:key="item.objectId"
						class="disk-picker-preview-panel__fan-thumb"
					>
						<BDiskIcon :type="item.iconType" :size="24" :preview-url="item.previewUrl"/>
					</div>
				</div>
				<TextSm class="disk-picker-preview-panel__multi-title">{{ multiTitle }}</TextSm>
				<div class="disk-picker-preview-panel__props">
					<div class="disk-picker-preview-panel__prop">
						<TextXs class="disk-picker-preview-panel__prop-label">{{ loc('DISK_PICKER_PREVIEW_PROP_SIZE') }}</TextXs>
						<TextXs class="disk-picker-preview-panel__prop-value">{{ multiSize }}</TextXs>
					</div>
				</div>
			</div>

			<div v-else-if="showSingle" class="disk-picker-preview-panel__single" data-testid="universal-disk-picker-preview-single">
				<div class="disk-picker-preview-panel__thumb">
					<img
						v-if="activeItem.previewUrl"
						class="disk-picker-preview-panel__image"
						:src="activeItem.previewUrl"
						:alt="activeItem.name"
					/>
					<BDiskIcon v-else :type="activeItem.iconType" :size="64"/>
				</div>
				<TextSm class="disk-picker-preview-panel__name">{{ activeItem.name }}</TextSm>
				<div class="disk-picker-preview-panel__props">
					<div
						v-for="prop in singleProps"
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

	const SelectionFooter = ui_vue3.defineComponent({
		name: 'DiskPickerSelectionFooter',
		components: {
			Button: ui_vue3_components_button.Button
		},
		setup() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize
			};
		},
		computed: {
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
				return this.canConfirm ? this.loc('DISK_PICKER_CONFIRM') : this.loc('DISK_PICKER_CONFIRM_EMPTY');
			}
		},
		methods: {
			loc(messageCode) {
				return main_core.Loc.getMessage(messageCode) ?? '';
			},
			handleCancel() {
				useSessionStore().callbacks.requestCancel();
			},
			handleConfirm() {
				void submitSelection(useSessionStore().callbacks);
			}
		},
		template: `
		<div class="disk-picker-selection-footer">
			<Button
				:text="loc('DISK_PICKER_CANCEL')"
				:style="AirButtonStyle.PLAIN"
				:size="ButtonSize.LARGE"
				:dataset="{ testid: 'universal-disk-picker-cancel-btn' }"
				@click="handleCancel"
			/>
			<Button
				:text="confirmText"
				:style="AirButtonStyle.FILLED"
				:size="ButtonSize.LARGE"
				:disabled="!canConfirm"
				:loading="confirming"
				:right-counter-value="count"
				:dataset="{ testid: 'universal-disk-picker-confirm-btn' }"
				@click="handleConfirm"
			/>
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

	const FOCUSABLE_SELECTOR = ['a[href]', 'button:not([disabled])', 'input:not([disabled])', 'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])'].join(',');
	const RELATED_POPUP_SELECTOR = '.main-ui-filter-popup, .menu-popup.popup-window-show, .main-ui-select-inner.--open';
	const FILTER_PRESET_SELECTOR = '.main-ui-filter-sidebar-item';
	const OPEN_POPUP_SELECTOR = '.popup-window.--open';
	const FILTER_FIND_SELECTOR = ['.main-ui-filter-field-search input', 'input.main-ui-filter-search-filter', 'input[name="FIND"]'].join(',');
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
				filterPresetPointerdownHandler: null,
				filterPresetPointerdownActive: false,
				filterFocusoutHandler: null,
				filterInputHandler: null,
				resizeObserver: null,
				observedBreadcrumbs: null
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
				this.$nextTick(() => this.syncFilterHost());
			}
		},
		mounted() {
			this.trapHandler = event => this.handleTrap(event);
			main_core.Event.bind(this.$el, 'keydown', this.trapHandler);
			this.escapeHandler = event => this.handleDocumentEscape(event);
			main_core.Event.bind(document, 'keyup', this.escapeHandler, true);
			this.filterPresetPointerdownHandler = event => {
				this.handleDocumentPointerdown(event);
			};
			main_core.Event.bind(document, 'pointerdown', this.filterPresetPointerdownHandler, true);
			const host = this.getFilterHost();
			if (host) {
				this.filterFocusoutHandler = event => this.handleFilterFocusout(event);
				main_core.Event.bind(host, 'focusout', this.filterFocusoutHandler);
				this.filterInputHandler = event => this.handleFilterInput(event);
				main_core.Event.bind(host, 'input', this.filterInputHandler);
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
			if (this.filterPresetPointerdownHandler) {
				main_core.Event.unbind(document, 'pointerdown', this.filterPresetPointerdownHandler, true);
				this.filterPresetPointerdownHandler = null;
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
			if (this.resizeObserver) {
				this.resizeObserver.disconnect();
				this.resizeObserver = null;
			}
			this.observedBreadcrumbs = null;
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
				const input = host?.querySelector(FILTER_FIND_SELECTOR);
				try {
					input?.focus();
				} catch {
				}
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
			},
			collapseSearch() {
				useSessionStore().setSearchOpen(false);
				this.$nextTick(() => {
					const button = this.$el.querySelector('[data-testid="universal-disk-picker-search-btn"]');
					button?.focus();
				});
			},
			handleDocumentEscape(event) {
				if (event.key !== 'Escape' || !useSessionStore().searchOpen) {
					return;
				}
				const host = this.getFilterHost();
				const target = event.target;
				const insideSearch = host !== null && target !== null && host.contains(target);
				if (!insideSearch) {
					return;
				}
				event.stopImmediatePropagation();
				if (this.isSearchMeaningless()) {
					this.collapseSearch();
				}
			},
			handleDocumentPointerdown(event) {
				const target = event.target;
				const preset = target instanceof Element ? target.closest(FILTER_PRESET_SELECTOR) : null;
				this.filterPresetPointerdownActive = preset !== null && preset.closest(OPEN_POPUP_SELECTOR) !== null;
				setTimeout(() => {
					this.filterPresetPointerdownActive = false;
				}, 0);
			},
			handleFilterFocusout(event) {
				const relatedTarget = event.relatedTarget;
				const movedToRelatedPopup = relatedTarget instanceof Element && relatedTarget.closest(RELATED_POPUP_SELECTOR) !== null;
				const presetPointerdownActive = this.filterPresetPointerdownActive;
				this.filterPresetPointerdownActive = false;
				setTimeout(() => {
					if (!useSessionStore().searchOpen) {
						return;
					}
					const host = this.getFilterHost();
					const active = document.activeElement;
					const stillInside = presetPointerdownActive || movedToRelatedPopup || host !== null && active !== null && (host.contains(active) || active.closest(RELATED_POPUP_SELECTOR) !== null);
					if (!stillInside && this.isSearchMeaningless()) {
						useSessionStore().setSearchOpen(false);
					}
				}, 0);
			},
			handleTrap(event) {
				if (event.key !== 'Tab') {
					return;
				}
				if (document.querySelector(RELATED_POPUP_SELECTOR)) {
					return;
				}
				const root = this.$el;
				const focusable = [...root.querySelectorAll(FOCUSABLE_SELECTOR)].filter(element => element.offsetParent !== null || element === document.activeElement);
				if (focusable.length === 0) {
					return;
				}
				const first = focusable[0];
				const last = focusable[focusable.length - 1];
				const active = document.activeElement;
				if (event.shiftKey && active === first) {
					event.preventDefault();
					last.focus();
				} else if (!event.shiftKey && active === last || !root.contains(active)) {
					event.preventDefault();
					first.focus();
				}
			},
			handleBoundaryWheel(event) {
				preventWheelScrollChaining(event);
			}
		},
		template: `
		<div class="disk-picker__root" @wheel="handleBoundaryWheel">
			<div
				data-disk-picker-filter-host
				data-testid="universal-disk-picker-search-filter"
				class="disk-picker__filter-host"
				:class="{ '--open': searchOpen }"
			></div>
			<LoadingSkeleton v-if="!initialized"/>
			<PickerLayout v-else>
				<template #sidebar>
					<SourceSidebar/>
				</template>
				<template #header>
					<PickerToolbar/>
				</template>
				<template #list>
					<ItemBrowser/>
				</template>
				<template #preview>
					<PreviewPanel/>
				</template>
				<template #footer>
					<SelectionFooter/>
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
				filterAdapter?.dispose();
				filterAdapter = null;
				useSessionStore().invalidateRequests();
			}
		};
	}

	exports.FILE_TYPE_ALIASES = FILE_TYPE_ALIASES;
	exports.applyFindSuppressed = applyFindSuppressed;
	exports.mountPickerApp = mountPickerApp;
	exports.normalizeFilterValues = normalizeFilterValues;
	exports.readInitialFilterValues = readInitialFilterValues;
	exports.resetInitialFilterValues = resetInitialFilterValues;

})(this.BX.Disk.DiskPickerInternal = this.BX.Disk.DiskPickerInternal || {}, BX.Main, window, window, window, BX, BX.Vue3, BX.Vue3.Pinia, BX.UI.IconSet.Api.Disk, BX.UI.System.Skeleton.Vue, BX.UI.IconSet, BX.UI.Vue3.Components, BX.UI.System.Typography.Vue, BX, BX.Vue3.Components);
//# sourceMappingURL=internal.bundle.js.map
