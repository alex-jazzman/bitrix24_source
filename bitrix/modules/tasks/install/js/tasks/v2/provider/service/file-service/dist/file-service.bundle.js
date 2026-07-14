/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Provider = this.BX.Tasks.V2.Provider || {};
(function (exports, main_core, main_core_events, ui_uploader_core, ui_uploader_vue, ui_vue3, ui_notificationManager, tasks_v2_core, tasks_v2_const, tasks_v2_lib_apiClient, tasks_v2_lib_idUtils, tasks_v2_provider_service_taskService) {
	'use strict';

	function mapDtoToModel(fileDto) {
		return {
			serverFileId: fileDto.id,
			serverId: fileDto.serverId,
			type: fileDto.type,
			name: fileDto.name,
			size: fileDto.size,
			width: fileDto.width,
			height: fileDto.height,
			isImage: fileDto.isImage,
			isVideo: fileDto.isVideo,
			treatImageAsFile: fileDto.treatImageAsFile,
			downloadUrl: fileDto.downloadUrl,
			previewUrl: fileDto.serverPreviewUrl,
			serverPreviewUrl: fileDto.serverPreviewUrl,
			serverPreviewWidth: fileDto.serverPreviewWidth,
			serverPreviewHeight: fileDto.serverPreviewHeight,
			customData: fileDto.customData,
			viewerAttrs: fileDto.viewerAttrs
		};
	}

	const processCheckListFileIds = fileIds => {
		if (!Array.isArray(fileIds)) {
			return [];
		}
		return fileIds.reduce((result, item) => {
			if (main_core.Type.isObjectLike(item) && 'id' in item && 'fileId' in item) {
				result.push({
					id: item.id,
					fileId: item.fileId
				});
			} else if (main_core.Type.isString(item) && item.startsWith('n')) {
				result.push({
					id: item,
					fileId: item
				});
			}
			return result;
		}, []);
	};

	const EntityTypes = Object.freeze({
		Task: 'task',
		CheckListItem: 'checkListItem',
		Result: 'result'
	});
	class FileService extends main_core_events.EventEmitter {
		#entityId;
		#entityType;
		#loadedIds = new Set();
		#objectsIds = {};
		#promises = [];
		#adapter = null;
		#fileBrowserClosed = false;
		#filesToAttach = [];
		#filesToDetach = [];
		#isDetachedErrorMode = false;
		#browseElement;
		#saveAttachedFilesDebounced;
		#saveDetachedFilesDebounced;
		#isDraftActive = false;
		constructor(entityId, entityType = EntityTypes.Task) {
			super();
			this.setEventNamespace('Tasks.V2.Provider.Service.FileService');
			this.setEntityId(entityId, entityType);
			this.initAdapter(entityId, entityType);
			this.#bindEvents();
			this.#saveAttachedFilesDebounced = main_core.Runtime.debounce(this.#saveAttachedFiles, 3000, this);
			this.#saveDetachedFilesDebounced = main_core.Runtime.debounce(this.#saveDetachedFiles, 3000, this);
		}
		initAdapter(entityId, entityType) {
			this.#adapter = new ui_uploader_vue.VueUploaderAdapter({
				id: getKey(entityId, entityType),
				controller: tasks_v2_core.Core.getParams().features.disk ? 'disk.uf.integration.diskUploaderController' : null,
				imagePreviewHeight: 1200,
				imagePreviewWidth: 1200,
				imagePreviewQuality: 0.85,
				ignoreUnknownImageTypes: true,
				treatOversizeImageAsFile: true,
				multiple: true,
				maxFileSize: null
			});
			this.#adapter.subscribeFromOptions({
				'Item:onAdd': event => {
					const {
						item: file
					} = event.getData();
					this.#addLoadedIds([file.serverFileId]);
					this.emit('onFileAdd');
				},
				'Item:onComplete': event => {
					const {
						item: file
					} = event.getData();
					this.#addLoadedObjectsIds([file]);
					const fileIds = new Set(this.#entityFileIds);
					if (!this.#getIdsByObjectId(file.customData.objectId).some(id => fileIds.has(id))) {
						this.#attachFiles([...fileIds, file.serverFileId], file);
						this.emit('onFileAttach', file);
					}
					this.emit('onFileComplete', file);
				},
				'Item:onRemove': event => {
					const {
						item: file
					} = event.getData();
					const idsToRemove = new Set(this.#getIdsByObjectId(file.customData.objectId));
					this.#removeLoadedObjectsIds(idsToRemove);
					this.#detachFiles(this.#getEntityFileIds(idsToRemove), file);
					this.emit('onFileRemove', {
						file
					});
				}
			});
		}
		#bindEvents() {
			if (this.#entityType === EntityTypes.Task) {
				main_core.Event.bind(window, 'beforeunload', this.handleSave);
			}
		}
		#unbindEvents() {
			if (this.#entityType === EntityTypes.Task) {
				main_core.Event.unbind(window, 'beforeunload', this.handleSave);
			}
		}
		handleSave = async () => {
			await this.#saveAttachedFiles();
			await this.#saveDetachedFiles();
		};
		setEntityId(entityId, entityType = EntityTypes.Task) {
			this.#entityId = entityId;
			this.#entityType = entityType;
		}
		getEntityId() {
			return this.#entityId;
		}
		getAdapter() {
			return this.#adapter;
		}
		getFiles() {
			return this.#adapter.getReactiveItems();
		}
		getFileItems() {
			return this.#adapter.getItems();
		}
		isUploading() {
			return this.getFileItems().some(({
				status
			}) => [ui_uploader_core.FileStatus.UPLOADING, ui_uploader_core.FileStatus.LOADING].includes(status));
		}
		hasUploadingError() {
			return this.getFileItems().some(({
				status
			}) => [ui_uploader_core.FileStatus.UPLOAD_FAILED, ui_uploader_core.FileStatus.LOAD_FAILED].includes(status));
		}
		browse(params) {
			main_core.Runtime.loadExtension('disk.uploader.user-field-widget').then(({
				UserFieldMenu
			}) => {
				const menu = new UserFieldMenu({
					dialogId: 'task-card',
					uploader: this.#adapter.getUploader(),
					compact: params.compact || false,
					menuOptions: {
						minWidth: 220,
						animation: 'fading',
						closeByEsc: true,
						bindOptions: {
							forceBindPosition: true
						},
						events: {
							onPopupClose: () => {
								params.onHideCallback?.();
							},
							onPopupShow: () => {
								params.onShowCallback?.();
							}
						}
					}
				});
				menu.show(params.bindElement);
			}).catch(error => console.error(error));
		}
		browseFiles() {
			if (!this.#browseElement) {
				this.#browseElement = document.createElement('div');
				this.#adapter.getUploader().assignBrowse(this.#browseElement);
			}
			this.#browseElement.click();
		}
		browseMyDrive() {
			main_core.Runtime.loadExtension('disk.uploader.user-field-widget').then(({
				openDiskFileDialog
			}) => {
				openDiskFileDialog({
					dialogId: 'task-card',
					uploader: this.#adapter.getUploader()
				});
			}).catch(error => console.error(error));
		}
		setFileBrowserClosed(value) {
			this.#fileBrowserClosed = value;
		}
		isFileBrowserClosed() {
			return this.#fileBrowserClosed;
		}
		resetFileBrowserClosedState() {
			this.#fileBrowserClosed = false;
		}
		destroy(removeFilesFromServer = true) {
			this.#adapter.unsubscribeAll('Item:onAdd');
			this.#adapter.unsubscribeAll('Item:onComplete');
			this.#adapter.unsubscribeAll('Item:onRemove');
			this.#adapter.getUploader().destroy({
				removeFilesFromServer
			});
			this.#unbindEvents();
		}
		async list(ids) {
			if (!main_core.Type.isArrayFilled(ids)) {
				return [];
			}
			const unloadedIds = ids.filter(id => !this.#loadedIds.has(id));
			if (unloadedIds.length === 0) {
				await Promise.all(this.#promises);
				return this.getFileItems();
			}
			const promise = new Resolvable();
			this.#promises.push(promise);
			this.#addLoadedIds(unloadedIds);
			try {
				const data = await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.FileListObjects, {
					ids: unloadedIds
				});
				this.#handleLoadedFiles(data);
				promise.resolve();
				await Promise.all(this.#promises);
				return this.getFileItems();
			} catch (error) {
				this.#removeLoadedIds(unloadedIds);
				promise.resolve();
				console.error(tasks_v2_const.Endpoint.FileListObjects, error);
				return [];
			}
		}
		remove(idsToRemove) {
			const uploaderFiles = this.getFileItems().map(({
				id,
				serverFileId
			}) => ({
				id,
				serverFileId
			}));
			uploaderFiles.forEach(file => {
				const fileIds = new Set([file.serverFileId]);
				if (this.#isObjectId(file.serverFileId)) {
					const objectId = Number(file.serverFileId.slice(1));
					this.#getIdsByObjectId(objectId).forEach(id => fileIds.add(id));
				}
				if ([...fileIds].some(id => idsToRemove.includes(id))) {
					this.#adapter.getUploader().removeFile(file.id);
				}
			});
		}
		loadFilesFromData(data) {
			const ids = data.map(fileDto => fileDto.id);
			this.#addLoadedIds(ids);
			this.#handleLoadedFiles(data);
		}
		hasPendingRequests() {
			return this.#filesToAttach.length > 0 || this.#filesToDetach.length > 0;
		}
		beginDraft() {
			if (this.#entityType !== EntityTypes.Task || tasks_v2_lib_idUtils.idUtils.isTemplate(this.#entityId) || this.isDraftActive()) {
				return;
			}
			this.#isDraftActive = true;
		}
		isDraftActive() {
			return this.#isDraftActive;
		}
		async commitDraft() {
			if (!this.isDraftActive()) {
				return;
			}
			await this.#saveAttachedFilesDebounced();
			await this.#saveDetachedFilesDebounced();
			this.#endDraft();
		}
		#handleLoadedFiles(data) {
			const files = data.map(fileDto => mapDtoToModel(fileDto));
			const objectsIds = new Set(Object.values(this.#objectsIds));
			const newFiles = files.filter(({
				customData
			}) => !objectsIds.has(customData.objectId));
			this.#adapter.getUploader().addFiles(newFiles);
			this.#addLoadedObjectsIds(files);
		}
		#addLoadedIds(ids) {
			ids.forEach(id => this.#loadedIds.add(id));
		}
		#addLoadedObjectsIds(files) {
			files.forEach(file => {
				this.#objectsIds[file.serverFileId] = file.customData.objectId;
			});
		}
		#removeLoadedObjectsIds(ids) {
			ids.forEach(id => {
				delete this.#objectsIds[id];
			});
			this.#removeLoadedIds(ids);
		}
		#removeLoadedIds(ids) {
			ids.forEach(id => this.#loadedIds.delete(id));
		}
		#getIdsByObjectId(objectIdToFind) {
			return Object.entries(this.#objectsIds).filter(([, objectId]) => objectId === objectIdToFind).map(([id]) => this.#isObjectId(id) ? id : Number(id));
		}
		#attachFiles(fileIds, attachedFile) {
			switch (this.#entityType) {
				case EntityTypes.Task:
					{
						const id = this.#entityId;
						void tasks_v2_provider_service_taskService.taskService.updateStoreTask(id, {
							fileIds
						});
						if (this.#isDetachedErrorMode) {
							return;
						}
						if (tasks_v2_lib_idUtils.idUtils.isReal(id) && this.#isObjectId(attachedFile.serverFileId)) {
							this.#filesToAttach.push(attachedFile);
							if (!this.isDraftActive()) {
								this.#saveAttachedFilesDebounced();
							}
						}
						break;
					}
				case EntityTypes.CheckListItem:
					{
						this.#processCheckListFileIds(fileIds);
						break;
					}
				case EntityTypes.Result:
					{
						void this.$store.dispatch(`${tasks_v2_const.Model.Results}/update`, {
							id: this.#entityId,
							fields: {
								fileIds
							}
						});
						break;
					}
			}
		}
		#detachFiles(fileIds, detachedFile) {
			switch (this.#entityType) {
				case EntityTypes.Task:
					{
						const id = this.#entityId;
						tasks_v2_provider_service_taskService.taskService.updateStoreTask(id, {
							fileIds
						});
						if (tasks_v2_lib_idUtils.idUtils.isReal(id)) {
							this.#moveDetachedFileToQueue(detachedFile, this.#filesToAttach, this.#filesToDetach, this.isDraftActive() ? undefined : this.#saveDetachedFilesDebounced);
						}
						break;
					}
				case EntityTypes.CheckListItem:
					{
						this.#processCheckListFileIds(fileIds);
						break;
					}
				case EntityTypes.Result:
					{
						void this.$store.dispatch(`${tasks_v2_const.Model.Results}/update`, {
							id: this.#entityId,
							fields: {
								fileIds
							}
						});
						break;
					}
			}
		}
		#getEntityFileIds(excludedIds = new Set()) {
			if (this.#entityType === EntityTypes.Task || this.#entityType === EntityTypes.Result) {
				return this.#entityFileIds.filter(id => !excludedIds.has(id));
			}
			if (this.#entityType === EntityTypes.CheckListItem) {
				return this.#entityFileIds.filter(attach => !excludedIds.has(attach.id));
			}
			return [];
		}
		#processCheckListFileIds(fileIds) {
			const attachments = processCheckListFileIds(fileIds);
			void this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/update`, {
				id: this.#entityId,
				fields: {
					attachments
				}
			});
		}
		#isObjectId(id) {
			return String(id).startsWith('n');
		}
		async #saveAttachedFiles() {
			if (!main_core.Type.isArrayFilled(this.#filesToAttach)) {
				return;
			}
			const id = tasks_v2_lib_idUtils.idUtils.unbox(this.#entityId);
			try {
				const ids = this.#filesToAttach.map(file => file.serverFileId);
				this.#filesToAttach = [];
				if (tasks_v2_lib_idUtils.idUtils.isTemplate(this.#entityId)) {
					await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TemplateUpdate, {
						template: {
							id,
							fileIds: this.#entityFileIds
						}
					});
				} else {
					await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.FileAttach, {
						task: {
							id
						},
						ids
					});
				}
			} catch (error) {
				console.error('FileService: saveAttachedFiles error', error);
				this.notifyError(main_core.Loc.getMessage('TASKS_V2_NOTIFY_FILE_ATTACH_ERROR'));
			}
		}
		async #saveDetachedFiles() {
			if (!main_core.Type.isArrayFilled(this.#filesToDetach)) {
				return;
			}
			const id = tasks_v2_lib_idUtils.idUtils.unbox(this.#entityId);
			const filesBeforeDetach = this.#filesToDetach;
			try {
				const ids = this.#filesToDetach.map(file => file.serverFileId);
				this.#filesToDetach = [];
				if (tasks_v2_lib_idUtils.idUtils.isTemplate(this.#entityId)) {
					await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.TemplateUpdate, {
						template: {
							id,
							fileIds: this.#entityFileIds
						}
					});
				} else {
					await tasks_v2_lib_apiClient.apiClient.post(tasks_v2_const.Endpoint.FileDetach, {
						task: {
							id
						},
						ids
					});
				}
				this.emit('onFilesDetachComplete', {
					ids
				});
			} catch (error) {
				console.error('FileService: saveDetachedFiles error', error);
				this.#isDetachedErrorMode = true;
				this.#adapter.getUploader().addFiles(filesBeforeDetach);
				this.#isDetachedErrorMode = false;
				this.notifyError(main_core.Loc.getMessage('TASKS_V2_NOTIFY_FILE_DETACH_ERROR'));
			}
		}
		notifyError(text) {
			ui_notificationManager.Notifier.notifyViaBrowserProvider({
				id: `file-service-error-${main_core.Text.getRandom()}`,
				text
			});
		}
		#endDraft() {
			this.#isDraftActive = false;
		}
		#moveDetachedFileToQueue(detachedFile, filesToAttach, filesToDetach, onDetached) {
			const attachedIndex = filesToAttach.findIndex(file => {
				return file.serverFileId === detachedFile.serverFileId;
			});
			if (attachedIndex === -1) {
				filesToDetach.push(detachedFile);
				onDetached?.();
				return;
			}
			filesToAttach.splice(attachedIndex, 1);
		}
		get #entityFileIds() {
			if (this.#entityType === EntityTypes.Task) {
				return tasks_v2_provider_service_taskService.taskService.getStoreTask(this.#entityId).fileIds;
			}
			if (this.#entityType === EntityTypes.Result) {
				return this.$store.getters[`${tasks_v2_const.Model.Results}/getById`](this.#entityId).fileIds;
			}
			return this.$store.getters[`${tasks_v2_const.Model.CheckList}/getById`](this.#entityId).attachments;
		}
		get $store() {
			return tasks_v2_core.Core.getStore();
		}
	}
	const services = {};
	const getKey = (entityId, entityType) => `${entityType}:${entityId}`;
	const fileService = {
		get(entityId, entityType = EntityTypes.Task) {
			const key = getKey(entityId, entityType);
			services[key] ??= new FileService(entityId, entityType);
			return services[key];
		},
		replace(tempId, entityId, entityType = EntityTypes.Task) {
			const oldKey = getKey(tempId, entityType);
			const newKey = getKey(entityId, entityType);
			services[newKey] = services[oldKey];
			services[newKey].setEntityId(entityId, entityType);
			delete services[oldKey];
		},
		delete(entityId, entityType = EntityTypes.Task, removeFilesFromServer = true) {
			const key = getKey(entityId, entityType);
			services[key]?.destroy(removeFilesFromServer);
			delete services[key];
		}
	};
	function Resolvable() {
		const promise = new Promise(resolve => {
			this.resolve = resolve;
		});
		promise.resolve = this.resolve;
		return promise;
	}

	exports.EntityTypes = EntityTypes;
	exports.fileService = fileService;

})(this.BX.Tasks.V2.Provider.Service = this.BX.Tasks.V2.Provider.Service || {}, BX, BX.Event, BX.UI.Uploader, BX.UI.Uploader, BX.Vue3, BX.UI.NotificationManager, BX.Tasks.V2, BX.Tasks.V2.Const, BX.Tasks.V2.Lib, BX.Tasks.V2.Lib, BX.Tasks.V2.Provider.Service);
//# sourceMappingURL=file-service.bundle.js.map
