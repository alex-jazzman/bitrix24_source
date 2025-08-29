/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Provider = this.BX.Tasks.V2.Provider || {};
(function (exports,main_core_events,ui_uploader_core,ui_uploader_vue,disk_uploader_userFieldWidget,tasks_v2_const,tasks_v2_core,tasks_v2_lib_apiClient,tasks_v2_provider_service_taskService) {
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
	    serverPreviewUrl: fileDto.serverPreviewUrl,
	    serverPreviewWidth: fileDto.serverPreviewWidth,
	    serverPreviewHeight: fileDto.serverPreviewHeight,
	    customData: fileDto.customData
	  };
	}

	const processCheckListFileIds = fileIds => {
	  if (!Array.isArray(fileIds)) {
	    return [];
	  }
	  return fileIds.reduce((result, item) => {
	    if (typeof item === 'object' && item !== null && 'id' in item && 'fileId' in item) {
	      result.push({
	        id: item.id,
	        fileId: item.fileId
	      });
	    } else if (typeof item === 'string' && item.startsWith('n')) {
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
	  CheckListItem: 'checkListItem'
	});
	var _entityId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("entityId");
	var _entityType = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("entityType");
	var _menu = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("menu");
	var _loadedIds = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("loadedIds");
	var _objectsIds = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("objectsIds");
	var _promises = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("promises");
	var _adapter = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("adapter");
	var _browseElement = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("browseElement");
	var _addFiles = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("addFiles");
	var _addLoadedIds = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("addLoadedIds");
	var _addLoadedObjectsIds = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("addLoadedObjectsIds");
	var _removeLoadedObjectsIds = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("removeLoadedObjectsIds");
	var _getIdsByObjectId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getIdsByObjectId");
	var _updateEntity = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateEntity");
	var _entityFileIds = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("entityFileIds");
	class FileService extends main_core_events.EventEmitter {
	  constructor(entityId, entityType = EntityTypes.Task) {
	    super();
	    Object.defineProperty(this, _entityFileIds, {
	      get: _get_entityFileIds,
	      set: void 0
	    });
	    Object.defineProperty(this, _updateEntity, {
	      value: _updateEntity2
	    });
	    Object.defineProperty(this, _getIdsByObjectId, {
	      value: _getIdsByObjectId2
	    });
	    Object.defineProperty(this, _removeLoadedObjectsIds, {
	      value: _removeLoadedObjectsIds2
	    });
	    Object.defineProperty(this, _addLoadedObjectsIds, {
	      value: _addLoadedObjectsIds2
	    });
	    Object.defineProperty(this, _addLoadedIds, {
	      value: _addLoadedIds2
	    });
	    Object.defineProperty(this, _addFiles, {
	      value: _addFiles2
	    });
	    Object.defineProperty(this, _entityId, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _entityType, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _menu, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _loadedIds, {
	      writable: true,
	      value: new Set()
	    });
	    Object.defineProperty(this, _objectsIds, {
	      writable: true,
	      value: {}
	    });
	    Object.defineProperty(this, _promises, {
	      writable: true,
	      value: []
	    });
	    Object.defineProperty(this, _adapter, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _browseElement, {
	      writable: true,
	      value: void 0
	    });
	    this.setEventNamespace('Tasks.V2.Provider.Service.FileService');
	    this.setEntityId(entityId, entityType);
	    babelHelpers.classPrivateFieldLooseBase(this, _adapter)[_adapter] = new ui_uploader_vue.VueUploaderAdapter({
	      id: getServiceKey(entityId, entityType),
	      controller: 'disk.uf.integration.diskUploaderController',
	      imagePreviewHeight: 1200,
	      imagePreviewWidth: 1200,
	      imagePreviewQuality: 0.85,
	      treatOversizeImageAsFile: true,
	      multiple: true,
	      maxFileSize: null
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _adapter)[_adapter].subscribeFromOptions({
	      'Item:onAdd': event => {
	        const {
	          item: file
	        } = event.getData();
	        babelHelpers.classPrivateFieldLooseBase(this, _addLoadedIds)[_addLoadedIds]([file.serverFileId]);
	        this.emit('onFileAdd');
	      },
	      'Item:onComplete': event => {
	        const {
	          item: file
	        } = event.getData();
	        babelHelpers.classPrivateFieldLooseBase(this, _addLoadedObjectsIds)[_addLoadedObjectsIds]([file]);
	        const fileIds = new Set(babelHelpers.classPrivateFieldLooseBase(this, _entityFileIds)[_entityFileIds]);
	        if (!babelHelpers.classPrivateFieldLooseBase(this, _getIdsByObjectId)[_getIdsByObjectId](file.customData.objectId).some(id => fileIds.has(id))) {
	          babelHelpers.classPrivateFieldLooseBase(this, _updateEntity)[_updateEntity]({
	            fileIds: [...fileIds, file.serverFileId]
	          });
	        }
	        this.emit('onFileComplete', file);
	      },
	      'Item:onRemove': event => {
	        const {
	          item: file
	        } = event.getData();
	        const idsToRemove = new Set(babelHelpers.classPrivateFieldLooseBase(this, _getIdsByObjectId)[_getIdsByObjectId](file.customData.objectId));
	        babelHelpers.classPrivateFieldLooseBase(this, _removeLoadedObjectsIds)[_removeLoadedObjectsIds](idsToRemove);
	        babelHelpers.classPrivateFieldLooseBase(this, _updateEntity)[_updateEntity]({
	          fileIds: babelHelpers.classPrivateFieldLooseBase(this, _entityFileIds)[_entityFileIds].filter(id => !idsToRemove.has(id))
	        });
	      }
	    });
	  }
	  setEntityId(entityId, entityType = EntityTypes.Task) {
	    babelHelpers.classPrivateFieldLooseBase(this, _entityId)[_entityId] = entityId;
	    babelHelpers.classPrivateFieldLooseBase(this, _entityType)[_entityType] = entityType;
	  }
	  getEntityId() {
	    return getServiceKey(babelHelpers.classPrivateFieldLooseBase(this, _entityId)[_entityId], babelHelpers.classPrivateFieldLooseBase(this, _entityType)[_entityType]);
	  }
	  getAdapter() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _adapter)[_adapter];
	  }
	  getFiles() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _adapter)[_adapter].getReactiveItems();
	  }
	  isUploading() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _adapter)[_adapter].getItems().some(({
	      status
	    }) => [ui_uploader_core.FileStatus.UPLOADING, ui_uploader_core.FileStatus.LOADING].includes(status));
	  }
	  browse(params) {
	    var _babelHelpers$classPr, _babelHelpers$classPr2;
	    (_babelHelpers$classPr2 = (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _menu))[_menu]) != null ? _babelHelpers$classPr2 : _babelHelpers$classPr[_menu] = new disk_uploader_userFieldWidget.UserFieldMenu({
	      dialogId: 'task-card',
	      uploader: babelHelpers.classPrivateFieldLooseBase(this, _adapter)[_adapter].getUploader(),
	      menuOptions: {
	        minWidth: 220,
	        animation: 'fading',
	        closeByEsc: true,
	        bindOptions: {
	          forceBindPosition: true,
	          forceTop: true,
	          position: 'top'
	        },
	        events: {
	          onPopupClose: () => {
	            params.onHideCallback == null ? void 0 : params.onHideCallback();
	          }
	        }
	      },
	      compact: true
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _menu)[_menu].show(params.bindElement);
	  }
	  browseFiles() {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _browseElement)[_browseElement]) {
	      babelHelpers.classPrivateFieldLooseBase(this, _browseElement)[_browseElement] = document.createElement('div');
	      babelHelpers.classPrivateFieldLooseBase(this, _adapter)[_adapter].getUploader().assignBrowse(babelHelpers.classPrivateFieldLooseBase(this, _browseElement)[_browseElement]);
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _browseElement)[_browseElement].click();
	  }
	  browseMyDrive() {
	    disk_uploader_userFieldWidget.openDiskFileDialog({
	      dialogId: 'task-card',
	      uploader: babelHelpers.classPrivateFieldLooseBase(this, _adapter)[_adapter].getUploader()
	    });
	  }
	  destroy() {
	    babelHelpers.classPrivateFieldLooseBase(this, _adapter)[_adapter].unsubscribeAll('Item:onAdd');
	    babelHelpers.classPrivateFieldLooseBase(this, _adapter)[_adapter].unsubscribeAll('Item:onComplete');
	    babelHelpers.classPrivateFieldLooseBase(this, _adapter)[_adapter].unsubscribeAll('Item:onRemove');
	    babelHelpers.classPrivateFieldLooseBase(this, _adapter)[_adapter].getUploader().destroy();
	  }
	  async uploadFromClipboard(params) {
	    const {
	      clipboardEvent
	    } = params;
	    const {
	      clipboardData
	    } = clipboardEvent;
	    if (!clipboardData || !ui_uploader_core.isFilePasted(clipboardData)) {
	      return [];
	    }
	    clipboardEvent.preventDefault();
	    const files = await ui_uploader_core.getFilesFromDataTransfer(clipboardData);
	    return babelHelpers.classPrivateFieldLooseBase(this, _addFiles)[_addFiles](files);
	  }
	  async sync(ids) {
	    if (ids.every(id => babelHelpers.classPrivateFieldLooseBase(this, _loadedIds)[_loadedIds].has(id))) {
	      babelHelpers.classPrivateFieldLooseBase(this, _adapter)[_adapter].getItems().forEach(file => {
	        const uploaderIds = [file.serverFileId];
	        if (file.serverFileId[0] === 'n') {
	          const objectId = Number(file.serverFileId.slice(1));
	          uploaderIds.push(...babelHelpers.classPrivateFieldLooseBase(this, _getIdsByObjectId)[_getIdsByObjectId](objectId));
	        }
	        if (uploaderIds.some(id => ids.includes(id))) {
	          return;
	        }
	        babelHelpers.classPrivateFieldLooseBase(this, _adapter)[_adapter].getUploader().removeFile(file.id);
	      });
	    }
	    await this.list(ids);
	  }
	  async list(ids) {
	    const unloadedIds = ids.filter(id => id[0] !== 'n' && !babelHelpers.classPrivateFieldLooseBase(this, _loadedIds)[_loadedIds].has(id));
	    if (unloadedIds.length === 0) {
	      await Promise.all(babelHelpers.classPrivateFieldLooseBase(this, _promises)[_promises]);
	      return babelHelpers.classPrivateFieldLooseBase(this, _adapter)[_adapter].getItems();
	    }
	    const promise = new Resolvable();
	    babelHelpers.classPrivateFieldLooseBase(this, _promises)[_promises].push(promise);
	    babelHelpers.classPrivateFieldLooseBase(this, _addLoadedIds)[_addLoadedIds](unloadedIds);
	    try {
	      const data = await tasks_v2_lib_apiClient.apiClient.post('File.list', {
	        ids: unloadedIds
	      });
	      const files = data.map(fileDto => mapDtoToModel(fileDto));
	      const objectsIds = new Set(Object.values(babelHelpers.classPrivateFieldLooseBase(this, _objectsIds)[_objectsIds]));
	      const newFiles = files.filter(({
	        customData
	      }) => !objectsIds.has(customData.objectId));
	      babelHelpers.classPrivateFieldLooseBase(this, _adapter)[_adapter].getUploader().addFiles(newFiles);
	      babelHelpers.classPrivateFieldLooseBase(this, _addLoadedObjectsIds)[_addLoadedObjectsIds](files);
	      promise.resolve();
	      await Promise.all(babelHelpers.classPrivateFieldLooseBase(this, _promises)[_promises]);
	      return babelHelpers.classPrivateFieldLooseBase(this, _adapter)[_adapter].getItems();
	    } catch (error) {
	      console.error('FileService: list error', error);
	      return [];
	    }
	  }
	  get $store() {
	    return tasks_v2_core.Core.getStore();
	  }
	}
	function _addFiles2(files) {
	  const uploader = babelHelpers.classPrivateFieldLooseBase(this, _adapter)[_adapter].getUploader();
	  return uploader.addFiles(files);
	}
	function _addLoadedIds2(ids) {
	  ids.forEach(id => babelHelpers.classPrivateFieldLooseBase(this, _loadedIds)[_loadedIds].add(id));
	}
	function _addLoadedObjectsIds2(files) {
	  files.forEach(file => {
	    babelHelpers.classPrivateFieldLooseBase(this, _objectsIds)[_objectsIds][file.serverFileId] = file.customData.objectId;
	  });
	}
	function _removeLoadedObjectsIds2(ids) {
	  ids.forEach(id => {
	    delete babelHelpers.classPrivateFieldLooseBase(this, _objectsIds)[_objectsIds][id];
	  });
	}
	function _getIdsByObjectId2(objectIdToFind) {
	  return Object.entries(babelHelpers.classPrivateFieldLooseBase(this, _objectsIds)[_objectsIds]).filter(([, objectId]) => objectId === objectIdToFind).map(([id]) => id[0] === 'n' ? id : Number(id));
	}
	function _updateEntity2(data) {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _entityType)[_entityType] === EntityTypes.Task) {
	    void tasks_v2_provider_service_taskService.taskService.update(babelHelpers.classPrivateFieldLooseBase(this, _entityId)[_entityId], data);
	  } else if (babelHelpers.classPrivateFieldLooseBase(this, _entityType)[_entityType] === EntityTypes.CheckListItem) {
	    const attachments = processCheckListFileIds(data.fileIds);
	    void this.$store.dispatch(`${tasks_v2_const.Model.CheckList}/update`, {
	      id: babelHelpers.classPrivateFieldLooseBase(this, _entityId)[_entityId],
	      fields: {
	        attachments
	      }
	    });
	  }
	}
	function _get_entityFileIds() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _entityType)[_entityType] === EntityTypes.Task) {
	    return this.$store.getters[`${tasks_v2_const.Model.Tasks}/getById`](babelHelpers.classPrivateFieldLooseBase(this, _entityId)[_entityId]).fileIds;
	  }
	  return this.$store.getters[`${tasks_v2_const.Model.CheckList}/getById`](babelHelpers.classPrivateFieldLooseBase(this, _entityId)[_entityId]).attachments;
	}
	const services = {};
	function getServiceKey(entityId, entityType) {
	  return `${entityType}:${entityId}`;
	}
	const fileService = {
	  get(entityId, entityType = EntityTypes.Task) {
	    var _services$key;
	    const key = getServiceKey(entityId, entityType);
	    (_services$key = services[key]) != null ? _services$key : services[key] = new FileService(entityId, entityType);
	    return services[key];
	  },
	  replace(tempId, entityId, entityType = EntityTypes.Task) {
	    const oldKey = getServiceKey(tempId, entityType);
	    const newKey = getServiceKey(entityId, entityType);
	    services[newKey] = services[oldKey];
	    services[newKey].setEntityId(entityId, entityType);
	    delete services[oldKey];
	  },
	  delete(entityId, entityType = EntityTypes.Task) {
	    var _services$key2;
	    const key = getServiceKey(entityId, entityType);
	    (_services$key2 = services[key]) == null ? void 0 : _services$key2.destroy();
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

	exports.fileService = fileService;
	exports.EntityTypes = EntityTypes;

}((this.BX.Tasks.V2.Provider.Service = this.BX.Tasks.V2.Provider.Service || {}),BX.Event,BX.UI.Uploader,BX.UI.Uploader,BX.Disk.Uploader,BX.Tasks.V2.Const,BX.Tasks.V2,BX.Tasks.V2.Lib,BX.Tasks.V2.Provider.Service));
//# sourceMappingURL=file-service.bundle.js.map
