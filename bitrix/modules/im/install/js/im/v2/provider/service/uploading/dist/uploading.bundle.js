/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, main_core_events, ui_uploader_core, im_v2_application_core, im_v2_const, im_v2_lib_logger, im_v2_lib_notifier, im_v2_lib_rest, im_v2_lib_utils, im_v2_provider_service_sending, im_v2_lib_desktopApi) {
	'use strict';

	class UploaderVideoCompressionFilter extends ui_uploader_core.Filter {
		#store = null;
		constructor(...args) {
			super(...args);
			this.#store = im_v2_application_core.Core.getStore();
		}
		async apply(file) {
			if (file.isVideo() && !file.shouldTreatImageAsFile() && im_v2_lib_desktopApi.DesktopApi.isMediaCompressorAvailable()) {
				await this.setModelFileStatus(file.getId(), im_v2_const.FileStatus.preparing);
				const compressor = im_v2_lib_desktopApi.DesktopApi.createMediaCompressor();
				const cancelPromise = new Promise(resolve => {
					file.subscribeOnce(ui_uploader_core.FileEvent.REMOVE_COMPLETE, () => {
						compressor.cancel();
						compressor.removeCompressedFile();
						file.remove();
						resolve(null);
					});
				});
				const compressedFile = await Promise.race([compressor.compress(file.getBinary()), cancelPromise]);
				if (compressedFile) {
					file.setFile(compressedFile);
					file.setName(compressedFile.name);
					file.subscribeOnce(ui_uploader_core.FileEvent.UPLOAD_COMPLETE, () => {
						compressor.removeCompressedFile();
					});
				}
			}
		}
		setModelFileStatus(id, status) {
			return this.#store.dispatch('files/update', {
				id,
				fields: {
					status
				}
			});
		}
	}

	class UploaderWrapper extends main_core_events.EventEmitter {
		static EVENT_NAMESPACE = 'BX.Messenger.v2.Service.Uploading.UploaderWrapper';
		static CONTROLLER = 'disk.uf.integration.diskUploaderController';
		static Event = {
			onFileAddStart: 'onFileAddStart',
			onFileAdd: 'onFileAdd',
			onFileLoadComplete: 'onFileLoadComplete',
			onFileStateChange: 'onFileStateChange',
			onFileStatusChange: 'onFileStatusChange',
			onFileUploadStart: 'onFileUploadStart',
			onFileUploadProgress: 'onFileUploadProgress',
			onFileUploadComplete: 'onFileUploadComplete',
			onFileUploadError: 'onFileUploadError',
			onFileUploadCancel: 'onFileUploadCancel',
			onMaxFileCountExceeded: 'onMaxFileCountExceeded',
			onUploadComplete: 'onUploadComplete'
		};
		#id;
		#uploader;
		#customData = {};
		constructor({
			uploaderId,
			uploaderOptions,
			events,
			customData
		}) {
			super();
			this.setEventNamespace(UploaderWrapper.EVENT_NAMESPACE);
			this.subscribeFromOptions(events);
			this.#id = uploaderId;
			this.#uploader = new ui_uploader_core.Uploader({
				controller: UploaderWrapper.CONTROLLER,
				multiple: true,
				imageResizeWidth: 1280,
				imageResizeHeight: 1280,
				imageResizeMode: 'contain',
				imageResizeMimeType: 'image/jpeg',
				imageResizeMimeTypeMode: 'force',
				imagePreviewHeight: 720,
				imagePreviewWidth: 720,
				treatOversizeImageAsFile: true,
				ignoreUnknownImageTypes: true,
				maxFileSize: null,
				imageResizeFilter: file => {
					return !file.getCustomData('sendAsFile') && !file.isAnimated();
				},
				...uploaderOptions,
				events: {
					[ui_uploader_core.UploaderEvent.FILE_ADD_START]: event => {
						this.emit(UploaderWrapper.Event.onFileAddStart, {
							...event.getData(),
							uploaderId
						});
					},
					[ui_uploader_core.UploaderEvent.FILE_ADD]: event => {
						this.emit(UploaderWrapper.Event.onFileAdd, {
							...event.getData(),
							uploaderId
						});
					},
					[ui_uploader_core.UploaderEvent.FILE_LOAD_COMPLETE]: event => {
						this.emit(UploaderWrapper.Event.onFileLoadComplete, {
							...event.getData(),
							uploaderId
						});
					},
					[ui_uploader_core.UploaderEvent.FILE_STATE_CHANGE]: event => {
						this.emit(UploaderWrapper.Event.onFileStateChange, {
							...event.getData(),
							uploaderId
						});
					},
					[ui_uploader_core.UploaderEvent.FILE_STATUS_CHANGE]: event => {
						this.emit(UploaderWrapper.Event.onFileStatusChange, {
							...event.getData(),
							uploaderId
						});
					},
					[ui_uploader_core.UploaderEvent.FILE_UPLOAD_START]: event => {
						this.emit(UploaderWrapper.Event.onFileUploadStart, {
							...event.getData(),
							uploaderId
						});
					},
					[ui_uploader_core.UploaderEvent.FILE_UPLOAD_PROGRESS]: event => {
						this.emit(UploaderWrapper.Event.onFileUploadProgress, {
							...event.getData(),
							uploaderId
						});
					},
					[ui_uploader_core.UploaderEvent.FILE_UPLOAD_COMPLETE]: event => {
						this.emit(UploaderWrapper.Event.onFileUploadComplete, {
							...event.getData(),
							uploaderId
						});
					},
					[ui_uploader_core.UploaderEvent.ERROR]: event => {
						this.emit(UploaderWrapper.Event.onFileUploadError, {
							...event.getData(),
							uploaderId
						});
					},
					[ui_uploader_core.UploaderEvent.FILE_ERROR]: event => {
						this.emit(UploaderWrapper.Event.onFileUploadError, {
							...event.getData(),
							uploaderId
						});
					},
					[ui_uploader_core.UploaderEvent.MAX_FILE_COUNT_EXCEEDED]: event => {
						this.emit(UploaderWrapper.Event.onMaxFileCountExceeded, {
							...event.getData(),
							uploaderId
						});
					},
					[ui_uploader_core.UploaderEvent.UPLOAD_COMPLETE]: event => {
						this.emit(UploaderWrapper.Event.onUploadComplete, {
							...event.getData(),
							uploaderId
						});
					}
				},
				filters: [{
					type: ui_uploader_core.FilterType.PREPARATION,
					filter: UploaderVideoCompressionFilter
				}]
			});
			if (main_core.Type.isPlainObject(customData)) {
				this.#customData = customData;
			}
		}
		getId() {
			return this.#id;
		}
		setCustomData(key, value) {
			this.#customData[key] = value;
		}
		getCustomData(key) {
			return this.#customData[key];
		}
		addFiles(filesOptions) {
			const filesEntries = filesOptions.map(fileOption => {
				return Object.values(fileOption);
			});
			return this.#uploader.addFiles(filesEntries);
		}
		removeFile(fileId) {
			this.#uploader.getFile(fileId)?.remove?.();
		}
		getFiles() {
			return this.#uploader.getFiles();
		}
		getFilesIds() {
			return this.getFiles().map(file => {
				return file.getId();
			});
		}
		isAllPending() {
			return this.getFiles().every(currentFile => {
				return currentFile.getStatus() === ui_uploader_core.FileStatus.PENDING;
			});
		}
		isAllCompleted() {
			return this.getFiles().every(currentFile => {
				return currentFile.getStatus() === ui_uploader_core.FileStatus.COMPLETE;
			});
		}
		getServerFilesIds() {
			return this.getFiles().map(file => {
				return file.getServerFileId().toString().slice(1);
			});
		}
		getBinaryFiles() {
			return this.getFiles().map(file => {
				return file.getBinary();
			});
		}
		start() {
			this.#uploader.setAutoUpload(true);
			this.#uploader.start();
		}
		stop() {
			this.#uploader.stop();
		}
		destroy() {
			this.#uploader.destroy({
				removeFilesFromServer: false
			});
		}
	}

	function createDeferredPromise() {
		let resolve;
		let reject;
		const promise = new Promise((resolveRef, rejectRef) => {
			resolve = resolveRef;
			reject = rejectRef;
		});
		return {
			promise,
			resolve,
			reject
		};
	}

	const EVENT_NAMESPACE = 'BX.Messenger.v2.Service.UploadingService';
	class UploadingService extends main_core_events.EventEmitter {
		#store;
		#restClient;
		#isRequestingDiskFolderId = false;
		#diskFolderIdRequestPromise = {};
		#uploaderWrappers = new Map();
		#sendingService;
		static event = {
			uploadStart: 'uploadStart',
			uploadComplete: 'uploadComplete',
			uploadError: 'uploadError',
			uploadCancel: 'uploadCancel'
		};
		#queue = [];
		#isUploading = false;
		static instance = null;
		static getInstance() {
			if (!this.instance) {
				this.instance = new this();
			}
			return this.instance;
		}
		constructor() {
			super();
			this.setEventNamespace(EVENT_NAMESPACE);
			this.#store = im_v2_application_core.Core.getStore();
			this.#restClient = im_v2_application_core.Core.getRestClient();
			this.#sendingService = im_v2_provider_service_sending.SendingService.getInstance();
		}

		// eslint-disable-next-line max-lines-per-function
		async #createUploader(params) {
			const {
				dialogId,
				autoUpload = false,
				sendAsFile = false,
				maxParallelUploads,
				maxParallelLoads
			} = params;
			const uploaderId = im_v2_lib_utils.Utils.text.getUuidV4();
			const chatId = this.#getChatId(dialogId);
			const folderId = await this.checkDiskFolderId(dialogId);
			const tempMessageId = im_v2_lib_utils.Utils.text.getUuidV4();
			const loadAllComplete = createDeferredPromise();
			const uploadAllComplete = createDeferredPromise();
			const uploadPreviewPromises = [];
			const uploaderWrapper = new UploaderWrapper({
				uploaderId,
				uploaderOptions: {
					autoUpload,
					maxParallelLoads,
					maxParallelUploads,
					controllerOptions: {
						folderId,
						chat: {
							chatId,
							dialogId
						}
					}
				},
				customData: {
					chatId,
					dialogId,
					tempMessageId,
					sendAsFile
				},
				events: {
					[UploaderWrapper.Event.onFileAddStart]: event => {
						const {
							file
						} = event.getData();
						this.#addFileToStore(file, sendAsFile);
					},
					[UploaderWrapper.Event.onFileStatusChange]: event => {
						const {
							file
						} = event.getData();
						if (file.getStatus() === ui_uploader_core.FileStatus.PENDING) {
							if (this.#isMediaFile(file)) {
								this.#updateFilePreviewInStore(file, sendAsFile);
							} else {
								this.#updateFilePreviewInStore(file, sendAsFile);
								this.#updateFileTypeInStore(file, im_v2_const.FileType.file);
								file.setTreatImageAsFile(true);
								file.setCustomData('sendAsFile', true);
							}
							const target = event.getTarget();
							if (target.isAllPending()) {
								loadAllComplete.resolve();
							}
						}
					},
					[UploaderWrapper.Event.onFileUploadStart]: event => {
						const {
							file
						} = event.getData();
						this.#updateFileSizeInStore(file);
						this.emit(UploadingService.event.uploadStart);
					},
					[UploaderWrapper.Event.onFileUploadProgress]: event => {
						const {
							file
						} = event.getData();
						this.#updateFileProgress(file.getId(), file.getProgress(), im_v2_const.FileStatus.upload);
					},
					[UploaderWrapper.Event.onFileUploadComplete]: async event => {
						const {
							file
						} = event.getData();
						const serverFileId = file.getServerFileId().toString().slice(1);
						const temporaryFileId = file.getId();
						if (this.#isMediaFile(file)) {
							this.#setFileMapping({
								serverFileId,
								temporaryFileId
							});
						}
						this.#updateFileProgress(temporaryFileId, file.getProgress(), im_v2_const.FileStatus.wait);
						uploadPreviewPromises.push(this.#uploadPreview(file));
						this.emit(UploadingService.event.uploadComplete);
					},
					[UploaderWrapper.Event.onFileUploadError]: event => {
						const {
							error
						} = event.getData();
						const target = event.getTarget();
						this.#setMessageError(target.getCustomData('tempMessageId'));
						target.getFiles().forEach(uploaderFile => {
							this.#updateFileProgress(uploaderFile.getId(), 0, im_v2_const.FileStatus.error);
						});
						if (this.#isMaxFileSizeExceeded(error)) {
							im_v2_lib_notifier.Notifier.file.handleUploadError(error);
						}
						im_v2_lib_logger.Logger.error('UploadingService: upload error', error);
						this.emit(UploadingService.event.uploadError);
						this.#isUploading = false;
						this.#processQueue();
						this.stop(uploaderId);
					},
					[UploaderWrapper.Event.onFileUploadCancel]: event => {
						const {
							tempFileId
						} = event.getData();
						this.#cancelUpload(tempMessageId, tempFileId);
						this.emit(UploadingService.event.uploadCancel);
					},
					[UploaderWrapper.Event.onUploadComplete]: async event => {
						this.#isUploading = false;
						this.#processQueue();
						const target = event.getTarget();
						if (target.isAllCompleted()) {
							await Promise.all(uploadPreviewPromises);
							uploadAllComplete.resolve();
							await this.commitMessage(uploaderId);
							this.#destroyUploader(uploaderId);
						}
					}
				}
			});
			return {
				uploaderWrapper,
				loadAllComplete: loadAllComplete.promise,
				uploadAllComplete: uploadAllComplete.promise
			};
		}
		prepareFilesOptions(files, options, sendAsFile) {
			return files.map(file => {
				const id = im_v2_lib_utils.Utils.text.getUuidV4();
				if (main_core.Type.isFunction(file.getBinary)) {
					return {
						file: file.getBinary(),
						options: {
							...file.toJSON(),
							clientPreview: file.getClientPreview(),
							id,
							customData: {
								sendAsFile,
								...options
							},
							treatImageAsFile: sendAsFile
						}
					};
				}
				return {
					file,
					options: {
						id,
						customData: {
							sendAsFile,
							...options
						},
						downloadUrl: URL.createObjectURL(file)
					}
				};
			});
		}
		async addFiles(params) {
			const {
				files,
				dialogId,
				autoUpload,
				sendAsFile = false,
				maxParallelUploads,
				maxParallelLoads
			} = params;
			const {
				uploaderWrapper,
				loadAllComplete,
				uploadAllComplete
			} = await this.#createUploader({
				dialogId,
				autoUpload,
				sendAsFile,
				maxParallelUploads,
				maxParallelLoads
			});
			const uploaderId = uploaderWrapper.getId();
			const chatId = this.#getChatId(dialogId);
			this.#uploaderWrappers.set(uploaderId, uploaderWrapper);
			const filesOptions = this.prepareFilesOptions(files, {
				chatId,
				dialogId
			}, sendAsFile);
			const uploaderFiles = uploaderWrapper.addFiles(filesOptions);
			return {
				uploaderFiles,
				uploaderId,
				loadAllComplete,
				uploadAllComplete
			};
		}
		getFiles(uploaderId) {
			return this.#uploaderWrappers.get(uploaderId).getFiles();
		}
		#addToQueue(uploaderId) {
			this.#queue.push(uploaderId);
			this.#processQueue();
		}
		#processQueue() {
			if (this.#isUploading || this.#queue.length === 0) {
				return;
			}
			this.#isUploading = true;
			const uploaderId = this.#queue.shift();
			this.#uploaderWrappers.get(uploaderId).start();
		}
		start(uploaderId) {
			this.getFiles(uploaderId).forEach(file => {
				this.#updateFileProgress(file.getId(), 0, im_v2_const.FileStatus.progress);
			});
			this.#addToQueue(uploaderId);
		}
		stop(uploaderId) {
			this.#uploaderWrappers.get(uploaderId).stop();
		}
		uploadFileFromDisk(files, dialogId, replyId) {
			Object.values(files).forEach(file => {
				const messageWithFile = this.#prepareFileFromDisk(file, dialogId);
				this.#addFileFromDiskToModel(messageWithFile).then(() => {
					const message = {
						tempMessageId: messageWithFile.tempMessageId,
						fileIds: [messageWithFile.tempFileId],
						dialogId: messageWithFile.dialogId,
						replyId
					};
					return this.#sendingService.sendMessageWithFiles(message);
				}).then(() => {
					this.commitFile({
						chatId: messageWithFile.chatId,
						temporaryFileId: messageWithFile.tempFileId,
						tempMessageId: messageWithFile.tempMessageId,
						realFileId: messageWithFile.file.id.slice(1),
						fromDisk: true,
						replyId
					});
				}).catch(error => {
					console.error('SendingService: sendFilesFromDisk error:', error);
				});
			});
		}
		#addFileFromDiskToModel(messageWithFile) {
			return this.#store.dispatch('files/add', {
				id: messageWithFile.tempFileId,
				chatId: messageWithFile.chatId,
				authorId: im_v2_application_core.Core.getUserId(),
				name: messageWithFile.file.name,
				type: im_v2_lib_utils.Utils.file.getFileTypeByExtension(messageWithFile.file.ext),
				extension: messageWithFile.file.ext,
				size: messageWithFile.file.sizeInt,
				status: im_v2_const.FileStatus.wait,
				progress: 0,
				authorName: this.#getCurrentUser().name
			});
		}
		#isMediaFile(file) {
			return ui_uploader_core.isResizableImage(file.getBinary()) || file.isVideo() && main_core.Type.isStringFilled(file.getPreviewUrl());
		}
		#setFileMapping(options) {
			void this.#store.dispatch('files/setTemporaryFileMapping', options);
		}
		checkDiskFolderId(dialogId) {
			if (this.#getDiskFolderId(dialogId) > 0) {
				return Promise.resolve(this.#getDiskFolderId(dialogId));
			}
			if (this.#isRequestingDiskFolderId) {
				return this.#diskFolderIdRequestPromise[dialogId];
			}
			this.#diskFolderIdRequestPromise[dialogId] = this.#requestDiskFolderId(dialogId);
			return this.#diskFolderIdRequestPromise[dialogId];
		}
		#requestDiskFolderId(dialogId) {
			return new Promise((resolve, reject) => {
				this.#isRequestingDiskFolderId = true;
				const chatId = this.#getChatId(dialogId);
				this.#restClient.callMethod(im_v2_const.RestMethod.imDiskFolderGet, {
					chat_id: chatId
				}).then(response => {
					const {
						ID: diskFolderId
					} = response.data();
					this.#isRequestingDiskFolderId = false;
					void this.#store.dispatch('chats/update', {
						dialogId,
						fields: {
							diskFolderId
						}
					});
					resolve(diskFolderId);
				}).catch(error => {
					this.#isRequestingDiskFolderId = false;
					reject(error);
				});
			});
		}
		#appendReplyId(payload, replyId) {
			if (replyId > 0) {
				payload.reply_id = replyId;
			}
			return payload;
		}
		commitFile(params) {
			const {
				temporaryFileId,
				tempMessageId,
				chatId,
				realFileId,
				fromDisk,
				messageText = '',
				sendAsFile = false,
				replyId
			} = params;
			const fileIdParams = {};
			if (fromDisk) {
				fileIdParams.disk_id = realFileId;
			} else {
				fileIdParams.upload_id = realFileId.toString().slice(1);
			}
			const payload = {
				chat_id: chatId,
				message: messageText,
				template_id: tempMessageId,
				file_template_id: temporaryFileId,
				as_file: sendAsFile ? 'Y' : 'N',
				...fileIdParams
			};
			this.#restClient.callMethod(im_v2_const.RestMethod.imDiskFileCommit, this.#appendReplyId(payload, replyId)).catch(error => {
				this.#setMessageError(tempMessageId);
				this.#updateFileProgress(temporaryFileId, 0, im_v2_const.FileStatus.error);
				console.error('commitFile error', error);
			});
		}
		commitMessage(uploaderId) {
			const uploader = this.#uploaderWrappers.get(uploaderId);
			const chatId = uploader.getCustomData('chatId');
			const sendAsFile = uploader.getCustomData('sendAsFile');
			const text = uploader.getCustomData('text');
			const tempMessageId = uploader.getCustomData('tempMessageId');
			const replyId = uploader.getCustomData('replyId');
			const fileIds = uploader.getServerFilesIds();
			const payload = {
				chat_id: chatId,
				message: text,
				template_id: tempMessageId,
				as_file: sendAsFile ? 'Y' : 'N',
				upload_id: fileIds
			};
			return this.#restClient.callMethod(im_v2_const.RestMethod.imDiskFileCommit, this.#appendReplyId(payload, replyId));
		}
		async #uploadPreview(file) {
			const needPreview = this.#getFileType(file) === im_v2_const.FileType.video || file.isAnimated();
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
		#updateFileProgress(id, progress, status) {
			void this.#store.dispatch('files/update', {
				id,
				fields: {
					progress: progress === 100 ? 99 : progress,
					status
				}
			});
		}
		#cancelUpload(tempMessageId, tempFileId) {
			const message = this.#store.getters['messages/getById'](tempMessageId);
			if (message) {
				void this.#store.dispatch('messages/delete', {
					id: tempMessageId
				});
				void this.#store.dispatch('files/delete', {
					id: tempFileId
				});
				const chat = this.#store.getters['chats/getByChatId'](message.chatId);
				const lastMessageId = this.#store.getters['messages/findLastChatMessageId'](message.chatId);
				if (main_core.Type.isString(lastMessageId) || main_core.Type.isNumber(lastMessageId)) {
					void this.#store.dispatch('recent/update', {
						dialogId: chat.dialogId,
						fields: {
							messageId: lastMessageId
						}
					});
				} else {
					void this.#store.dispatch('recent/hide', {
						dialogId: chat.dialogId
					});
				}
			}
		}
		#getFileType(file) {
			if (ui_uploader_core.isResizableImage(file.getBinary())) {
				return im_v2_const.FileType.image;
			}
			if (file.isVideo()) {
				return im_v2_const.FileType.video;
			}
			if (file.getType().startsWith('audio')) {
				return im_v2_const.FileType.audio;
			}
			return im_v2_const.FileType.file;
		}
		#addFileToStore(file, sendAsFile) {
			const fileType = this.#getFileType(file);
			const currentUser = this.#getCurrentUser();
			const isFile = ![im_v2_const.FileType.image, im_v2_const.FileType.video].includes(fileType);
			void this.#store.dispatch('files/add', {
				id: file.getId(),
				name: file.getName(),
				size: file.getSize(),
				type: fileType,
				extension: file.getExtension(),
				chatId: file.getCustomData('chatId'),
				authorId: currentUser.id,
				authorName: currentUser.name,
				status: file.isFailed() ? im_v2_const.FileStatus.error : im_v2_const.FileStatus.wait,
				progress: 0,
				urlDownload: file.getDownloadUrl(),
				...(() => {
					if (isFile || sendAsFile) {
						return {
							image: false
						};
					}
					return {};
				})()
			});
		}
		#updateFilePreviewInStore(file, sendAsFile) {
			void this.#store.dispatch('files/update', {
				id: file.getId(),
				fields: {
					urlPreview: (() => {
						if (file.isImage()) {
							return file.getPreviewUrl() || file.getDownloadUrl();
						}
						return file.getPreviewUrl();
					})(),
					...(() => {
						if (sendAsFile) {
							return {
								image: false
							};
						}
						return {
							image: {
								width: file.getPreviewWidth(),
								height: file.getPreviewHeight()
							}
						};
					})()
				}
			});
		}
		#updateFileTypeInStore(file, type) {
			void this.#store.dispatch('files/update', {
				id: file.getId(),
				fields: {
					type
				}
			});
		}
		#updateFileSizeInStore(file) {
			void this.#store.dispatch('files/update', {
				id: file.getId(),
				fields: {
					size: file.getSize()
				}
			});
		}
		#getDiskFolderId(dialogId) {
			return this.#getDialog(dialogId).diskFolderId;
		}
		#getDialog(dialogId) {
			return this.#store.getters['chats/get'](dialogId);
		}
		#getCurrentUser() {
			const userId = im_v2_application_core.Core.getUserId();
			return this.#store.getters['users/get'](userId);
		}
		#getChatId(dialogId) {
			return this.#getDialog(dialogId)?.chatId;
		}
		#setMessagesText(uploaderId, text) {
			this.#uploaderWrappers.get(uploaderId).setCustomData('text', text);
		}
		#setMessagesReplyId(uploaderId, replyId) {
			if (replyId > 0) {
				this.#uploaderWrappers.get(uploaderId).setCustomData('replyId', replyId);
			}
		}
		sendMessageWithFiles(params) {
			const {
				uploaderId,
				text,
				replyId
			} = params;
			this.#setMessagesText(uploaderId, text);
			this.#setMessagesReplyId(uploaderId, replyId);
			this.#tryToSendMessage(uploaderId);
		}
		#createMessageFromFiles(uploaderId) {
			const fileIds = [];
			const files = this.getFiles(uploaderId);
			files.forEach(file => {
				if (!file.getError()) {
					fileIds.push(file.getId());
				}
			});
			const text = this.#uploaderWrappers.get(uploaderId).getCustomData('text');
			const dialogId = this.#uploaderWrappers.get(uploaderId).getCustomData('dialogId');
			const tempMessageId = this.#uploaderWrappers.get(uploaderId).getCustomData('tempMessageId');
			const replyId = this.#uploaderWrappers.get(uploaderId).getCustomData('replyId');
			return {
				fileIds,
				tempMessageId,
				dialogId,
				text,
				replyId
			};
		}
		#tryToSendMessage(uploaderId) {
			const message = this.#createMessageFromFiles(uploaderId);
			void this.#sendingService.sendMessageWithFiles(message);
			this.start(uploaderId);
		}
		#prepareFileFromDisk(file, dialogId) {
			const tempMessageId = im_v2_lib_utils.Utils.text.getUuidV4();
			const realFileId = file.id.slice(1); // 'n123' => '123'
			const tempFileId = `${tempMessageId}|${realFileId}`;
			return {
				tempMessageId,
				tempFileId,
				dialogId,
				file,
				chatId: this.#getDialog(dialogId).chatId
			};
		}
		#isMaxFileSizeExceeded(error) {
			return error.getCode() === 'MAX_FILE_SIZE_EXCEEDED';
		}
		#setMessageError(tempMessageId) {
			void this.#store.dispatch('messages/update', {
				id: tempMessageId,
				fields: {
					error: true
				}
			});
		}
		getUploaderIdByFileId(fileId) {
			const uploaderIds = [...this.#uploaderWrappers.keys()];
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
			const files = this.#uploaderWrappers.get(uploaderId).getFiles().filter(file => {
				return filesIds.includes(file.getId());
			});
			files.forEach(file => {
				file.remove();
				file.abort();
			});
			if (restartUploading) {
				const [firstFile] = this.getFiles(uploaderId);
				if (firstFile) {
					firstFile.upload();
				} else {
					this.#isUploading = false;
					this.#processQueue();
				}
			}
		}
		#destroyUploader(uploaderId) {
			this.#uploaderWrappers.get(uploaderId).destroy();
			this.#uploaderWrappers.delete(uploaderId);
		}
		async retry(uploaderId) {
			const uploaderWrapper = this.#uploaderWrappers.get(uploaderId);
			const dialogId = uploaderWrapper.getCustomData('dialogId');
			const text = uploaderWrapper.getCustomData('text');
			const tempMessageId = uploaderWrapper.getCustomData('tempMessageId');
			const sendAsFile = uploaderWrapper.getCustomData('sendAsFile');
			const replyId = uploaderWrapper.getCustomData('replyId');
			const binaryFiles = uploaderWrapper.getBinaryFiles();
			const {
				uploaderId: newUploaderId,
				loadAllComplete
			} = await this.addFiles({
				dialogId,
				files: binaryFiles,
				sendAsFile
			});
			void this.#store.dispatch('messages/deleteLoadingMessageByMessageId', {
				messageId: tempMessageId
			});
			await loadAllComplete;
			this.sendMessageWithFiles({
				uploaderId: newUploaderId,
				text,
				replyId
			});
			this.#destroyUploader(uploaderId);
		}
	}

	const MAX_FILES_COUNT_IN_ONE_MESSAGE = 10;
	const MAX_FILES_COUNT = 100;
	const MAX_PARALLEL_LOADS = 10;
	const MAX_PARALLEL_UPLOADS = 3;
	class MultiUploadingService {
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
		#getUploadingService() {
			return UploadingService.getInstance();
		}
		#createUploadingId() {
			return im_v2_lib_utils.Utils.text.getUuidV4();
		}
		async #addFiles(params) {
			return this.#getUploadingService().addFiles(params);
		}
		async upload({
			files,
			dialogId,
			autoUpload,
			sendAsFile
		}) {
			const chunks = MultiUploadingService.makeChunks({
				files
			});
			const addFilesResults = await Promise.all(chunks.map(chunk => {
				return this.#addFiles({
					files: chunk,
					maxParallelLoads: MultiUploadingService.getMaxParallelLoads(chunks),
					maxParallelUploads: MAX_PARALLEL_UPLOADS,
					dialogId,
					autoUpload,
					sendAsFile
				});
			}));
			const uploadingId = this.#createUploadingId();
			const uploaderIds = [];
			const loadCompletePromises = [];
			const uploadCompletePromises = [];
			addFilesResults.forEach(({
				uploaderId,
				uploaderFiles,
				loadAllComplete,
				uploadAllComplete
			}) => {
				if (main_core.Type.isArrayFilled(uploaderFiles)) {
					uploaderIds.push(uploaderId);
					loadCompletePromises.push(loadAllComplete);
					uploadCompletePromises.push(uploadAllComplete);
				}
			});
			const loadAllComplete = Promise.all(loadCompletePromises);
			const uploadAllComplete = Promise.all(uploadCompletePromises);
			const sourceFilesCount = files.length;
			return {
				uploadingId,
				uploaderIds,
				sourceFilesCount,
				loadAllComplete,
				uploadAllComplete
			};
		}
	}

	exports.MultiUploadingService = MultiUploadingService;
	exports.UploadingService = UploadingService;

})(this.BX.Messenger.v2.Service = this.BX.Messenger.v2.Service || {}, BX, BX.Event, BX.UI.Uploader, BX.Messenger.v2.Application, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Service, BX.Messenger.v2.Lib);
//# sourceMappingURL=uploading.bundle.js.map
