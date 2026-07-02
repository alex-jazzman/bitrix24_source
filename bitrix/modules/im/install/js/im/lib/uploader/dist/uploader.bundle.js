/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
(function (exports, main_core_events, main_core_minimal) {
	'use strict';

	class FileSender {
		token = null;
		nextDataChunkToSend = null;
		readOffset = 0;
		constructor(task, options = {}) {
			this.diskFolderId = task.diskFolderId;
			this.listener = task.listener;
			this.status = task.status;
			this.taskId = task.taskId;
			this.fileData = task.fileData;
			this.fileName = task.fileName || this.fileData.name;
			this.generateUniqueName = task.generateUniqueName;
			this.chunkSizeInBytes = task.chunkSize;
			this.previewBlob = task.previewBlob || null;
			this.requestToDelete = false;
			this.listener('onStartUpload', {
				id: this.taskId,
				file: this.fileData,
				previewData: this.previewBlob
			});
			this.host = options.host || null;
			this.actionUploadChunk = options.actionUploadChunk || 'disk.api.content.upload';
			this.actionCommitFile = options.actionCommitFile || 'disk.api.file.createByContent';
			this.actionRollbackUpload = options.actionRollbackUpload || 'disk.api.content.rollbackUpload';
			this.customHeaders = options.customHeaders || null;
		}
		uploadContent() {
			if (this.status === Uploader.STATUSES.CANCELLED) {
				return;
			}
			this.status = Uploader.STATUSES.PROGRESS;
			this.readNext();
			const url = `${this.host ? this.host : ""}
			/bitrix/services/main/ajax.php?action=${this.actionUploadChunk}
			&filename=${this.fileName}
			${this.token ? "&token=" + this.token : ""}`;
			const contentRangeHeader = "bytes " + this.readOffset + "-" + (this.readOffset + this.chunkSizeInBytes - 1) + "/" + this.fileData.size;
			this.calculateProgress();
			const headers = {
				"Content-Type": this.fileData.type,
				"Content-Range": contentRangeHeader
			};
			if (!this.customHeaders) {
				headers['X-Bitrix-Csrf-Token'] = BX.bitrix_sessid();
			} else
				//if (this.customHeaders)
				{
					for (const customHeader in this.customHeaders) {
						if (this.customHeaders.hasOwnProperty(customHeader)) {
							headers[customHeader] = this.customHeaders[customHeader];
						}
					}
				}
			fetch(url, {
				method: 'POST',
				headers: headers,
				credentials: "include",
				body: this.nextDataChunkToSend
			}).then(response => response.json()).then(result => {
				if (result.errors.length > 0) {
					this.status = Uploader.STATUSES.FAILED;
					this.listener('onUploadFileError', {
						id: this.taskId,
						result: result
					});
					console.error(result.errors[0].message);
				} else if (result.data.token) {
					this.token = result.data.token;
					this.readOffset = this.readOffset + this.chunkSizeInBytes;
					if (!this.isEndOfFile()) {
						this.uploadContent();
					} else {
						this.createFileFromUploadedChunks();
					}
				}
			}).catch(err => {
				this.status = Uploader.STATUSES.FAILED;
				this.listener('onUploadFileError', {
					id: this.taskId,
					result: err
				});
			});
		}
		deleteContent() {
			this.status = Uploader.STATUSES.CANCELLED;
			this.requestToDelete = true;
			if (!this.token) {
				console.error('Empty token.');
				return;
			}
			const url = `${this.host ? this.host : ""}/bitrix/services/main/ajax.php?
		action=${this.actionRollbackUpload}&token=${this.token}`;
			const headers = {};
			if (!this.customHeaders) {
				headers['X-Bitrix-Csrf-Token'] = BX.bitrix_sessid();
			} else
				//if (this.customHeaders)
				{
					for (const customHeader in this.customHeaders) {
						if (this.customHeaders.hasOwnProperty(customHeader)) {
							headers[customHeader] = this.customHeaders[customHeader];
						}
					}
				}
			fetch(url, {
				method: 'POST',
				credentials: "include",
				headers: headers
			}).then(response => response.json()).then(result => console.log(result)).catch(err => console.error(err));
		}
		createFileFromUploadedChunks() {
			if (!this.token) {
				console.error('Empty token.');
				return;
			}
			if (this.requestToDelete) {
				return;
			}
			const url = `${this.host ? this.host : ""}/bitrix/services/main/ajax.php?action=${this.actionCommitFile}&filename=${this.fileName}` + "&folderId=" + this.diskFolderId + "&contentId=" + this.token + (this.generateUniqueName ? "&generateUniqueName=true" : "");
			const headers = {
				"X-Upload-Content-Type": this.fileData.type
			};
			if (!this.customHeaders) {
				headers['X-Bitrix-Csrf-Token'] = BX.bitrix_sessid();
			} else
				//if (this.customHeaders)
				{
					for (const customHeader in this.customHeaders) {
						if (this.customHeaders.hasOwnProperty(customHeader)) {
							headers[customHeader] = this.customHeaders[customHeader];
						}
					}
				}
			const formData = new FormData();
			if (this.previewBlob) {
				formData.append("previewFile", this.previewBlob, "preview_" + this.fileName + ".jpg");
			}
			fetch(url, {
				method: 'POST',
				headers: headers,
				credentials: "include",
				body: formData
			}).then(response => response.json()).then(result => {
				this.uploadResult = result;
				if (result.errors.length > 0) {
					this.status = Uploader.STATUSES.FAILED;
					this.listener('onCreateFileError', {
						id: this.taskId,
						result: result
					});
					console.error(result.errors[0].message);
				} else {
					this.calculateProgress();
					this.status = Uploader.STATUSES.DONE;
					this.listener('onComplete', {
						id: this.taskId,
						result: result
					});
				}
			}).catch(err => {
				this.status = Uploader.STATUSES.FAILED;
				this.listener('onCreateFileError', {
					id: this.taskId,
					result: err
				});
			});
		}
		calculateProgress() {
			this.progress = Math.round(this.readOffset * 100 / this.fileData.size);
			this.listener('onProgress', {
				id: this.taskId,
				progress: this.progress,
				readOffset: this.readOffset,
				fileSize: this.fileData.size
			});
		}
		readNext() {
			if (this.readOffset + this.chunkSizeInBytes > this.fileData.size) {
				this.chunkSizeInBytes = this.fileData.size - this.readOffset;
			}
			this.nextDataChunkToSend = this.fileData.slice(this.readOffset, this.readOffset + this.chunkSizeInBytes);
		}
		isEndOfFile() {
			return this.readOffset >= this.fileData.size;
		}
	}

	class Uploader extends main_core_events.EventEmitter {
		queue = [];
		isCloud = BX.message.isCloud;
		phpUploadMaxFilesize = BX.message.phpUploadMaxFilesize;
		phpPostMaxSize = BX.message.phpPostMaxSize;
		static STATUSES = {
			PENDING: 0,
			PROGRESS: 1,
			DONE: 2,
			CANCELLED: 3,
			FAILED: 4
		};
		static BOX_MIN_CHUNK_SIZE = 1024 * 1024; //1Mb
		static CLOUD_MIN_CHUNK_SIZE = 1024 * 1024 * 5; //5Mb
		static CLOUD_MAX_CHUNK_SIZE = 1024 * 1024 * 100; //100Mb

		constructor(options) {
			super();
			this.setEventNamespace('BX.Messenger.Lib.Uploader');
			this.generatePreview = options.generatePreview || false;
			if (options) {
				this.inputNode = options.inputNode || null;
				this.dropNode = options.dropNode || null;
				this.fileMaxSize = options.fileMaxSize || null;
				this.fileMaxWidth = options.fileMaxWidth || null;
				this.fileMaxHeight = options.fileMaxHeight || null;
				if (options.sender) {
					this.senderOptions = {
						host: options.sender.host,
						actionUploadChunk: options.sender.actionUploadChunk,
						actionCommitFile: options.sender.actionCommitFile,
						actionRollbackUpload: options.sender.actionRollbackUpload,
						customHeaders: options.sender.customHeaders || null
					};
				}
				this.assignInput();
				this.assignDrop();
			}
		}
		setInputNode(node) {
			if (node instanceof HTMLInputElement || Array.isArray(node)) {
				this.inputNode = node;
				this.assignInput();
			}
		}
		addFilesFromEvent(event) {
			Array.from(event.target.files).forEach(file => {
				this.emitSelectedFile(file);
			});
		}
		getPreview(file) {
			return new Promise((resolve, reject) => {
				if (!this.generatePreview) {
					resolve();
				}
				if (file instanceof File) {
					if (file.type.startsWith('video')) {
						Uploader.getVideoPreviewBlob(file, 10).then(blob => this.getImageDimensions(blob)).then(result => resolve(result)).catch(reason => reject(reason));
					} else if (file.type.startsWith('image')) {
						const blob = new Blob([file], {
							type: file.type
						});
						this.getImageDimensions(blob).then(result => resolve(result));
					} else {
						resolve();
					}
				} else {
					reject("Parameter 'file' is not instance of 'File'");
				}
			});
		}
		addTask(task) {
			if (!this.isModernBrowser()) {
				console.warn('Unsupported browser!');
				return;
			}
			if (!this.checkTaskParams(task)) {
				return;
			}
			task.chunkSize = this.calculateChunkSize(task.chunkSize);
			task.listener = (event, data) => this.onUploadEvent(event, data);
			task.status = Uploader.STATUSES.PENDING;
			const fileSender = new FileSender(task, this.senderOptions);
			this.queue.push(fileSender);
			this.checkUploadQueue();
		}
		deleteTask(taskId) {
			if (!taskId) {
				return;
			}
			this.queue = this.queue.filter(queueItem => {
				if (queueItem.taskId === taskId) {
					queueItem.deleteContent();
					return false;
				}
				return true;
			});
		}
		getTask(taskId) {
			const task = this.queue.find(queueItem => queueItem.taskId === taskId);
			if (task) {
				return {
					id: task.id,
					diskFolderId: task.diskFolderId,
					fileData: task.fileData,
					fileName: task.fileName,
					progress: task.progress,
					readOffset: task.readOffset,
					status: task.status,
					token: task.token,
					uploadResult: task.uploadResult
				};
			}
			return null;
		}
		static getVideoPreviewBlob(file, seekTime = 0) {
			return new Promise((resolve, reject) => {
				const videoPlayer = document.createElement('video');
				videoPlayer.setAttribute('src', URL.createObjectURL(file));
				videoPlayer.load();
				videoPlayer.addEventListener('error', error => {
					reject("Error while loading video file", error);
				});
				videoPlayer.addEventListener('loadedmetadata', () => {
					if (videoPlayer.duration < seekTime) {
						seekTime = 0;
						// reject("Too big seekTime for the video.");
						// return;
					}
					videoPlayer.currentTime = seekTime;
					videoPlayer.addEventListener('seeked', () => {
						const canvas = document.createElement("canvas");
						canvas.width = videoPlayer.videoWidth;
						canvas.height = videoPlayer.videoHeight;
						const context = canvas.getContext("2d");
						context.drawImage(videoPlayer, 0, 0, canvas.width, canvas.height);
						context.canvas.toBlob(blob => resolve(blob), "image/jpeg", 1);
					});
				});
			});
		}
		checkUploadQueue() {
			if (this.queue.length > 0) {
				const inProgressTasks = this.queue.filter(queueTask => queueTask.status === Uploader.STATUSES.PENDING);
				if (inProgressTasks.length > 0) {
					inProgressTasks[0].uploadContent();
				}
			}
		}
		onUploadEvent(event, data) {
			this.emit(event, data);
			this.checkUploadQueue();
		}
		checkTaskParams(task) {
			if (!task.taskId) {
				console.error('Empty Task ID.');
				return false;
			}
			if (!task.fileData) {
				console.error('Empty file data.');
				return false;
			}
			if (!task.diskFolderId) {
				console.error('Empty disk folder ID.');
				return false;
			}
			if (this.fileMaxSize && this.fileMaxSize < task.fileData.size) {
				const data = {
					maxFileSizeLimit: this.fileMaxSize,
					file: task.fileData
				};
				this.emit('onFileMaxSizeExceeded', data);
				return false;
			}
			return true;
		}
		calculateChunkSize(taskChunkSize) {
			if (main_core_minimal.Type.isUndefined(this.isCloud))
				// widget case
				{
					return taskChunkSize;
				}
			let chunk = 0;
			if (taskChunkSize) {
				chunk = taskChunkSize;
			}
			if (this.isCloud === 'Y') {
				chunk = chunk < Uploader.CLOUD_MIN_CHUNK_SIZE ? Uploader.CLOUD_MIN_CHUNK_SIZE : chunk;
				chunk = chunk > Uploader.CLOUD_MAX_CHUNK_SIZE ? Uploader.CLOUD_MAX_CHUNK_SIZE : chunk;
			} else
				//if(this.isCloud === 'N')
				{
					const maxBoxChunkSize = Math.min(this.phpPostMaxSize, this.phpUploadMaxFilesize);
					chunk = chunk < Uploader.BOX_MIN_CHUNK_SIZE ? Uploader.BOX_MIN_CHUNK_SIZE : chunk;
					chunk = chunk > maxBoxChunkSize ? maxBoxChunkSize : chunk;
				}
			return chunk;
		}
		isModernBrowser() {
			return typeof fetch !== 'undefined';
		}
		assignInput() {
			if (this.inputNode instanceof HTMLInputElement) {
				this.setOnChangeEventListener(this.inputNode);
			} else if (Array.isArray(this.inputNode)) {
				this.inputNode.forEach(node => {
					if (node instanceof HTMLInputElement) {
						this.setOnChangeEventListener(node);
					}
				});
			}
		}
		setOnChangeEventListener(inputNode) {
			inputNode.addEventListener('change', event => {
				this.addFilesFromEvent(event);
			}, false);
		}
		assignDrop() {
			if (this.dropNode instanceof HTMLElement) {
				this.setDropEventListener(this.dropNode);
			} else if (Array.isArray(this.dropNode)) {
				this.dropNode.forEach(node => {
					if (node instanceof HTMLElement) {
						this.setDropEventListener(node);
					}
				});
			}
		}
		setDropEventListener(dropNode) {
			dropNode.addEventListener('drop', event => {
				event.preventDefault();
				event.stopPropagation();
				Array.from(event.dataTransfer.files).forEach(file => {
					this.emitSelectedFile(file);
				});
			}, false);
		}
		emitSelectedFile(file) {
			const data = {
				file: file
			};
			this.getPreview(file).then(previewData => {
				if (previewData) {
					data['previewData'] = previewData.blob;
					data['previewDataWidth'] = previewData.width;
					data['previewDataHeight'] = previewData.height;
					if (this.fileMaxWidth || this.fileMaxHeight) {
						const isMaxWidthExceeded = this.fileMaxWidth === null ? false : this.fileMaxWidth < data['previewDataWidth'];
						const isMaxHeightExceeded = this.fileMaxHeight === null ? false : this.fileMaxHeight < data['previewDataHeight'];
						if (isMaxWidthExceeded || isMaxHeightExceeded) {
							const eventData = {
								maxWidth: this.fileMaxWidth,
								maxHeight: this.fileMaxHeight,
								fileWidth: data['previewDataWidth'],
								fileHeight: data['previewDataHeight']
							};
							this.emit('onFileMaxResolutionExceeded', eventData);
							return false;
						}
					}
				}
				this.emit('onSelectFile', data);
			}).catch(err => {
				console.warn(`Couldn't get preview for file ${file.name}. Error: ${err}`);
				this.emit('onSelectFile', data);
			});
		}
		getImageDimensions(fileBlob) {
			return new Promise((resolved, rejected) => {
				if (!fileBlob) {
					rejected('getImageDimensions: fileBlob can\'t be empty');
				}
				const img = new Image();
				img.onload = () => {
					resolved({
						blob: fileBlob,
						width: img.width,
						height: img.height
					});
				};
				img.onerror = () => {
					rejected();
				};
				img.src = URL.createObjectURL(fileBlob);
			});
		}
	}

	exports.Uploader = Uploader;

})(this.BX.Messenger.Lib = this.BX.Messenger.Lib || {}, BX.Event, BX);
//# sourceMappingURL=uploader.bundle.js.map
