/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports,im_v2_lib_rest,im_v2_application_core,im_v2_lib_logger,im_v2_lib_notifier,im_v2_provider_service_sending,main_core_events,im_v2_const,im_v2_lib_utils,main_core,ui_uploader_core) {
	'use strict';

	const MAX_FILES_IN_ONE_MESSAGE = 10;
	var _uploaderRegistry = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("uploaderRegistry");
	var _onUploadCancelHandler = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onUploadCancelHandler");
	var _addFile = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("addFile");
	var _onUploadCancel = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onUploadCancel");
	var _removeFileFromUploader = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("removeFileFromUploader");
	class UploaderWrapper extends main_core_events.EventEmitter {
	  constructor() {
	    super();
	    Object.defineProperty(this, _removeFileFromUploader, {
	      value: _removeFileFromUploader2
	    });
	    Object.defineProperty(this, _onUploadCancel, {
	      value: _onUploadCancel2
	    });
	    Object.defineProperty(this, _addFile, {
	      value: _addFile2
	    });
	    Object.defineProperty(this, _uploaderRegistry, {
	      writable: true,
	      value: {}
	    });
	    Object.defineProperty(this, _onUploadCancelHandler, {
	      writable: true,
	      value: void 0
	    });
	    this.setEventNamespace(UploaderWrapper.eventNamespace);
	    babelHelpers.classPrivateFieldLooseBase(this, _onUploadCancelHandler)[_onUploadCancelHandler] = babelHelpers.classPrivateFieldLooseBase(this, _onUploadCancel)[_onUploadCancel].bind(this);
	    main_core_events.EventEmitter.subscribe(im_v2_const.EventType.uploader.cancel, babelHelpers.classPrivateFieldLooseBase(this, _onUploadCancelHandler)[_onUploadCancelHandler]);
	  }
	  createUploader(options) {
	    const {
	      diskFolderId,
	      uploaderId,
	      chatId,
	      dialogId,
	      autoUpload = false,
	      maxParallelLoads,
	      maxParallelUploads
	    } = options;
	    babelHelpers.classPrivateFieldLooseBase(this, _uploaderRegistry)[_uploaderRegistry][uploaderId] = new ui_uploader_core.Uploader({
	      autoUpload,
	      maxParallelLoads,
	      maxParallelUploads,
	      controller: 'disk.uf.integration.diskUploaderController',
	      multiple: true,
	      controllerOptions: {
	        folderId: diskFolderId,
	        chat: {
	          chatId,
	          dialogId
	        }
	      },
	      imageResizeWidth: 1280,
	      imageResizeHeight: 1280,
	      imageResizeMode: 'contain',
	      imageResizeFilter: file => {
	        return !file.getCustomData('sendAsFile') && !file.isAnimated();
	      },
	      imageResizeMimeType: 'image/jpeg',
	      imageResizeMimeTypeMode: 'force',
	      imagePreviewHeight: 720,
	      imagePreviewWidth: 720,
	      treatOversizeImageAsFile: true,
	      ignoreUnknownImageTypes: true,
	      maxFileSize: null,
	      events: {
	        [ui_uploader_core.UploaderEvent.FILE_ADD_START]: event => {
	          this.emit(UploaderWrapper.events.onFileAddStart, {
	            ...event.getData(),
	            uploaderId
	          });
	        },
	        [ui_uploader_core.UploaderEvent.FILE_UPLOAD_START]: event => {
	          this.emit(UploaderWrapper.events.onFileUploadStart, {
	            ...event.getData(),
	            uploaderId
	          });
	        },
	        [ui_uploader_core.UploaderEvent.FILE_ADD]: event => {
	          this.emit(UploaderWrapper.events.onFileAdd, {
	            ...event.getData(),
	            uploaderId
	          });
	        },
	        [ui_uploader_core.UploaderEvent.FILE_UPLOAD_PROGRESS]: event => {
	          this.emit(UploaderWrapper.events.onFileUploadProgress, {
	            ...event.getData(),
	            uploaderId
	          });
	        },
	        [ui_uploader_core.UploaderEvent.FILE_UPLOAD_COMPLETE]: event => {
	          this.emit(UploaderWrapper.events.onFileUploadComplete, {
	            ...event.getData(),
	            uploaderId
	          });
	        },
	        [ui_uploader_core.UploaderEvent.ERROR]: event => {
	          this.emit(UploaderWrapper.events.onFileUploadError, {
	            ...event.getData(),
	            uploaderId
	          });
	        },
	        [ui_uploader_core.UploaderEvent.FILE_ERROR]: event => {
	          this.emit(UploaderWrapper.events.onFileUploadError, {
	            ...event.getData(),
	            uploaderId
	          });
	        },
	        [ui_uploader_core.UploaderEvent.MAX_FILE_COUNT_EXCEEDED]: event => {
	          this.emit(UploaderWrapper.events.onMaxFileCountExceeded, {
	            ...event.getData(),
	            uploaderId
	          });
	        },
	        [ui_uploader_core.UploaderEvent.UPLOAD_COMPLETE]: event => {
	          this.emit(UploaderWrapper.events.onUploadComplete, {
	            ...event.getData(),
	            uploaderId
	          });
	        }
	      }
	    });
	  }
	  start(uploaderId) {
	    babelHelpers.classPrivateFieldLooseBase(this, _uploaderRegistry)[_uploaderRegistry][uploaderId].setAutoUpload(true);
	    babelHelpers.classPrivateFieldLooseBase(this, _uploaderRegistry)[_uploaderRegistry][uploaderId].start();
	  }
	  stop(uploaderId) {
	    babelHelpers.classPrivateFieldLooseBase(this, _uploaderRegistry)[_uploaderRegistry][uploaderId].stop();
	  }
	  destroyUploader(uploaderId) {
	    babelHelpers.classPrivateFieldLooseBase(this, _uploaderRegistry)[_uploaderRegistry][uploaderId].destroy({
	      removeFilesFromServer: false
	    });
	    delete babelHelpers.classPrivateFieldLooseBase(this, _uploaderRegistry)[_uploaderRegistry][uploaderId];
	  }
	  addFiles(tasks) {
	    const firstTenTasks = tasks.slice(0, MAX_FILES_IN_ONE_MESSAGE);
	    const addedFiles = [];
	    firstTenTasks.forEach(task => {
	      const file = babelHelpers.classPrivateFieldLooseBase(this, _addFile)[_addFile](task);
	      if (file) {
	        addedFiles.push(file);
	      }
	    });
	    return addedFiles;
	  }
	  getFiles(uploaderId) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _uploaderRegistry)[_uploaderRegistry][uploaderId].getFiles();
	  }
	  destroy() {
	    main_core_events.EventEmitter.unsubscribe(im_v2_const.EventType.uploader.cancel, babelHelpers.classPrivateFieldLooseBase(this, _onUploadCancelHandler)[_onUploadCancelHandler]);
	  }
	}
	function _addFile2(task) {
	  return babelHelpers.classPrivateFieldLooseBase(this, _uploaderRegistry)[_uploaderRegistry][task.uploaderId].addFile(task.file, {
	    id: task.tempFileId,
	    customData: {
	      dialogId: task.dialogId,
	      chatId: task.chatId,
	      tempMessageId: task.tempMessageId,
	      sendAsFile: task.sendAsFile
	    }
	  });
	}
	function _onUploadCancel2(event) {
	  const {
	    tempFileId,
	    tempMessageId
	  } = event.getData();
	  if (!tempFileId || !tempMessageId) {
	    return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _removeFileFromUploader)[_removeFileFromUploader](tempFileId);
	  this.emit(UploaderWrapper.events.onFileUploadCancel, {
	    tempMessageId,
	    tempFileId
	  });
	}
	function _removeFileFromUploader2(tempFileId) {
	  const uploaderList = Object.values(babelHelpers.classPrivateFieldLooseBase(this, _uploaderRegistry)[_uploaderRegistry]);
	  for (const uploader of uploaderList) {
	    if (!uploader.getFile) {
	      continue;
	    }
	    const file = uploader.getFile(tempFileId);
	    if (file) {
	      file.remove();
	      break;
	    }
	  }
	}
	UploaderWrapper.eventNamespace = 'BX.Messenger.v2.Service.Uploading.UploaderWrapper';
	UploaderWrapper.events = {
	  onFileAddStart: 'onFileAddStart',
	  onFileAdd: 'onFileAdd',
	  onFileUploadStart: 'onFileUploadStart',
	  onFileUploadProgress: 'onFileUploadProgress',
	  onFileUploadComplete: 'onFileUploadComplete',
	  onFileUploadError: 'onFileUploadError',
	  onFileUploadCancel: 'onFileUploadCancel',
	  onMaxFileCountExceeded: 'onMaxFileCountExceeded',
	  onUploadComplete: 'onUploadComplete'
	};

	const EVENT_NAMESPACE = 'BX.Messenger.v2.Service.UploadingService';
	var _store = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("store");
	var _restClient = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("restClient");
	var _isRequestingDiskFolderId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isRequestingDiskFolderId");
	var _diskFolderIdRequestPromise = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("diskFolderIdRequestPromise");
	var _uploaderWrapper = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("uploaderWrapper");
	var _sendingService = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("sendingService");
	var _uploaderFilesRegistry = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("uploaderFilesRegistry");
	var _queue = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("queue");
	var _isUploading = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isUploading");
	var _createUploader = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createUploader");
	var _addToQueue = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("addToQueue");
	var _processQueue = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("processQueue");
	var _addFileFromDiskToModel = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("addFileFromDiskToModel");
	var _initUploader = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initUploader");
	var _isMediaFile = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isMediaFile");
	var _setFileMapping = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setFileMapping");
	var _requestDiskFolderId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("requestDiskFolderId");
	var _tryCommit = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("tryCommit");
	var _uploadPreview = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("uploadPreview");
	var _prepareFileForUploader = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("prepareFileForUploader");
	var _updateFileProgress = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateFileProgress");
	var _cancelUpload = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("cancelUpload");
	var _addFileToStore = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("addFileToStore");
	var _updateFilePreviewInStore = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateFilePreviewInStore");
	var _updateFileSizeInStore = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateFileSizeInStore");
	var _preparePreview = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("preparePreview");
	var _getDiskFolderId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getDiskFolderId");
	var _getFileType = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getFileType");
	var _getFileExtension = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getFileExtension");
	var _getDialog = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getDialog");
	var _getCurrentUser = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getCurrentUser");
	var _getChatId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getChatId");
	var _registerFiles = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("registerFiles");
	var _unregisterFiles = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("unregisterFiles");
	var _setPreviewCreatedStatus = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setPreviewCreatedStatus");
	var _setPreviewSentStatus = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setPreviewSentStatus");
	var _setMessagesText = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setMessagesText");
	var _setAutoUpload = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setAutoUpload");
	var _createMessagesFromFiles = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createMessagesFromFiles");
	var _createMessageFromFiles = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createMessageFromFiles");
	var _readyToAddMessages = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("readyToAddMessages");
	var _readyToCommit = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("readyToCommit");
	var _tryToSendMessage = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("tryToSendMessage");
	var _tryToSendMessages = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("tryToSendMessages");
	var _prepareFileFromDisk = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("prepareFileFromDisk");
	var _isMaxFileSizeExceeded = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isMaxFileSizeExceeded");
	var _setMessageError = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setMessageError");
	var _destroyUploader = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("destroyUploader");
	var _getBinaryFiles = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getBinaryFiles");
	class UploadingService extends main_core_events.EventEmitter {
	  static getInstance() {
	    if (!this.instance) {
	      this.instance = new this();
	    }
	    return this.instance;
	  }
	  constructor() {
	    super();
	    Object.defineProperty(this, _getBinaryFiles, {
	      value: _getBinaryFiles2
	    });
	    Object.defineProperty(this, _destroyUploader, {
	      value: _destroyUploader2
	    });
	    Object.defineProperty(this, _setMessageError, {
	      value: _setMessageError2
	    });
	    Object.defineProperty(this, _isMaxFileSizeExceeded, {
	      value: _isMaxFileSizeExceeded2
	    });
	    Object.defineProperty(this, _prepareFileFromDisk, {
	      value: _prepareFileFromDisk2
	    });
	    Object.defineProperty(this, _tryToSendMessages, {
	      value: _tryToSendMessages2
	    });
	    Object.defineProperty(this, _tryToSendMessage, {
	      value: _tryToSendMessage2
	    });
	    Object.defineProperty(this, _readyToCommit, {
	      value: _readyToCommit2
	    });
	    Object.defineProperty(this, _readyToAddMessages, {
	      value: _readyToAddMessages2
	    });
	    Object.defineProperty(this, _createMessageFromFiles, {
	      value: _createMessageFromFiles2
	    });
	    Object.defineProperty(this, _createMessagesFromFiles, {
	      value: _createMessagesFromFiles2
	    });
	    Object.defineProperty(this, _setAutoUpload, {
	      value: _setAutoUpload2
	    });
	    Object.defineProperty(this, _setMessagesText, {
	      value: _setMessagesText2
	    });
	    Object.defineProperty(this, _setPreviewSentStatus, {
	      value: _setPreviewSentStatus2
	    });
	    Object.defineProperty(this, _setPreviewCreatedStatus, {
	      value: _setPreviewCreatedStatus2
	    });
	    Object.defineProperty(this, _unregisterFiles, {
	      value: _unregisterFiles2
	    });
	    Object.defineProperty(this, _registerFiles, {
	      value: _registerFiles2
	    });
	    Object.defineProperty(this, _getChatId, {
	      value: _getChatId2
	    });
	    Object.defineProperty(this, _getCurrentUser, {
	      value: _getCurrentUser2
	    });
	    Object.defineProperty(this, _getDialog, {
	      value: _getDialog2
	    });
	    Object.defineProperty(this, _getFileExtension, {
	      value: _getFileExtension2
	    });
	    Object.defineProperty(this, _getFileType, {
	      value: _getFileType2
	    });
	    Object.defineProperty(this, _getDiskFolderId, {
	      value: _getDiskFolderId2
	    });
	    Object.defineProperty(this, _preparePreview, {
	      value: _preparePreview2
	    });
	    Object.defineProperty(this, _updateFileSizeInStore, {
	      value: _updateFileSizeInStore2
	    });
	    Object.defineProperty(this, _updateFilePreviewInStore, {
	      value: _updateFilePreviewInStore2
	    });
	    Object.defineProperty(this, _addFileToStore, {
	      value: _addFileToStore2
	    });
	    Object.defineProperty(this, _cancelUpload, {
	      value: _cancelUpload2
	    });
	    Object.defineProperty(this, _updateFileProgress, {
	      value: _updateFileProgress2
	    });
	    Object.defineProperty(this, _prepareFileForUploader, {
	      value: _prepareFileForUploader2
	    });
	    Object.defineProperty(this, _uploadPreview, {
	      value: _uploadPreview2
	    });
	    Object.defineProperty(this, _tryCommit, {
	      value: _tryCommit2
	    });
	    Object.defineProperty(this, _requestDiskFolderId, {
	      value: _requestDiskFolderId2
	    });
	    Object.defineProperty(this, _setFileMapping, {
	      value: _setFileMapping2
	    });
	    Object.defineProperty(this, _isMediaFile, {
	      value: _isMediaFile2
	    });
	    Object.defineProperty(this, _initUploader, {
	      value: _initUploader2
	    });
	    Object.defineProperty(this, _addFileFromDiskToModel, {
	      value: _addFileFromDiskToModel2
	    });
	    Object.defineProperty(this, _processQueue, {
	      value: _processQueue2
	    });
	    Object.defineProperty(this, _addToQueue, {
	      value: _addToQueue2
	    });
	    Object.defineProperty(this, _createUploader, {
	      value: _createUploader2
	    });
	    Object.defineProperty(this, _store, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _restClient, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _isRequestingDiskFolderId, {
	      writable: true,
	      value: false
	    });
	    Object.defineProperty(this, _diskFolderIdRequestPromise, {
	      writable: true,
	      value: {}
	    });
	    Object.defineProperty(this, _uploaderWrapper, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _sendingService, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _uploaderFilesRegistry, {
	      writable: true,
	      value: {}
	    });
	    Object.defineProperty(this, _queue, {
	      writable: true,
	      value: []
	    });
	    Object.defineProperty(this, _isUploading, {
	      writable: true,
	      value: false
	    });
	    this.setEventNamespace(EVENT_NAMESPACE);
	    babelHelpers.classPrivateFieldLooseBase(this, _store)[_store] = im_v2_application_core.Core.getStore();
	    babelHelpers.classPrivateFieldLooseBase(this, _restClient)[_restClient] = im_v2_application_core.Core.getRestClient();
	    babelHelpers.classPrivateFieldLooseBase(this, _sendingService)[_sendingService] = im_v2_provider_service_sending.SendingService.getInstance();
	    babelHelpers.classPrivateFieldLooseBase(this, _initUploader)[_initUploader]();
	  }
	  async uploadFromClipboard(params) {
	    const {
	      clipboardEvent,
	      dialogId,
	      autoUpload,
	      imagesOnly
	    } = params;
	    const {
	      clipboardData
	    } = clipboardEvent;
	    if (!clipboardData || !ui_uploader_core.isFilePasted(clipboardData)) {
	      return '';
	    }
	    clipboardEvent.preventDefault();
	    let files = await ui_uploader_core.getFilesFromDataTransfer(clipboardData);
	    if (imagesOnly) {
	      files = files.filter(file => im_v2_lib_utils.Utils.file.isImage(file.name));
	      if (imagesOnly.length === 0) {
	        return '';
	      }
	    }
	    const {
	      uploaderFiles,
	      uploaderId
	    } = await this.addFiles({
	      files,
	      dialogId,
	      autoUpload
	    });
	    if (uploaderFiles.length === 0) {
	      return '';
	    }
	    return uploaderId;
	  }
	  async uploadFromInput(params) {
	    const {
	      event,
	      sendAsFile,
	      autoUpload,
	      dialogId
	    } = params;
	    const rawFiles = Object.values(event.target.files);
	    if (rawFiles.length === 0) {
	      return '';
	    }
	    const {
	      uploaderId
	    } = await this.addFiles({
	      files: rawFiles,
	      dialogId,
	      autoUpload,
	      sendAsFile
	    });
	    return uploaderId;
	  }
	  async uploadFromDragAndDrop(params) {
	    const {
	      event,
	      dialogId,
	      autoUpload,
	      sendAsFile
	    } = params;
	    event.preventDefault();
	    const rawFiles = await ui_uploader_core.getFilesFromDataTransfer(event.dataTransfer);
	    if (rawFiles.length === 0) {
	      return '';
	    }
	    const {
	      uploaderId
	    } = await this.addFiles({
	      files: rawFiles,
	      dialogId,
	      autoUpload,
	      sendAsFile
	    });
	    return uploaderId;
	  }
	  addFiles(params) {
	    const {
	      files,
	      dialogId,
	      autoUpload,
	      sendAsFile = false,
	      maxParallelUploads,
	      maxParallelLoads
	    } = params;
	    const uploaderParams = {
	      dialogId,
	      autoUpload,
	      maxParallelUploads,
	      maxParallelLoads
	    };
	    return babelHelpers.classPrivateFieldLooseBase(this, _createUploader)[_createUploader](uploaderParams).then(uploaderId => {
	      const filesForUploader = [];
	      files.forEach(file => {
	        const preparedFile = babelHelpers.classPrivateFieldLooseBase(this, _prepareFileForUploader)[_prepareFileForUploader](file, dialogId, uploaderId, sendAsFile);
	        filesForUploader.push(preparedFile);
	      });
	      const addedFiles = babelHelpers.classPrivateFieldLooseBase(this, _uploaderWrapper)[_uploaderWrapper].addFiles(filesForUploader);
	      babelHelpers.classPrivateFieldLooseBase(this, _registerFiles)[_registerFiles](uploaderId, addedFiles, dialogId, autoUpload);
	      return {
	        uploaderFiles: addedFiles,
	        uploaderId
	      };
	    });
	  }
	  getFiles(uploaderId) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _uploaderWrapper)[_uploaderWrapper].getFiles(uploaderId);
	  }
	  start(uploaderId) {
	    babelHelpers.classPrivateFieldLooseBase(this, _addToQueue)[_addToQueue](uploaderId);
	  }
	  stop(uploaderId) {
	    babelHelpers.classPrivateFieldLooseBase(this, _uploaderWrapper)[_uploaderWrapper].stop(uploaderId);
	  }
	  uploadFileFromDisk(files, dialogId) {
	    Object.values(files).forEach(file => {
	      const messageWithFile = babelHelpers.classPrivateFieldLooseBase(this, _prepareFileFromDisk)[_prepareFileFromDisk](file, dialogId);
	      babelHelpers.classPrivateFieldLooseBase(this, _addFileFromDiskToModel)[_addFileFromDiskToModel](messageWithFile).then(() => {
	        const message = {
	          tempMessageId: messageWithFile.tempMessageId,
	          fileIds: [messageWithFile.tempFileId],
	          dialogId: messageWithFile.dialogId
	        };
	        return babelHelpers.classPrivateFieldLooseBase(this, _sendingService)[_sendingService].sendMessageWithFiles(message);
	      }).then(() => {
	        this.commitFile({
	          chatId: messageWithFile.chatId,
	          temporaryFileId: messageWithFile.tempFileId,
	          tempMessageId: messageWithFile.tempMessageId,
	          realFileId: messageWithFile.file.id.slice(1),
	          fromDisk: true
	        });
	      }).catch(error => {
	        console.error('SendingService: sendFilesFromDisk error:', error);
	      });
	    });
	  }
	  checkDiskFolderId(dialogId) {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _getDiskFolderId)[_getDiskFolderId](dialogId) > 0) {
	      return Promise.resolve(babelHelpers.classPrivateFieldLooseBase(this, _getDiskFolderId)[_getDiskFolderId](dialogId));
	    }
	    if (babelHelpers.classPrivateFieldLooseBase(this, _isRequestingDiskFolderId)[_isRequestingDiskFolderId]) {
	      return babelHelpers.classPrivateFieldLooseBase(this, _diskFolderIdRequestPromise)[_diskFolderIdRequestPromise][dialogId];
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _diskFolderIdRequestPromise)[_diskFolderIdRequestPromise][dialogId] = babelHelpers.classPrivateFieldLooseBase(this, _requestDiskFolderId)[_requestDiskFolderId](dialogId);
	    return babelHelpers.classPrivateFieldLooseBase(this, _diskFolderIdRequestPromise)[_diskFolderIdRequestPromise][dialogId];
	  }
	  commitFile(params) {
	    const {
	      temporaryFileId,
	      tempMessageId,
	      chatId,
	      realFileId,
	      fromDisk,
	      messageText = '',
	      sendAsFile = false
	    } = params;
	    const fileIdParams = {};
	    if (fromDisk) {
	      fileIdParams.disk_id = realFileId;
	    } else {
	      fileIdParams.upload_id = realFileId.toString().slice(1);
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _restClient)[_restClient].callMethod(im_v2_const.RestMethod.imDiskFileCommit, {
	      chat_id: chatId,
	      message: messageText,
	      template_id: tempMessageId,
	      file_template_id: temporaryFileId,
	      as_file: sendAsFile ? 'Y' : 'N',
	      ...fileIdParams
	    }).catch(error => {
	      babelHelpers.classPrivateFieldLooseBase(this, _setMessageError)[_setMessageError](tempMessageId);
	      babelHelpers.classPrivateFieldLooseBase(this, _updateFileProgress)[_updateFileProgress](temporaryFileId, 0, im_v2_const.FileStatus.error);
	      console.error('commitFile error', error);
	    });
	  }
	  commitMessage(uploaderId) {
	    const dialogId = babelHelpers.classPrivateFieldLooseBase(this, _uploaderFilesRegistry)[_uploaderFilesRegistry][uploaderId].dialogId;
	    const chatId = babelHelpers.classPrivateFieldLooseBase(this, _getChatId)[_getChatId](dialogId);
	    const fileIds = babelHelpers.classPrivateFieldLooseBase(this, _uploaderWrapper)[_uploaderWrapper].getFiles(uploaderId).map(file => {
	      return file.getServerFileId().toString().slice(1);
	    });
	    const sendAsFile = babelHelpers.classPrivateFieldLooseBase(this, _uploaderWrapper)[_uploaderWrapper].getFiles(uploaderId).every(file => {
	      return file.getCustomData('sendAsFile');
	    });
	    return babelHelpers.classPrivateFieldLooseBase(this, _restClient)[_restClient].callMethod(im_v2_const.RestMethod.imDiskFileCommit, {
	      chat_id: chatId,
	      message: babelHelpers.classPrivateFieldLooseBase(this, _uploaderFilesRegistry)[_uploaderFilesRegistry][uploaderId].text,
	      template_id: babelHelpers.classPrivateFieldLooseBase(this, _uploaderFilesRegistry)[_uploaderFilesRegistry][uploaderId].tempMessageId,
	      // file_template_id: temporaryFileId,
	      as_file: sendAsFile ? 'Y' : 'N',
	      upload_id: fileIds
	    });
	  }
	  // we don't use it now, because we always send several files in ONE message
	  // noinspection JSUnusedGlobalSymbols
	  sendSeparateMessagesWithFiles(params) {
	    const {
	      uploaderId,
	      text
	    } = params;
	    babelHelpers.classPrivateFieldLooseBase(this, _setMessagesText)[_setMessagesText](uploaderId, text);
	    babelHelpers.classPrivateFieldLooseBase(this, _setAutoUpload)[_setAutoUpload](uploaderId, true);
	    babelHelpers.classPrivateFieldLooseBase(this, _tryToSendMessages)[_tryToSendMessages](uploaderId);
	  }
	  sendMessageWithFiles(params) {
	    const {
	      uploaderId,
	      text
	    } = params;
	    babelHelpers.classPrivateFieldLooseBase(this, _setMessagesText)[_setMessagesText](uploaderId, text);
	    babelHelpers.classPrivateFieldLooseBase(this, _setAutoUpload)[_setAutoUpload](uploaderId, true);
	    babelHelpers.classPrivateFieldLooseBase(this, _tryToSendMessage)[_tryToSendMessage](uploaderId);
	  }
	  getUploaderIdByFileId(fileId) {
	    const uploaderIds = Object.keys(babelHelpers.classPrivateFieldLooseBase(this, _uploaderFilesRegistry)[_uploaderFilesRegistry]);
	    return uploaderIds.find(uploaderId => {
	      return this.getFiles(uploaderId).some(file => {
	        return file.getId() === fileId;
	      });
	    });
	  }
	  removeFileFromUploader(options) {
	    const {
	      uploaderId,
	      filesIds,
	      restartUploading = false
	    } = options;
	    const files = babelHelpers.classPrivateFieldLooseBase(this, _uploaderWrapper)[_uploaderWrapper].getFiles(uploaderId).filter(file => {
	      return filesIds.includes(file.getId());
	    });
	    files.forEach(file => {
	      file.remove();
	      file.abort();
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _unregisterFiles)[_unregisterFiles](uploaderId, files);
	    if (restartUploading) {
	      const [firstFile] = this.getFiles(uploaderId);
	      if (firstFile) {
	        firstFile.upload();
	      }
	    }
	  }
	  destroy() {
	    babelHelpers.classPrivateFieldLooseBase(this, _uploaderWrapper)[_uploaderWrapper].destroy();
	  }
	  async retry(uploaderId) {
	    const {
	      dialogId,
	      text,
	      tempMessageId
	    } = babelHelpers.classPrivateFieldLooseBase(this, _uploaderFilesRegistry)[_uploaderFilesRegistry][uploaderId];
	    const sendAsFile = this.getFiles(uploaderId).some(file => {
	      return file.getCustomData('sendAsFile');
	    });
	    const binaryFiles = babelHelpers.classPrivateFieldLooseBase(this, _getBinaryFiles)[_getBinaryFiles](uploaderId);
	    const {
	      uploaderId: newUploaderId
	    } = await this.addFiles({
	      dialogId,
	      files: binaryFiles,
	      sendAsFile
	    });
	    void babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].dispatch('messages/delete', {
	      id: tempMessageId
	    });
	    this.sendMessageWithFiles({
	      uploaderId: newUploaderId,
	      text
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _destroyUploader)[_destroyUploader](uploaderId);
	  }
	}
	function _createUploader2(params) {
	  const {
	    dialogId,
	    autoUpload,
	    maxParallelUploads,
	    maxParallelLoads
	  } = params;
	  const uploaderId = im_v2_lib_utils.Utils.text.getUuidV4();
	  const chatId = babelHelpers.classPrivateFieldLooseBase(this, _getChatId)[_getChatId](dialogId);
	  return this.checkDiskFolderId(dialogId).then(diskFolderId => {
	    babelHelpers.classPrivateFieldLooseBase(this, _uploaderWrapper)[_uploaderWrapper].createUploader({
	      diskFolderId,
	      uploaderId,
	      autoUpload,
	      chatId,
	      dialogId,
	      maxParallelUploads,
	      maxParallelLoads
	    });
	    return uploaderId;
	  });
	}
	function _addToQueue2(uploaderId) {
	  babelHelpers.classPrivateFieldLooseBase(this, _queue)[_queue].push(uploaderId);
	  babelHelpers.classPrivateFieldLooseBase(this, _processQueue)[_processQueue]();
	}
	function _processQueue2() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _isUploading)[_isUploading] || babelHelpers.classPrivateFieldLooseBase(this, _queue)[_queue].length === 0) {
	    return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _isUploading)[_isUploading] = true;
	  const uploaderId = babelHelpers.classPrivateFieldLooseBase(this, _queue)[_queue].shift();
	  babelHelpers.classPrivateFieldLooseBase(this, _uploaderFilesRegistry)[_uploaderFilesRegistry][uploaderId].autoUpload = true;
	  babelHelpers.classPrivateFieldLooseBase(this, _uploaderWrapper)[_uploaderWrapper].start(uploaderId);
	}
	function _addFileFromDiskToModel2(messageWithFile) {
	  return babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].dispatch('files/add', {
	    id: messageWithFile.tempFileId,
	    chatId: messageWithFile.chatId,
	    authorId: im_v2_application_core.Core.getUserId(),
	    name: messageWithFile.file.name,
	    type: im_v2_lib_utils.Utils.file.getFileTypeByExtension(messageWithFile.file.ext),
	    extension: messageWithFile.file.ext,
	    size: messageWithFile.file.sizeInt,
	    status: im_v2_const.FileStatus.wait,
	    progress: 0,
	    authorName: babelHelpers.classPrivateFieldLooseBase(this, _getCurrentUser)[_getCurrentUser]().name
	  });
	}
	function _initUploader2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _uploaderWrapper)[_uploaderWrapper] = new UploaderWrapper();
	  babelHelpers.classPrivateFieldLooseBase(this, _uploaderWrapper)[_uploaderWrapper].subscribe(UploaderWrapper.events.onFileAddStart, event => {
	    const {
	      file
	    } = event.getData();
	    babelHelpers.classPrivateFieldLooseBase(this, _addFileToStore)[_addFileToStore](file);
	  });
	  babelHelpers.classPrivateFieldLooseBase(this, _uploaderWrapper)[_uploaderWrapper].subscribe(UploaderWrapper.events.onFileAdd, event => {
	    const {
	      file,
	      uploaderId
	    } = event.getData();
	    babelHelpers.classPrivateFieldLooseBase(this, _updateFilePreviewInStore)[_updateFilePreviewInStore](file);
	    babelHelpers.classPrivateFieldLooseBase(this, _setPreviewCreatedStatus)[_setPreviewCreatedStatus](uploaderId, file.getId());
	    babelHelpers.classPrivateFieldLooseBase(this, _tryToSendMessage)[_tryToSendMessage](uploaderId);
	  });
	  babelHelpers.classPrivateFieldLooseBase(this, _uploaderWrapper)[_uploaderWrapper].subscribe(UploaderWrapper.events.onFileUploadStart, event => {
	    const {
	      file
	    } = event.getData();
	    babelHelpers.classPrivateFieldLooseBase(this, _updateFileSizeInStore)[_updateFileSizeInStore](file);
	    this.emit(UploadingService.event.uploadStart);
	  });
	  babelHelpers.classPrivateFieldLooseBase(this, _uploaderWrapper)[_uploaderWrapper].subscribe(UploaderWrapper.events.onFileUploadProgress, event => {
	    const {
	      file
	    } = event.getData();
	    babelHelpers.classPrivateFieldLooseBase(this, _updateFileProgress)[_updateFileProgress](file.getId(), file.getProgress(), im_v2_const.FileStatus.upload);
	  });
	  babelHelpers.classPrivateFieldLooseBase(this, _uploaderWrapper)[_uploaderWrapper].subscribe(UploaderWrapper.events.onFileUploadComplete, async event => {
	    const {
	      file,
	      uploaderId
	    } = event.getData();
	    const serverFileId = file.getServerFileId().toString().slice(1);
	    const temporaryFileId = file.getId();
	    if (babelHelpers.classPrivateFieldLooseBase(this, _isMediaFile)[_isMediaFile](temporaryFileId)) {
	      babelHelpers.classPrivateFieldLooseBase(this, _setFileMapping)[_setFileMapping]({
	        serverFileId,
	        temporaryFileId
	      });
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _updateFileProgress)[_updateFileProgress](temporaryFileId, file.getProgress(), im_v2_const.FileStatus.wait);
	    await babelHelpers.classPrivateFieldLooseBase(this, _uploadPreview)[_uploadPreview](file);
	    babelHelpers.classPrivateFieldLooseBase(this, _setPreviewSentStatus)[_setPreviewSentStatus](uploaderId, temporaryFileId);
	    void babelHelpers.classPrivateFieldLooseBase(this, _tryCommit)[_tryCommit](uploaderId);
	    this.emit(UploadingService.event.uploadComplete);
	  });
	  babelHelpers.classPrivateFieldLooseBase(this, _uploaderWrapper)[_uploaderWrapper].subscribe(UploaderWrapper.events.onFileUploadError, event => {
	    const {
	      file,
	      error,
	      uploaderId
	    } = event.getData();
	    babelHelpers.classPrivateFieldLooseBase(this, _setMessageError)[_setMessageError](file.getCustomData('tempMessageId'));
	    this.getFiles(uploaderId).forEach(uploaderFile => {
	      babelHelpers.classPrivateFieldLooseBase(this, _updateFileProgress)[_updateFileProgress](uploaderFile.getId(), 0, im_v2_const.FileStatus.error);
	    });
	    if (babelHelpers.classPrivateFieldLooseBase(this, _isMaxFileSizeExceeded)[_isMaxFileSizeExceeded](error)) {
	      im_v2_lib_notifier.Notifier.file.handleUploadError(error);
	    }
	    im_v2_lib_logger.Logger.error('UploadingService: upload error', error);
	    this.emit(UploadingService.event.uploadError);
	    babelHelpers.classPrivateFieldLooseBase(this, _isUploading)[_isUploading] = false;
	    babelHelpers.classPrivateFieldLooseBase(this, _processQueue)[_processQueue]();
	    this.stop(uploaderId);
	  });
	  babelHelpers.classPrivateFieldLooseBase(this, _uploaderWrapper)[_uploaderWrapper].subscribe(UploaderWrapper.events.onFileUploadCancel, event => {
	    const {
	      tempMessageId,
	      tempFileId
	    } = event.getData();
	    babelHelpers.classPrivateFieldLooseBase(this, _cancelUpload)[_cancelUpload](tempMessageId, tempFileId);
	    this.emit(UploadingService.event.uploadCancel);
	  });
	  babelHelpers.classPrivateFieldLooseBase(this, _uploaderWrapper)[_uploaderWrapper].subscribe(UploaderWrapper.events.onUploadComplete, () => {
	    babelHelpers.classPrivateFieldLooseBase(this, _isUploading)[_isUploading] = false;
	    babelHelpers.classPrivateFieldLooseBase(this, _processQueue)[_processQueue]();
	  });
	}
	function _isMediaFile2(fileId) {
	  const mediaFileTypes = [im_v2_const.FileType.image, im_v2_const.FileType.video];
	  const file = babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].getters['files/get'](fileId);
	  return Boolean(file) && mediaFileTypes.includes(file.type);
	}
	function _setFileMapping2(options) {
	  void babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].dispatch('files/setTemporaryFileMapping', options);
	}
	function _requestDiskFolderId2(dialogId) {
	  return new Promise((resolve, reject) => {
	    babelHelpers.classPrivateFieldLooseBase(this, _isRequestingDiskFolderId)[_isRequestingDiskFolderId] = true;
	    const chatId = babelHelpers.classPrivateFieldLooseBase(this, _getChatId)[_getChatId](dialogId);
	    babelHelpers.classPrivateFieldLooseBase(this, _restClient)[_restClient].callMethod(im_v2_const.RestMethod.imDiskFolderGet, {
	      chat_id: chatId
	    }).then(response => {
	      const {
	        ID: diskFolderId
	      } = response.data();
	      babelHelpers.classPrivateFieldLooseBase(this, _isRequestingDiskFolderId)[_isRequestingDiskFolderId] = false;
	      void babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].dispatch('chats/update', {
	        dialogId,
	        fields: {
	          diskFolderId
	        }
	      });
	      resolve(diskFolderId);
	    }).catch(error => {
	      babelHelpers.classPrivateFieldLooseBase(this, _isRequestingDiskFolderId)[_isRequestingDiskFolderId] = false;
	      reject(error);
	    });
	  });
	}
	async function _tryCommit2(uploaderId) {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _readyToCommit)[_readyToCommit](uploaderId)) {
	    return;
	  }
	  await this.commitMessage(uploaderId);
	  babelHelpers.classPrivateFieldLooseBase(this, _destroyUploader)[_destroyUploader](uploaderId);
	}
	async function _uploadPreview2(file) {
	  const needPreview = babelHelpers.classPrivateFieldLooseBase(this, _getFileType)[_getFileType](file.getBinary()) === im_v2_const.FileType.video || file.isAnimated();
	  if (!needPreview) {
	    return Promise.resolve();
	  }
	  const id = file.getServerFileId().toString().slice(1);
	  const previewFile = file.getClientPreview();
	  if (!previewFile) {
	    file.setCustomData('sendAsFile', true);
	    return Promise.resolve();
	  }
	  const formData = new FormData();
	  formData.append('id', id);
	  formData.append('previewFile', previewFile, `preview_${file.getName()}.jpg`);
	  return im_v2_lib_rest.runAction(im_v2_const.RestMethod.imDiskFilePreviewUpload, {
	    data: formData
	  }).catch(([error]) => {
	    console.error('imDiskFilePreviewUpload request error', error);
	  });
	}
	function _prepareFileForUploader2(file, dialogId, uploaderId, sendAsFile) {
	  const tempMessageId = im_v2_lib_utils.Utils.text.getUuidV4();
	  const tempFileId = im_v2_lib_utils.Utils.text.getUuidV4();
	  const chatId = babelHelpers.classPrivateFieldLooseBase(this, _getChatId)[_getChatId](dialogId);
	  return {
	    tempMessageId,
	    tempFileId,
	    file,
	    dialogId,
	    chatId,
	    uploaderId,
	    sendAsFile
	  };
	}
	function _updateFileProgress2(id, progress, status) {
	  void babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].dispatch('files/update', {
	    id,
	    fields: {
	      progress: progress === 100 ? 99 : progress,
	      status
	    }
	  });
	}
	function _cancelUpload2(tempMessageId, tempFileId) {
	  const message = babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].getters['messages/getById'](tempMessageId);
	  if (message) {
	    void babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].dispatch('messages/delete', {
	      id: tempMessageId
	    });
	    void babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].dispatch('files/delete', {
	      id: tempFileId
	    });
	    const chat = babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].getters['chats/getByChatId'](message.chatId);
	    const lastMessageId = babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].getters['messages/findLastChatMessageId'](message.chatId);
	    if (main_core.Type.isString(lastMessageId) || main_core.Type.isNumber(lastMessageId)) {
	      void babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].dispatch('recent/update', {
	        id: chat.dialogId,
	        fields: {
	          messageId: lastMessageId
	        }
	      });
	    } else {
	      void babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].dispatch('recent/delete', {
	        id: chat.dialogId
	      });
	    }
	  }
	}
	function _addFileToStore2(file) {
	  const taskId = file.getId();
	  const fileBinary = file.getBinary();
	  const previewData = babelHelpers.classPrivateFieldLooseBase(this, _preparePreview)[_preparePreview](file);
	  const asFile = file.getCustomData('sendAsFile');
	  void babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].dispatch('files/add', {
	    id: taskId,
	    chatId: file.getCustomData('chatId'),
	    authorId: im_v2_application_core.Core.getUserId(),
	    name: fileBinary.name,
	    size: file.getSize(),
	    type: asFile ? im_v2_const.FileType.file : babelHelpers.classPrivateFieldLooseBase(this, _getFileType)[_getFileType](fileBinary),
	    extension: babelHelpers.classPrivateFieldLooseBase(this, _getFileExtension)[_getFileExtension](fileBinary),
	    status: file.isFailed() ? im_v2_const.FileStatus.error : im_v2_const.FileStatus.progress,
	    progress: 0,
	    authorName: babelHelpers.classPrivateFieldLooseBase(this, _getCurrentUser)[_getCurrentUser]().name,
	    urlDownload: URL.createObjectURL(file.getBinary()),
	    ...previewData
	  });
	}
	function _updateFilePreviewInStore2(file) {
	  const previewData = babelHelpers.classPrivateFieldLooseBase(this, _preparePreview)[_preparePreview](file);
	  void babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].dispatch('files/update', {
	    id: file.getId(),
	    fields: {
	      ...previewData
	    }
	  });
	}
	function _updateFileSizeInStore2(file) {
	  void babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].dispatch('files/update', {
	    id: file.getId(),
	    fields: {
	      size: file.getSize()
	    }
	  });
	}
	function _preparePreview2(file) {
	  if (file.getCustomData('sendAsFile')) {
	    return {};
	  }
	  const preview = {
	    blob: file.getPreviewUrl(),
	    width: file.getPreviewWidth(),
	    height: file.getPreviewHeight()
	  };
	  const previewData = {};
	  if (preview.blob) {
	    previewData.image = {
	      width: preview.width,
	      height: preview.height
	    };
	    previewData.urlPreview = preview.blob;
	  }
	  if (file.getClientPreview()) {
	    previewData.urlPreview = URL.createObjectURL(file.getClientPreview());
	  }
	  return previewData;
	}
	function _getDiskFolderId2(dialogId) {
	  return babelHelpers.classPrivateFieldLooseBase(this, _getDialog)[_getDialog](dialogId).diskFolderId;
	}
	function _getFileType2(file) {
	  let fileType = im_v2_const.FileType.file;
	  if (file.type.startsWith('image')) {
	    fileType = im_v2_const.FileType.image;
	  } else if (file.type.startsWith('video')) {
	    fileType = im_v2_const.FileType.video;
	  }
	  return fileType;
	}
	function _getFileExtension2(file) {
	  return file.name.split('.').splice(-1)[0];
	}
	function _getDialog2(dialogId) {
	  return babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].getters['chats/get'](dialogId);
	}
	function _getCurrentUser2() {
	  const userId = im_v2_application_core.Core.getUserId();
	  return babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].getters['users/get'](userId);
	}
	function _getChatId2(dialogId) {
	  var _babelHelpers$classPr;
	  return (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _getDialog)[_getDialog](dialogId)) == null ? void 0 : _babelHelpers$classPr.chatId;
	}
	function _registerFiles2(uploaderId, files, dialogId, autoUpload) {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _uploaderFilesRegistry)[_uploaderFilesRegistry][uploaderId]) {
	    babelHelpers.classPrivateFieldLooseBase(this, _uploaderFilesRegistry)[_uploaderFilesRegistry][uploaderId] = {
	      previewCreatedStatus: {},
	      previewSentStatus: {},
	      dialogId,
	      text: '',
	      autoUpload
	    };
	  }
	  files.forEach(file => {
	    const fileId = file.getId();
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _uploaderFilesRegistry)[_uploaderFilesRegistry][uploaderId].previewCreatedStatus) {
	      babelHelpers.classPrivateFieldLooseBase(this, _uploaderFilesRegistry)[_uploaderFilesRegistry][uploaderId].previewCreatedStatus = {};
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _uploaderFilesRegistry)[_uploaderFilesRegistry][uploaderId].previewCreatedStatus[fileId] = false;
	    babelHelpers.classPrivateFieldLooseBase(this, _uploaderFilesRegistry)[_uploaderFilesRegistry][uploaderId].previewSentStatus[fileId] = false;
	  });
	}
	function _unregisterFiles2(uploaderId, files) {
	  const entry = babelHelpers.classPrivateFieldLooseBase(this, _uploaderFilesRegistry)[_uploaderFilesRegistry][uploaderId];
	  if (entry) {
	    files.forEach(file => {
	      const fileId = file.getId();
	      if (babelHelpers.classPrivateFieldLooseBase(this, _uploaderFilesRegistry)[_uploaderFilesRegistry][uploaderId].previewCreatedStatus) {
	        delete babelHelpers.classPrivateFieldLooseBase(this, _uploaderFilesRegistry)[_uploaderFilesRegistry][uploaderId].previewCreatedStatus[fileId];
	        delete babelHelpers.classPrivateFieldLooseBase(this, _uploaderFilesRegistry)[_uploaderFilesRegistry][uploaderId].previewSentStatus[fileId];
	      }
	    });
	  }
	}
	function _setPreviewCreatedStatus2(uploaderId, fileId) {
	  babelHelpers.classPrivateFieldLooseBase(this, _uploaderFilesRegistry)[_uploaderFilesRegistry][uploaderId].previewCreatedStatus[fileId] = true;
	}
	function _setPreviewSentStatus2(uploaderId, fileId) {
	  babelHelpers.classPrivateFieldLooseBase(this, _uploaderFilesRegistry)[_uploaderFilesRegistry][uploaderId].previewSentStatus[fileId] = true;
	}
	function _setMessagesText2(uploaderId, text) {
	  babelHelpers.classPrivateFieldLooseBase(this, _uploaderFilesRegistry)[_uploaderFilesRegistry][uploaderId].text = text;
	}
	function _setAutoUpload2(uploaderId, autoUploadFlag) {
	  babelHelpers.classPrivateFieldLooseBase(this, _uploaderFilesRegistry)[_uploaderFilesRegistry][uploaderId].autoUpload = autoUploadFlag;
	}
	function _createMessagesFromFiles2(uploaderId) {
	  const messagesToSend = {
	    comment: {},
	    files: []
	  };
	  const files = this.getFiles(uploaderId);
	  const text = babelHelpers.classPrivateFieldLooseBase(this, _uploaderFilesRegistry)[_uploaderFilesRegistry][uploaderId].text;
	  const dialogId = babelHelpers.classPrivateFieldLooseBase(this, _uploaderFilesRegistry)[_uploaderFilesRegistry][uploaderId].dialogId;
	  const hasText = text.length > 0;

	  // if we have more than one file and text, we need to send text message first
	  if (files.length > 1 && hasText) {
	    messagesToSend.comment = {
	      dialogId,
	      text
	    };
	  }
	  files.forEach(file => {
	    var _file$getCustomData;
	    if (file.getError()) {
	      return;
	    }
	    const messageId = im_v2_lib_utils.Utils.text.getUuidV4();
	    file.setCustomData('messageId', messageId);
	    if (files.length === 1 && hasText) {
	      file.setCustomData('messageText', text);
	    }
	    messagesToSend.files.push({
	      fileIds: [file.getId()],
	      tempMessageId: file.getCustomData('tempMessageId'),
	      dialogId,
	      text: (_file$getCustomData = file.getCustomData('messageText')) != null ? _file$getCustomData : ''
	    });
	  });
	  return messagesToSend;
	}
	function _createMessageFromFiles2(uploaderId) {
	  const fileIds = [];
	  const files = this.getFiles(uploaderId);
	  files.forEach(file => {
	    if (!file.getError()) {
	      fileIds.push(file.getId());
	    }
	  });
	  const text = babelHelpers.classPrivateFieldLooseBase(this, _uploaderFilesRegistry)[_uploaderFilesRegistry][uploaderId].text;
	  const dialogId = babelHelpers.classPrivateFieldLooseBase(this, _uploaderFilesRegistry)[_uploaderFilesRegistry][uploaderId].dialogId;
	  const tempMessageId = files[0].getCustomData('tempMessageId');
	  babelHelpers.classPrivateFieldLooseBase(this, _uploaderFilesRegistry)[_uploaderFilesRegistry][uploaderId].tempMessageId = tempMessageId;
	  return {
	    fileIds,
	    tempMessageId,
	    dialogId,
	    text
	  };
	}
	function _readyToAddMessages2(uploaderId) {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _uploaderFilesRegistry)[_uploaderFilesRegistry][uploaderId] || !babelHelpers.classPrivateFieldLooseBase(this, _uploaderFilesRegistry)[_uploaderFilesRegistry][uploaderId].autoUpload || babelHelpers.classPrivateFieldLooseBase(this, _uploaderFilesRegistry)[_uploaderFilesRegistry][uploaderId].wasSent) {
	    return false;
	  }
	  const {
	    previewCreatedStatus
	  } = babelHelpers.classPrivateFieldLooseBase(this, _uploaderFilesRegistry)[_uploaderFilesRegistry][uploaderId];
	  return Object.values(previewCreatedStatus).every(flag => flag === true);
	}
	function _readyToCommit2(uploaderId) {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _uploaderFilesRegistry)[_uploaderFilesRegistry][uploaderId]) {
	    return false;
	  }
	  const {
	    previewSentStatus
	  } = babelHelpers.classPrivateFieldLooseBase(this, _uploaderFilesRegistry)[_uploaderFilesRegistry][uploaderId];
	  return Object.values(previewSentStatus).every(flag => flag === true);
	}
	function _tryToSendMessage2(uploaderId) {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _readyToAddMessages)[_readyToAddMessages](uploaderId)) {
	    return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _uploaderFilesRegistry)[_uploaderFilesRegistry][uploaderId].wasSent = true;
	  const message = babelHelpers.classPrivateFieldLooseBase(this, _createMessageFromFiles)[_createMessageFromFiles](uploaderId);
	  void babelHelpers.classPrivateFieldLooseBase(this, _sendingService)[_sendingService].sendMessageWithFiles(message);
	  this.start(uploaderId);
	}
	function _tryToSendMessages2(uploaderId) {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _readyToAddMessages)[_readyToAddMessages](uploaderId)) {
	    return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _uploaderFilesRegistry)[_uploaderFilesRegistry][uploaderId].wasSent = true;
	  const {
	    comment,
	    files
	  } = babelHelpers.classPrivateFieldLooseBase(this, _createMessagesFromFiles)[_createMessagesFromFiles](uploaderId);
	  if (comment.text) {
	    babelHelpers.classPrivateFieldLooseBase(this, _sendingService)[_sendingService].sendMessage(comment);
	  }
	  files.forEach(message => {
	    void babelHelpers.classPrivateFieldLooseBase(this, _sendingService)[_sendingService].sendMessageWithFiles(message);
	  });
	  this.start(uploaderId);
	}
	function _prepareFileFromDisk2(file, dialogId) {
	  const tempMessageId = im_v2_lib_utils.Utils.text.getUuidV4();
	  const realFileId = file.id.slice(1); // 'n123' => '123'
	  const tempFileId = `${tempMessageId}|${realFileId}`;
	  return {
	    tempMessageId,
	    tempFileId,
	    dialogId,
	    file,
	    chatId: babelHelpers.classPrivateFieldLooseBase(this, _getDialog)[_getDialog](dialogId).chatId
	  };
	}
	function _isMaxFileSizeExceeded2(error) {
	  return error.getCode() === 'MAX_FILE_SIZE_EXCEEDED';
	}
	function _setMessageError2(tempMessageId) {
	  void babelHelpers.classPrivateFieldLooseBase(this, _store)[_store].dispatch('messages/update', {
	    id: tempMessageId,
	    fields: {
	      error: true
	    }
	  });
	}
	function _destroyUploader2(uploaderId) {
	  babelHelpers.classPrivateFieldLooseBase(this, _uploaderWrapper)[_uploaderWrapper].destroyUploader(uploaderId);
	  delete babelHelpers.classPrivateFieldLooseBase(this, _uploaderFilesRegistry)[_uploaderFilesRegistry][uploaderId];
	}
	function _getBinaryFiles2(uploaderId) {
	  return this.getFiles(uploaderId).map(file => {
	    return file.getBinary();
	  });
	}
	UploadingService.event = {
	  uploadStart: 'uploadStart',
	  uploadComplete: 'uploadComplete',
	  uploadError: 'uploadError',
	  uploadCancel: 'uploadCancel'
	};
	UploadingService.instance = null;

	const MAX_FILES_COUNT_IN_ONE_MESSAGE = 10;
	const MAX_FILES_COUNT = 100;
	const MAX_PARALLEL_LOADS = 10;
	const MAX_PARALLEL_UPLOADS = 3;
	var _getUploadingService = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getUploadingService");
	class MultiUploadingService {
	  constructor() {
	    Object.defineProperty(this, _getUploadingService, {
	      value: _getUploadingService2
	    });
	  }
	  static makeChunks(options) {
	    const {
	      files,
	      chunkSize = MAX_FILES_COUNT_IN_ONE_MESSAGE,
	      maxFilesCount = MAX_FILES_COUNT
	    } = options;
	    const chunks = [];
	    if (main_core.Type.isArray(files)) {
	      const preparedFiles = files.slice(0, maxFilesCount);
	      for (let i = 0; i < preparedFiles.length; i += chunkSize) {
	        const chunk = preparedFiles.slice(i, i + chunkSize);
	        chunks.push(chunk);
	      }
	    }
	    return chunks;
	  }
	  static getMaxParallelLoads(chunks) {
	    return Math.floor(MAX_PARALLEL_LOADS / chunks.length);
	  }
	  async addFiles(params) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _getUploadingService)[_getUploadingService]().addFiles(params);
	  }
	  async uploadFromInput(params) {
	    const {
	      event,
	      sendAsFile,
	      autoUpload,
	      dialogId
	    } = params;
	    const rawFiles = Object.values(event.target.files);
	    const chunks = MultiUploadingService.makeChunks({
	      files: rawFiles
	    });
	    const addFilesResults = await Promise.all(chunks.map(chunk => {
	      return this.addFiles({
	        files: chunk,
	        maxParallelLoads: MultiUploadingService.getMaxParallelLoads(chunks),
	        maxParallelUploads: MAX_PARALLEL_UPLOADS,
	        dialogId,
	        autoUpload,
	        sendAsFile
	      });
	    }));
	    const uploaderIds = addFilesResults.map(({
	      uploaderId
	    }) => {
	      return uploaderId;
	    });
	    const sourceFilesCount = rawFiles.length;
	    return {
	      uploaderIds,
	      sourceFilesCount
	    };
	  }
	  async uploadFromClipboard(params) {
	    const {
	      clipboardEvent,
	      dialogId,
	      autoUpload,
	      imagesOnly
	    } = params;
	    const {
	      clipboardData
	    } = clipboardEvent;
	    if (!clipboardData || !ui_uploader_core.isFilePasted(clipboardData)) {
	      return {
	        uploaderIds: [],
	        sourceFilesCount: 0
	      };
	    }
	    clipboardEvent.preventDefault();
	    let files = await ui_uploader_core.getFilesFromDataTransfer(clipboardData);
	    if (imagesOnly) {
	      files = files.filter(file => im_v2_lib_utils.Utils.file.isImage(file.name));
	      if (imagesOnly.length === 0) {
	        return {
	          uploaderIds: [],
	          sourceFilesCount: 0
	        };
	      }
	    }
	    const chunks = MultiUploadingService.makeChunks({
	      files
	    });
	    const addFilesResults = await Promise.all(chunks.map(chunk => {
	      return this.addFiles({
	        files: chunk,
	        maxParallelLoads: MultiUploadingService.getMaxParallelLoads(chunks),
	        maxParallelUploads: MAX_PARALLEL_UPLOADS,
	        dialogId,
	        autoUpload
	      });
	    }));
	    const uploaderIds = addFilesResults.filter(addFilesResult => {
	      return addFilesResult.uploaderFiles.length > 0;
	    }).map(({
	      uploaderId
	    }) => {
	      return uploaderId;
	    });
	    const sourceFilesCount = files.length;
	    return {
	      uploaderIds,
	      sourceFilesCount
	    };
	  }
	  async uploadFromDragAndDrop(params) {
	    const {
	      event,
	      dialogId,
	      autoUpload,
	      sendAsFile
	    } = params;
	    const rawFiles = await ui_uploader_core.getFilesFromDataTransfer(event.dataTransfer);
	    const chunks = MultiUploadingService.makeChunks({
	      files: rawFiles
	    });
	    const addFilesResults = await Promise.all(chunks.map(chunk => {
	      return this.addFiles({
	        files: chunk,
	        maxParallelLoads: MultiUploadingService.getMaxParallelLoads(chunks),
	        maxParallelUploads: MAX_PARALLEL_UPLOADS,
	        dialogId,
	        autoUpload,
	        sendAsFile
	      });
	    }));
	    const uploaderIds = addFilesResults.map(({
	      uploaderId
	    }) => {
	      return uploaderId;
	    });
	    const sourceFilesCount = rawFiles.length;
	    return {
	      uploaderIds,
	      sourceFilesCount
	    };
	  }
	}
	function _getUploadingService2() {
	  return UploadingService.getInstance();
	}

	exports.UploadingService = UploadingService;
	exports.MultiUploadingService = MultiUploadingService;

}((this.BX.Messenger.v2.Service = this.BX.Messenger.v2.Service || {}),BX.Messenger.v2.Lib,BX.Messenger.v2.Application,BX.Messenger.v2.Lib,BX.Messenger.v2.Lib,BX.Messenger.v2.Service,BX.Event,BX.Messenger.v2.Const,BX.Messenger.v2.Lib,BX,BX.UI.Uploader));
//# sourceMappingURL=uploading.bundle.js.map
