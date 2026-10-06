/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
(function (exports, main_core, main_core_events) {
	'use strict';

	const FileStatus = {
		INIT: 'init',
		ADDED: 'added',
		LOADING: 'loading',
		PENDING: 'pending',
		PREPARING: 'preparing',
		UPLOADING: 'uploading',
		COMPLETE: 'complete',
		LOAD_FAILED: 'load-failed',
		UPLOAD_FAILED: 'upload-failed'
	};

	const FileOrigin = {
		CLIENT: 'client',
		SERVER: 'server'
	};

	const FileEvent = {
		ADD: 'onAdd',
		BEFORE_UPLOAD: 'onBeforeUpload',
		UPLOAD_START: 'onUploadStart',
		UPLOAD_ERROR: 'onUploadError',
		UPLOAD_PROGRESS: 'onUploadProgress',
		UPLOAD_COMPLETE: 'onUploadComplete',
		UPLOAD_CONTROLLER_INIT: 'onUploadControllerInit',
		LOAD_START: 'onLoadStart',
		LOAD_PROGRESS: 'onLoadProgress',
		LOAD_COMPLETE: 'onLoadComplete',
		LOAD_ERROR: 'onLoadError',
		LOAD_CONTROLLER_INIT: 'onLoadControllerInit',
		REMOVE_ERROR: 'onRemoveError',
		REMOVE_COMPLETE: 'onRemoveComplete',
		REMOVE_CONTROLLER_INIT: 'onRemoveControllerInit',
		STATE_CHANGE: 'onStateChange',
		STATUS_CHANGE: 'onStatusChange',
		VALIDATE_FILE_ASYNC: 'onValidateFileAsync',
		PREPARE_FILE_ASYNC: 'onPrepareFileAsync'
	};

	const getFileExtension = filename => {
		const position = main_core.Type.isStringFilled(filename) ? filename.lastIndexOf('.') : -1;
		return position > 0 ? filename.slice(Math.max(0, position + 1)) : '';
	};

	let videoExtensions = null;
	const isSupportedVideo = (file, mimeType = null) => {
		if (videoExtensions === null) {
			videoExtensions = Uploader.getVideoExtensions();
		}
		const fileName = main_core.Type.isFile(file) ? file.name : file;
		const type = main_core.Type.isFile(file) ? file.type : mimeType;
		const extension = getFileExtension(fileName).toLowerCase();
		return videoExtensions.includes(extension) && (type === null || /^video\/[\d.a-z-]+$/i.test(type));
	};

	class UploaderError extends main_core.BaseError {
		static Origin = {
			SERVER: 'server',
			CLIENT: 'client'
		};
		static Type = {
			USER: 'user',
			SYSTEM: 'system',
			UNKNOWN: 'unknown'
		};
		description = '';
		origin = UploaderError.Origin.CLIENT;
		type = UploaderError.Type.USER;
		constructor(code, ...args) {
			let message = main_core.Type.isString(args[0]) ? args[0] : null;
			let description = main_core.Type.isString(args[1]) ? args[1] : null;
			const customData = main_core.Type.isPlainObject(args[args.length - 1]) ? args[args.length - 1] : {};
			const replacements = {};
			Object.keys(customData).forEach(key => {
				replacements[`#${key}#`] = customData[key];
			});
			if (!main_core.Type.isString(message) && main_core.Loc.hasMessage(`UPLOADER_${code}`)) {
				message = main_core.Loc.getMessage(`UPLOADER_${code}`, replacements);
			}
			if (main_core.Type.isStringFilled(message) && !main_core.Type.isString(description) && main_core.Loc.hasMessage(`UPLOADER_${code}_DESC`)) {
				description = main_core.Loc.getMessage(`UPLOADER_${code}_DESC`, replacements);
			}
			super(message ?? undefined, code, customData);
			this.setDescription(description);
		}
		static createFromAjaxErrors(errors) {
			if (!main_core.Type.isArrayFilled(errors) || !main_core.Type.isPlainObject(errors[0])) {
				return new this('SERVER_ERROR');
			}
			const uploaderError = errors.find(error => {
				return error.type === 'file-uploader';
			});
			if (uploaderError && !uploaderError.system) {
				const {
					code,
					message,
					description,
					customData
				} = uploaderError;
				const error = new this(code, message, description, customData);
				error.setOrigin(UploaderError.Origin.SERVER);
				error.setType(UploaderError.Type.USER);
				return error;
			}
			let {
				code,
				message,
				description
			} = errors[0];
			const {
				customData,
				system,
				type
			} = errors[0];
			if (code === 'NETWORK_ERROR') {
				message = main_core.Loc.getMessage('UPLOADER_NETWORK_ERROR');
			} else {
				code = main_core.Type.isStringFilled(code) ? code : 'SERVER_ERROR';
				if (!main_core.Type.isStringFilled(description)) {
					description = message;
					message = main_core.Loc.getMessage('UPLOADER_SERVER_ERROR');
				}
			}
			console.error('Uploader', errors);
			const error = new this(code, message, description, customData);
			error.setOrigin(UploaderError.Origin.SERVER);
			if (type === 'file-uploader') {
				error.setType(system ? UploaderError.Type.SYSTEM : UploaderError.Type.USER);
			} else {
				error.setType(UploaderError.Type.UNKNOWN);
			}
			return error;
		}
		static createFromError(error) {
			return new this(error.name, error.message);
		}
		getDescription() {
			return this.description;
		}
		setDescription(text) {
			if (main_core.Type.isString(text)) {
				this.description = text;
			}
			return this;
		}
		getOrigin() {
			return this.origin;
		}
		setOrigin(origin) {
			if (Object.values(UploaderError.Origin).includes(origin)) {
				this.origin = origin;
			}
			return this;
		}
		getType() {
			return this.type;
		}
		setType(type) {
			if (main_core.Type.isStringFilled(type)) {
				this.type = type;
			}
			return this;
		}
		clone() {
			const options = JSON.parse(JSON.stringify(this));
			const error = new UploaderError(options.code, options.message, options.description, options.customData);
			error.setOrigin(options.origin);
			error.setType(options.type);
			return error;
		}
		toString() {
			return `Uploader Error (${this.getCode()}): ${this.getMessage()} (${this.getOrigin()})`;
		}
		toJSON() {
			return {
				code: this.getCode(),
				message: this.getMessage(),
				description: this.getDescription(),
				origin: this.getOrigin(),
				type: this.getType(),
				customData: this.getCustomData()
			};
		}
	}

	class AbstractUploadController extends main_core_events.EventEmitter {
		#server;
		#options;
		constructor(server, options = {}) {
			super();
			this.setEventNamespace('BX.UI.Uploader.UploadController');
			this.#server = server;
			this.#options = options;
		}
		getServer() {
			return this.#server;
		}
		getOptions() {
			return this.#options;
		}
		getOption(option, defaultValue) {
			if (!main_core.Type.isUndefined(this.#options[option])) {
				return this.#options[option];
			}
			if (!main_core.Type.isUndefined(defaultValue)) {
				return defaultValue;
			}
			return null;
		}
		upload(file) {
			throw new Error('You must implement upload() method.');
		}
		abort() {
			throw new Error('You must implement abort() method.');
		}
	}

	class AbstractLoadController extends main_core_events.EventEmitter {
		#server;
		#options;
		constructor(server, options = {}) {
			super();
			this.setEventNamespace('BX.UI.Uploader.LoadController');
			this.#server = server;
			this.#options = options;
		}
		getServer() {
			return this.#server;
		}
		getOptions() {
			return this.#options;
		}
		getOption(option, defaultValue) {
			if (!main_core.Type.isUndefined(this.#options[option])) {
				return this.#options[option];
			}
			if (!main_core.Type.isUndefined(defaultValue)) {
				return defaultValue;
			}
			return null;
		}
		load(file) {
			throw new Error('You must implement load() method.');
		}
		abort() {
			throw new Error('You must implement abort() method.');
		}
	}

	class AbstractRemoveController extends main_core_events.EventEmitter {
		#server;
		#options;
		constructor(server, options = {}) {
			super();
			this.setEventNamespace('BX.UI.Uploader.RemoveController');
			this.#server = server;
			this.#options = options;
		}
		getServer() {
			return this.#server;
		}
		getOptions() {
			return this.#options;
		}
		getOption(option, defaultValue) {
			if (!main_core.Type.isUndefined(this.#options[option])) {
				return this.#options[option];
			}
			if (!main_core.Type.isUndefined(defaultValue)) {
				return defaultValue;
			}
			return null;
		}
		remove(file) {
			throw new Error('You must implement remove() method.');
		}
	}

	let crypto = window.crypto || window.msCrypto;
	if (!crypto && typeof globalThis.process === 'object') {
		crypto = globalThis.require('crypto').webcrypto;
	}
	const createUniqueId = () => {
		return `${1e7}-${1e3}-${4e3}-${8e3}-${1e11}`.replaceAll(/[018]/g, part => (Number(part) ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> Number(part) / 4).toString(16));
	};

	const getExtensionFromType = type => {
		if (!main_core.Type.isStringFilled(type)) {
			return '';
		}
		const subtype = type.split('/').pop();
		if (/javascript/.test(subtype)) {
			return 'js';
		}
		if (/plain/.test(subtype)) {
			return 'txt';
		}
		if (/svg/.test(subtype)) {
			return 'svg';
		}
		if (/[a-z]+/.test(subtype)) {
			return subtype;
		}
		return '';
	};

	let counter = 0;
	const createFileFromBlob = (blob, fileName) => {
		let newFileName = fileName;
		if (!main_core.Type.isStringFilled(newFileName)) {
			const date = new Date();
			newFileName = `File ${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${++counter}`;
			const extension = getExtensionFromType(blob.type);
			if (extension) {
				newFileName += `.${extension}`;
			}
		}
		try {
			return new File([blob], newFileName, {
				lastModified: Date.now(),
				lastModifiedDate: new Date(),
				type: blob.type
			});
		} catch {
			const file = blob.slice(0, blob.size, blob.type);
			file.name = newFileName;
			file.lastModified = Date.now();
			file.lastModifiedDate = new Date();
			return file;
		}
	};

	const regexp = /^data:((?:\w+\/(?:(?!;).)+)?)((?:;[\W\w]*?[^;])*),(.+)$/;
	const isDataUri = str => {
		return main_core.Type.isString(str) ? str.match(regexp) !== null : false;
	};

	const createBlobFromDataUri = dataURI => {
		const byteString = atob(dataURI.split(',')[1]);
		const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
		const buffer = new ArrayBuffer(byteString.length);
		const view = new Uint8Array(buffer);
		for (let i = 0; i < byteString.length; i++) {
			view[i] = byteString.codePointAt(i);
		}
		return new Blob([buffer], {
			type: mimeString
		});
	};

	const imageExtensions = new Set(['jpg', 'bmp', 'jpeg', 'jpe', 'gif', 'png', 'webp']);
	const isResizableImage = (file, mimeType = null) => {
		const fileName = main_core.Type.isFile(file) ? file.name : file;
		const type = main_core.Type.isFile(file) ? file.type : mimeType;
		const extension = getFileExtension(fileName).toLowerCase();
		return imageExtensions.has(extension) && (type === null || /^image\/[\d.a-z-]+$/i.test(type));
	};

	const formatFileSize = (size, base = 1024) => {
		let i = 0;
		const units = getUnits();
		let currentSize = size;
		while (currentSize >= base && units[i + 1]) {
			currentSize /= base;
			i++;
		}
		const formattedSize = main_core.Type.isInteger(currentSize) ? currentSize : currentSize.toFixed(1);
		return formattedSize + units[i];
	};
	let fileSizeUnits = null;
	const getUnits = () => {
		if (fileSizeUnits !== null) {
			return fileSizeUnits;
		}
		const units = main_core.Loc.getMessage('UPLOADER_FILE_SIZE_POSTFIXES').split(/\|/);
		fileSizeUnits = main_core.Type.isArrayFilled(units) ? units : ['B', 'kB', 'MB', 'GB', 'TB'];
		return fileSizeUnits;
	};

	class UploaderFile extends main_core_events.EventEmitter {
		#id = null;
		#file = null;
		#serverFileId = null;
		#name = null;
		#size = 0;
		#type = '';
		#width = null;
		#height = null;
		#animated = false;
		#treatImageAsFile = false;
		#clientPreview = null;
		#clientPreviewUrl = null;
		#clientPreviewWidth = null;
		#clientPreviewHeight = null;
		#serverPreviewUrl = null;
		#serverPreviewWidth = null;
		#serverPreviewHeight = null;
		#downloadUrl = null;
		#status = FileStatus.INIT;
		#origin = FileOrigin.CLIENT;
		#errors = [];
		#progress = 0;
		#customData = Object.create(null);
		#viewerAttrs = null;
		#uploadController = null;
		#server = null;
		#isUploadable = false;
		#loadController = null;
		#removeController = null;
		#forceServerLoad = false;
		#uploadCallbacks = new CallbackCollection(this);
		constructor(source, fileOptions = {}) {
			super();
			this.setEventNamespace('BX.UI.Uploader.File');
			const options = main_core.Type.isPlainObject(fileOptions) ? fileOptions : {};
			if (main_core.Type.isFile(source)) {
				this.#file = source;
				this.update(options);
			} else if (main_core.Type.isBlob(source)) {
				this.#file = createFileFromBlob(source, options.name || source.name);
				this.update(options);
			} else if (isDataUri(source)) {
				const blob = createBlobFromDataUri(source);
				this.#file = createFileFromBlob(blob, options.name);
				this.update(options);
			} else if (main_core.Type.isNumber(source) || main_core.Type.isStringFilled(source)) {
				this.#origin = FileOrigin.SERVER;
				this.#serverFileId = source;
				this.update(options);
			} else if (main_core.Type.isPlainObject(source) && (main_core.Type.isNumber(source.serverFileId) || main_core.Type.isStringFilled(source.serverFileId))) {
				this.#origin = FileOrigin.SERVER;
				this.update(source);
			}
			this.#id = main_core.Type.isStringFilled(options.id) ? options.id : createUniqueId();
			if (this.#origin === FileOrigin.SERVER) {
				this.#forceServerLoad = options.preload === true || main_core.Type.isPlainObject(source) && source.preload === true;
			}
			this.subscribeFromOptions({
				[FileEvent.ADD]: () => {
					this.#setStatus(FileStatus.ADDED);
				}
			});
			this.subscribeFromOptions(options.events);
		}
		load() {
			if (!this.canLoad()) {
				return;
			}
			this.#setStatus(FileStatus.LOADING);
			this.emit(FileEvent.LOAD_START);
			this.#loadController.load(this);
		}
		shouldForceServerLoad() {
			return this.#forceServerLoad;
		}
		upload(callbacks = {}) {
			this.#uploadCallbacks.subscribe(callbacks);
			if (this.isComplete() && this.isUploadable()) {
				this.#uploadCallbacks.emit('onComplete');
				return;
			}
			if (this.isUploadFailed()) {
				this.#uploadCallbacks.emit('onError', {
					error: this.getError()
				});
				return;
			}
			if (!this.canUpload()) {
				this.#uploadCallbacks.emit('onError', {
					error: new UploaderError('FILE_UPLOAD_NOT_ALLOWED')
				});
				return;
			}
			const event = new main_core_events.BaseEvent({
				data: {
					file: this
				}
			});
			this.emit(FileEvent.BEFORE_UPLOAD, event);
			if (event.isDefaultPrevented()) {
				return;
			}
			this.#setStatus(FileStatus.PREPARING);
			const prepareEvent = new main_core_events.BaseEvent({
				data: {
					file: this
				}
			});
			this.emitAsync(FileEvent.PREPARE_FILE_ASYNC, prepareEvent).then(() => {
				if (this.#uploadController === null && this.#server !== null) {
					this.setUploadController(this.#server.createUploadController(this));
				}
				if (this.#uploadController === null) {
					const error = this.addError(new UploaderError('FILE_UPLOAD_NOT_ALLOWED'));
					this.#setStatus(FileStatus.UPLOAD_FAILED);
					this.emit(FileEvent.UPLOAD_ERROR, {
						error
					});
					this.#uploadCallbacks.emit('onError', {
						error
					});
					return;
				}
				this.#setStatus(FileStatus.UPLOADING);
				this.emit(FileEvent.UPLOAD_START);
				this.#uploadController.upload(this);
			}).catch(prepareError => {
				const error = this.addError(prepareError);
				this.#setStatus(FileStatus.UPLOAD_FAILED);
				this.emit(FileEvent.UPLOAD_ERROR, {
					error
				});
			});
		}
		remove(options) {
			if (this.getStatus() === FileStatus.INIT) {
				return;
			}
			this.#setStatus(FileStatus.INIT);
			this.emit(FileEvent.REMOVE_COMPLETE);
			this.abort();
			const removeFromServer = !options || options.removeFromServer !== false;
			if (removeFromServer && this.#removeController !== null && this.getOrigin() === FileOrigin.CLIENT) {
				this.#removeController.remove(this);
			}
			this.#uploadController = null;
			this.#server = null;
			this.#isUploadable = false;
			this.#loadController = null;
			this.#removeController = null;
		}
		abort() {
			if (this.isLoading()) {
				this.#setStatus(FileStatus.LOAD_FAILED);
				const error = new UploaderError('FILE_LOAD_ABORTED');
				this.emit(FileEvent.LOAD_ERROR, {
					error
				});
			} else if (this.isUploading()) {
				this.#setStatus(FileStatus.UPLOAD_FAILED);
				const error = new UploaderError('FILE_UPLOAD_ABORTED');
				this.emit('onUploadError', {
					error
				});
				this.#uploadCallbacks.emit('onError', {
					error
				});
			}
			if (this.#loadController) {
				this.#loadController.abort();
			}
			if (this.#uploadController) {
				this.#uploadController.abort();
			}
		}
		getUploadController() {
			return this.#uploadController;
		}
		setUploadController(controller) {
			if (!(controller instanceof AbstractUploadController) && !main_core.Type.isNull(controller)) {
				return;
			}
			const changed = this.#uploadController !== controller;
			this.#uploadController = controller ?? null;
			if (this.#uploadController && changed) {
				this.#uploadController.subscribeOnce('onError', event => {
					const error = this.addError(event.getData().error);
					this.#setStatus(FileStatus.UPLOAD_FAILED);
					this.emit(FileEvent.UPLOAD_ERROR, {
						error
					});
					this.#uploadCallbacks.emit('onError', {
						error
					});
				});
				this.#uploadController.subscribe('onProgress', event => {
					const {
						progress
					} = event.getData();
					this.setProgress(progress);
					this.emit(FileEvent.UPLOAD_PROGRESS, {
						progress
					});
				});
				this.#uploadController.subscribeOnce('onUpload', event => {
					this.#setStatus(FileStatus.COMPLETE);
					this.update(event.getData().fileInfo);
					this.emit(FileEvent.UPLOAD_COMPLETE);
					this.#uploadCallbacks.emit('onComplete');
				});
			}
			if (changed) {
				this.emit(FileEvent.UPLOAD_CONTROLLER_INIT, {
					controller
				});
			}
		}
		setLoadController(controller) {
			if (!(controller instanceof AbstractLoadController)) {
				return;
			}
			const changed = this.#loadController !== controller;
			this.#loadController = controller;
			if (this.#loadController && changed) {
				this.#loadController.subscribeOnce('onError', event => {
					const error = this.addError(event.getData().error);
					this.#setStatus(FileStatus.LOAD_FAILED);
					this.emit(FileEvent.LOAD_ERROR, {
						error
					});
				});
				this.#loadController.subscribe('onProgress', event => {
					const {
						progress
					} = event.getData();
					this.emit(FileEvent.LOAD_PROGRESS, {
						progress
					});
				});
				this.#loadController.subscribeOnce('onLoad', event => {
					if (this.getOrigin() === FileOrigin.CLIENT) {
						const validationEvent = new main_core_events.BaseEvent({
							data: {
								file: this
							}
						});
						this.emitAsync(FileEvent.VALIDATE_FILE_ASYNC, validationEvent).then(() => {
							if (this.isUploadable()) {
								this.#setStatus(FileStatus.PENDING);
								this.emit(FileEvent.LOAD_COMPLETE);
							} else {
								const preparationEvent = new main_core_events.BaseEvent({
									data: {
										file: this
									}
								});
								this.emitAsync(FileEvent.PREPARE_FILE_ASYNC, preparationEvent).then(() => {
									this.#setStatus(FileStatus.COMPLETE);
									this.emit(FileEvent.LOAD_COMPLETE);
								}).catch(preparationError => {
									const error = this.addError(preparationError);
									this.#setStatus(FileStatus.LOAD_FAILED);
									this.emit(FileEvent.LOAD_ERROR, {
										error
									});
								});
							}
						}).catch(validationError => {
							const error = this.addError(validationError);
							this.#setStatus(FileStatus.LOAD_FAILED);
							this.emit(FileEvent.LOAD_ERROR, {
								error
							});
						});
					} else {
						this.update(event.getData().fileInfo);
						if (this.isUploadable()) {
							this.#setStatus(FileStatus.PENDING);
						} else {
							this.#setStatus(FileStatus.COMPLETE);
						}
						this.emit(FileEvent.LOAD_COMPLETE);
					}
				});
			}
			if (changed) {
				this.emit(FileEvent.LOAD_CONTROLLER_INIT, {
					controller
				});
			}
		}
		setRemoveController(controller) {
			if (!(controller instanceof AbstractRemoveController) && !main_core.Type.isNull(controller)) {
				return;
			}
			const changed = this.#removeController !== controller;
			this.#removeController = controller ?? null;
			if (this.#removeController && changed) {
				this.#removeController.subscribeOnce('onError', event => {
				});
				this.#removeController.subscribeOnce('onRemove', event => {
				});
			}
			if (changed) {
				this.emit(FileEvent.REMOVE_CONTROLLER_INIT, {
					controller
				});
			}
		}
		isReadyToUpload() {
			return this.getStatus() === FileStatus.PENDING;
		}
		isUploadable() {
			return this.#isUploadable || this.#uploadController !== null;
		}
		setServer(server) {
			this.#server = server;
			this.#isUploadable = server !== null && server.canCreateUploadController();
		}
		isLoadable() {
			return this.#loadController !== null;
		}
		isRemoveable() {
			return this.#removeController !== null;
		}
		canUpload() {
			return this.isReadyToUpload() && this.isUploadable();
		}
		canLoad() {
			return this.getStatus() === FileStatus.ADDED && this.isLoadable();
		}
		isUploading() {
			return this.getStatus() === FileStatus.UPLOADING;
		}
		isPreparing() {
			return this.getStatus() === FileStatus.PREPARING;
		}
		isLoading() {
			return this.getStatus() === FileStatus.LOADING;
		}
		isComplete() {
			return this.getStatus() === FileStatus.COMPLETE;
		}
		isFailed() {
			return this.getStatus() === FileStatus.LOAD_FAILED || this.getStatus() === FileStatus.UPLOAD_FAILED;
		}
		isLoadFailed() {
			return this.getStatus() === FileStatus.LOAD_FAILED;
		}
		isUploadFailed() {
			return this.getStatus() === FileStatus.UPLOAD_FAILED;
		}
		isInProgress() {
			return [FileStatus.LOADING, FileStatus.PENDING, FileStatus.PREPARING, FileStatus.UPLOADING].includes(this.getStatus());
		}
		getBinary() {
			return this.#file;
		}
		setFile(file) {
			if (main_core.Type.isFile(file)) {
				this.#file = file;
			} else if (main_core.Type.isBlob(file)) {
				this.#file = createFileFromBlob(file, this.getName());
			}
		}
		update(options) {
			if (main_core.Type.isPlainObject(options)) {
				this.setName(options.name);
				this.setType(options.type);
				this.setSize(options.size);
				this.setServerFileId(options.serverFileId);
				this.setWidth(options.width);
				this.setHeight(options.height);
				this.setTreatImageAsFile(options.treatImageAsFile);
				this.setClientPreview(options.clientPreview, options.clientPreviewWidth, options.clientPreviewHeight);
				this.setServerPreview(options.serverPreviewUrl, options.serverPreviewWidth, options.serverPreviewHeight);
				this.setDownloadUrl(options.downloadUrl);
				this.setCustomData(options.customData);
				this.setViewerAttrs(options.viewerAttrs);
				this.setLoadController(options.loadController);
				this.setUploadController(options.uploadController);
				this.setRemoveController(options.removeController);
			}
		}
		getName() {
			const binary = this.getBinary();
			return this.#name === null ? binary ? binary.name : '' : this.#name;
		}
		setName(name) {
			if (main_core.Type.isStringFilled(name) || main_core.Type.isNull(name)) {
				this.#name = name;
				this.emit(FileEvent.STATE_CHANGE, {
					property: 'name',
					value: name
				});
			}
		}
		getExtension() {
			const name = this.getName();
			const position = name.lastIndexOf('.');
			return position >= 0 ? name.slice(Math.max(0, position + 1)).toLowerCase() : '';
		}
		getType() {
			const binary = this.getBinary();
			return binary ? binary.type : this.#type;
		}
		setType(type) {
			if (main_core.Type.isStringFilled(type)) {
				this.#type = type;
				this.emit(FileEvent.STATE_CHANGE, {
					property: 'type',
					value: type
				});
			}
		}
		getSize() {
			const binary = this.getBinary();
			return binary ? binary.size : this.#size;
		}
		getSizeFormatted() {
			return formatFileSize(this.getSize());
		}
		setSize(size) {
			if (main_core.Type.isNumber(size) && size >= 0) {
				this.#size = size;
				this.emit(FileEvent.STATE_CHANGE, {
					property: 'size',
					value: size
				});
			}
		}
		getId() {
			return this.#id;
		}
		getServerFileId() {
			return this.#serverFileId;
		}
		getServerId() {
			return this.getServerFileId();
		}
		setServerFileId(id) {
			if (main_core.Type.isNumber(id) || main_core.Type.isStringFilled(id) || main_core.Type.isNull(id)) {
				this.#serverFileId = id;
				this.emit(FileEvent.STATE_CHANGE, {
					property: 'serverFileId',
					value: id
				});
			}
		}
		getStatus() {
			return this.#status;
		}
		#setStatus(status) {
			this.#status = status;
			this.emit(FileEvent.STATE_CHANGE, {
				property: 'status',
				value: status
			});
			this.emit(FileEvent.STATUS_CHANGE);
		}
		getOrigin() {
			return this.#origin;
		}
		getDownloadUrl() {
			return this.#downloadUrl;
		}
		setDownloadUrl(url) {
			if (main_core.Type.isStringFilled(url) || main_core.Type.isNull(url)) {
				this.#downloadUrl = url;
				this.emit(FileEvent.STATE_CHANGE, {
					property: 'downloadUrl',
					value: url
				});
			}
		}
		getWidth() {
			return this.#width;
		}
		setWidth(width) {
			if (main_core.Type.isNumber(width) || main_core.Type.isNull(width)) {
				this.#width = width;
				this.emit(FileEvent.STATE_CHANGE, {
					property: 'width',
					value: width
				});
			}
		}
		getHeight() {
			return this.#height;
		}
		setHeight(height) {
			if (main_core.Type.isNumber(height) || main_core.Type.isNull(height)) {
				this.#height = height;
				this.emit(FileEvent.STATE_CHANGE, {
					property: 'height',
					value: height
				});
			}
		}
		isAnimated() {
			return this.#animated;
		}
		setAnimated(flag) {
			if (main_core.Type.isBoolean(flag)) {
				this.#animated = flag;
				this.emit(FileEvent.STATE_CHANGE, {
					property: 'animated',
					value: flag
				});
			}
		}
		setTreatImageAsFile(flag) {
			if (main_core.Type.isBoolean(flag)) {
				this.#treatImageAsFile = flag;
				this.emit(FileEvent.STATE_CHANGE, {
					property: 'treatImageAsFile',
					value: flag
				});
			}
		}
		shouldTreatImageAsFile() {
			return this.#treatImageAsFile;
		}
		getPreviewUrl() {
			return this.getClientPreview() ? this.getClientPreviewUrl() : this.getServerPreviewUrl();
		}
		getPreviewWidth() {
			return this.getClientPreview() ? this.getClientPreviewWidth() : this.getServerPreviewWidth();
		}
		getPreviewHeight() {
			return this.getClientPreview() ? this.getClientPreviewHeight() : this.getServerPreviewHeight();
		}
		getClientPreview() {
			return this.#clientPreview;
		}
		setClientPreview(file, width = null, height = null) {
			if (main_core.Type.isBlob(file) || main_core.Type.isNull(file)) {
				this.revokeClientPreviewUrl();
				const url = main_core.Type.isNull(file) ? null : URL.createObjectURL(file);
				this.#clientPreview = file;
				this.#clientPreviewUrl = url;
				this.#clientPreviewWidth = width;
				this.#clientPreviewHeight = height;
				this.emit(FileEvent.STATE_CHANGE, {
					property: 'clientPreviewUrl',
					value: url
				});
				this.emit(FileEvent.STATE_CHANGE, {
					property: 'clientPreviewWidth',
					value: width
				});
				this.emit(FileEvent.STATE_CHANGE, {
					property: 'clientPreviewHeight',
					value: height
				});
			}
		}
		getClientPreviewUrl() {
			return this.#clientPreviewUrl;
		}
		revokeClientPreviewUrl() {
			if (this.#clientPreviewUrl !== null) {
				URL.revokeObjectURL(this.#clientPreviewUrl);
				this.#clientPreviewUrl = null;
				this.emit(FileEvent.STATE_CHANGE, {
					property: 'clientPreviewUrl',
					value: null
				});
			}
		}
		getClientPreviewWidth() {
			return this.#clientPreviewWidth;
		}
		getClientPreviewHeight() {
			return this.#clientPreviewHeight;
		}
		getServerPreviewUrl() {
			return this.#serverPreviewUrl;
		}
		setServerPreview(url, width = null, height = null) {
			if (main_core.Type.isStringFilled(url) || main_core.Type.isNull(url)) {
				this.#serverPreviewUrl = url;
				this.#serverPreviewWidth = width;
				this.#serverPreviewHeight = height;
				this.emit(FileEvent.STATE_CHANGE, {
					property: 'serverPreviewUrl',
					value: url
				});
				this.emit(FileEvent.STATE_CHANGE, {
					property: 'serverPreviewWidth',
					value: width
				});
				this.emit(FileEvent.STATE_CHANGE, {
					property: 'serverPreviewHeight',
					value: height
				});
			}
		}
		getServerPreviewWidth() {
			return this.#serverPreviewWidth;
		}
		getServerPreviewHeight() {
			return this.#serverPreviewHeight;
		}
		isImage() {
			if (this.shouldTreatImageAsFile()) {
				return false;
			}
			return (this.getWidth() ?? 0) > 0 && (this.getHeight() ?? 0) > 0 && isResizableImage(this.getName(), this.getType());
		}
		isVideo() {
			return isSupportedVideo(this.getName());
		}
		getProgress() {
			return this.#progress;
		}
		setProgress(progress) {
			if (main_core.Type.isNumber(progress)) {
				this.#progress = progress;
				this.emit(FileEvent.STATE_CHANGE, {
					property: 'progress',
					value: progress
				});
			}
		}
		addError(error) {
			const uploaderError = error instanceof Error ? UploaderError.createFromError(error) : error;
			this.#errors.push(uploaderError);
			this.emit(FileEvent.STATE_CHANGE);
			return uploaderError;
		}
		getError() {
			return this.#errors[0] || null;
		}
		getErrors() {
			return this.#errors;
		}
		getState() {
			return JSON.parse(JSON.stringify(this));
		}
		setCustomData(property, value) {
			if (main_core.Type.isNull(property)) {
				this.#customData = Object.create(null);
				this.emit(FileEvent.STATE_CHANGE, {
					property: 'customData',
					value: null
				});
			} else if (main_core.Type.isPlainObject(property)) {
				Object.entries(property).forEach(item => {
					const [currentKey, currentValue] = item;
					this.setCustomData(currentKey, currentValue);
				});
			} else if (main_core.Type.isString(property)) {
				if (main_core.Type.isNull(value)) {
					delete this.#customData[property];
					this.emit(FileEvent.STATE_CHANGE, {
						property: 'customData',
						customProperty: property,
						value: null
					});
				} else if (!main_core.Type.isUndefined(value)) {
					this.#customData[property] = value;
					this.emit(FileEvent.STATE_CHANGE, {
						property: 'customData',
						customProperty: property,
						value
					});
				}
			}
		}
		getCustomData(property) {
			if (main_core.Type.isUndefined(property)) {
				return this.#customData;
			}
			if (main_core.Type.isStringFilled(property)) {
				return this.#customData[property];
			}
			return undefined;
		}
		setViewerAttrs(viewerAttrs) {
			if (main_core.Type.isNull(viewerAttrs) || main_core.Type.isPlainObject(viewerAttrs)) {
				this.#viewerAttrs = viewerAttrs;
				this.emit(FileEvent.STATE_CHANGE, {
					property: 'viewerAttrs',
					value: viewerAttrs
				});
			}
		}
		getViewerAttrs() {
			return this.#viewerAttrs;
		}
		toJSON() {
			return {
				id: this.getId(),
				serverFileId: this.getServerFileId(),
				serverId: this.getServerFileId(),
				status: this.getStatus(),
				name: this.getName(),
				size: this.getSize(),
				sizeFormatted: this.getSizeFormatted(),
				type: this.getType(),
				extension: this.getExtension(),
				origin: this.getOrigin(),
				isImage: this.isImage(),
				isVideo: this.isVideo(),
				failed: this.isFailed(),
				width: this.getWidth(),
				height: this.getHeight(),
				animated: this.isAnimated(),
				progress: this.getProgress(),
				error: this.getError(),
				errors: this.getErrors(),
				previewUrl: this.getPreviewUrl(),
				previewWidth: this.getPreviewWidth(),
				previewHeight: this.getPreviewHeight(),
				clientPreviewUrl: this.getClientPreviewUrl(),
				clientPreviewWidth: this.getClientPreviewWidth(),
				clientPreviewHeight: this.getClientPreviewHeight(),
				serverPreviewUrl: this.getServerPreviewUrl(),
				serverPreviewWidth: this.getServerPreviewWidth(),
				serverPreviewHeight: this.getServerPreviewHeight(),
				downloadUrl: this.getDownloadUrl(),
				customData: this.getCustomData(),
				viewerAttrs: this.getViewerAttrs()
			};
		}
	}
	class CallbackCollection {
		#emitter = null;
		constructor(file) {
			this.#emitter = new main_core_events.EventEmitter(file, 'BX.UI.Uploader.File.UploadCallbacks');
		}
		subscribe(callbacks = {}) {
			const handlers = main_core.Type.isPlainObject(callbacks) ? callbacks : {};
			if (main_core.Type.isFunction(handlers.onComplete)) {
				this.getEmitter().subscribeOnce('onComplete', handlers.onComplete);
			}
			if (main_core.Type.isFunction(handlers.onError)) {
				this.getEmitter().subscribeOnce('onError', handlers.onError);
			}
		}
		emit(eventName, event) {
			if (this.#emitter) {
				this.#emitter.emit(eventName, event);
				this.#emitter.unsubscribeAll();
			}
		}
		getEmitter() {
			if (main_core.Type.isNull(this.#emitter)) {
				this.#emitter = new main_core_events.EventEmitter(this, 'BX.UI.Uploader.File.UploadCallbacks');
			}
			return this.#emitter;
		}
	}

	class Chunk {
		#data;
		#offset = 0;
		#retries = [];
		constructor(data, offset) {
			this.#data = data;
			this.#offset = offset;
		}
		getNextRetryDelay() {
			if (this.#retries.length === 0) {
				return null;
			}
			return this.#retries.shift() || null;
		}
		setRetries(retries) {
			if (main_core.Type.isArray(retries)) {
				this.#retries = retries;
			}
		}
		getData() {
			return this.#data;
		}
		getOffset() {
			return this.#offset;
		}
		getSize() {
			return this.getData().size;
		}
	}

	function normalizeFileName(name) {
		return name && name.normalize ? name.normalize() : name;
	}

	function getControllerOptionsJSON(server) {
		const controllerOptions = server.getControllerOptions();
		return controllerOptions ? JSON.stringify(controllerOptions) : null;
	}

	class UploadController extends AbstractUploadController {
		#file = null;
		#chunkOffset = null;
		#chunkTimeout = null;
		#token = null;
		#xhr = null;
		#aborted = false;
		constructor(server, options = {}) {
			super(server, options);
		}
		upload(file) {
			if (!main_core.Type.isFile(file.getBinary())) {
				this.emit('onError', {
					error: new UploaderError('WRONG_FILE_SOURCE')
				});
				return;
			}
			if (this.#chunkOffset !== null) {
				return;
			}
			this.#file = file;
			const nextChunk = this.#getNextChunk();
			if (nextChunk) {
				this.#uploadChunk(nextChunk);
			}
		}
		abort() {
			if (this.#xhr) {
				this.#aborted = true;
				this.#xhr.abort();
				this.#xhr = null;
			}
			if (this.#chunkTimeout) {
				clearTimeout(this.#chunkTimeout);
				this.#chunkTimeout = null;
			}
		}
		#uploadChunk(chunk) {
			const totalSize = this.getFile().getSize();
			const isOnlyOneChunk = chunk.getOffset() === 0 && totalSize === chunk.getSize();
			const fileName = normalizeFileName(this.getFile().getName());
			const type = main_core.Type.isStringFilled(this.getFile().getType()) ? this.getFile().getType() : 'application/octet-stream';
			const headers = [{
				name: 'Content-Type',
				value: type
			}, {
				name: 'X-Upload-Content-Name',
				value: encodeURIComponent(fileName)
			}];
			if (!isOnlyOneChunk) {
				const rangeStart = chunk.getOffset();
				const rangeEnd = chunk.getOffset() + chunk.getSize() - 1;
				const rangeHeader = `bytes ${rangeStart}-${rangeEnd}/${totalSize}`;
				headers.push({
					name: 'Content-Range',
					value: rangeHeader
				});
			}
			main_core.ajax.runAction('ui.fileuploader.upload', {
				headers,
				data: chunk.getData(),
				preparePost: false,
				getParameters: {
					controller: this.getServer().getController(),
					controllerOptions: getControllerOptionsJSON(this.getServer()),
					token: this.getToken() || ''
				},
				onrequeststart: xhr => {
					this.#xhr = xhr;
					this.#aborted = false;
				},
				onprogressupload: event => {
					if (event.lengthComputable) {
						const size = this.getFile().getSize();
						const uploadedBytes = Math.min(size, chunk.getOffset() + event.loaded);
						const progress = size > 0 ? Math.floor(uploadedBytes / size * 100) : 100;
						this.emit('onProgress', {
							progress
						});
					}
				}
			}).then(response => {
				if (response.data.token) {
					this.setToken(response.data.token);
					if (this.getFile().getServerFileId() === null) {
						this.getFile().setServerFileId(response.data.token);
					}
					const size = this.getFile().getSize();
					const progress = size > 0 ? Math.floor((chunk.getOffset() + chunk.getSize()) / size * 100) : 100;
					this.emit('onProgress', {
						progress
					});
					const nextChunk = this.#getNextChunk();
					if (nextChunk) {
						this.#uploadChunk(nextChunk);
					} else {
						this.emit('onProgress', {
							progress: 100
						});
						this.emit('onUpload', {
							fileInfo: response.data.file
						});
					}
				} else {
					this.emit('onError', {
						error: new UploaderError('SERVER_ERROR')
					});
				}
			}).catch(response => {
				if (this.#aborted) {
					return;
				}
				const error = UploaderError.createFromAjaxErrors(response.errors);
				const shouldRetry = error.getCode() === 'NETWORK_ERROR' || error.getType() === UploaderError.Type.UNKNOWN;
				if (!shouldRetry || !this.#retryUploadChunk(chunk)) {
					this.emit('onError', {
						error
					});
				}
			});
		}
		#retryUploadChunk(chunk) {
			const nextDelay = chunk.getNextRetryDelay();
			if (nextDelay === null) {
				return false;
			}
			if (this.#chunkTimeout !== null) {
				clearTimeout(this.#chunkTimeout);
			}
			this.#chunkTimeout = setTimeout(() => {
				this.#uploadChunk(chunk);
			}, nextDelay);
			return true;
		}
		#getNextChunk() {
			if (this.getChunkOffset() !== null && this.getChunkOffset() >= this.getFile().getSize()) {
				return null;
			}
			if (this.getChunkOffset() === null) {
				this.#chunkOffset = 0;
			}
			let chunk;
			if (this.getChunkOffset() === 0 && this.getFile().getSize() <= this.getChunkSize()) {
				chunk = new Chunk(this.getFile().getBinary(), this.getChunkOffset());
				this.#chunkOffset = this.getFile().getSize();
			} else {
				const currentChunkSize = Math.min(this.getChunkSize(), this.getFile().getSize() - this.getChunkOffset());
				const nextOffset = this.getChunkOffset() + currentChunkSize;
				const fileRange = this.getFile().getBinary().slice(this.getChunkOffset(), nextOffset);
				chunk = new Chunk(fileRange, this.getChunkOffset());
				this.#chunkOffset = nextOffset;
			}
			chunk.setRetries([...this.getServer().getChunkRetryDelays()]);
			return chunk;
		}
		getFile() {
			return this.#file;
		}
		getChunkSize() {
			return this.getServer().getChunkSize();
		}
		getChunkOffset() {
			return this.#chunkOffset;
		}
		getToken() {
			return this.#token;
		}
		setToken(token) {
			if (main_core.Type.isStringFilled(token)) {
				this.#token = token;
			}
		}
	}

	function runConcurrentPool(options) {
		const {
			items,
			maxConcurrency,
			isAborted,
			task,
			onItemDone,
			onAllDone,
			onError
		} = options;
		let inFlight = 0;
		let index = 0;
		let errored = false;
		if (items.length === 0) {
			onAllDone();
			return;
		}
		const runItem = item => {
			Promise.resolve(task(item)).then(result => {
				inFlight--;
				if (errored) {
					return;
				}
				if (onItemDone) {
					onItemDone(item, result);
				}
				if (index >= items.length && inFlight === 0) {
					onAllDone();
				} else {
					launchNext();
				}
			}).catch(error => {
				inFlight--;
				if (errored || isAborted()) {
					return;
				}
				errored = true;
				onError(item, error);
			});
		};
		function launchNext() {
			if (errored || isAborted()) {
				return;
			}
			while (inFlight < maxConcurrency && index < items.length) {
				const item = items[index++];
				inFlight++;
				runItem(item);
			}
		}
		launchNext();
	}

	function createCloudError(code, customData = {}) {
		const message = main_core.Loc.getMessage('UPLOADER_CLOUD_ERROR', {
			'#CODE#': code
		});
		return new UploaderError(code, message, customData);
	}

	class ParallelUploadController extends AbstractUploadController {
		#file = null;
		#token = null;
		#partSize = null;
		#partCount = null;
		#fileInfo = null;
		#activeXhrs = new Set();
		#pendingTimeouts = new Set();
		#aborted = false;
		#completedSize = 0;
		#partProgress = new Map();
		#failedParts = new Set();
		constructor(server, options = {}) {
			super(server, options);
		}
		upload(file) {
			if (!main_core.Type.isFile(file.getBinary())) {
				this.emit('onError', {
					error: new UploaderError('WRONG_FILE_SOURCE')
				});
				return;
			}
			if (this.#file !== null) {
				return;
			}
			this.#file = file;
			const totalSize = file.getSize();
			const chunkSize = this.getServer().getChunkSize();
			const firstChunkSize = Math.min(chunkSize, totalSize);
			const firstBlob = firstChunkSize === totalSize ? file.getBinary() : file.getBinary().slice(0, firstChunkSize);
			const firstChunk = new Chunk(firstBlob, 0);
			this.#uploadFirstChunk(firstChunk, totalSize);
		}
		abort() {
			this.#aborted = true;
			for (const xhr of this.#activeXhrs) {
				xhr.abort();
			}
			this.#activeXhrs.clear();
			for (const id of this.#pendingTimeouts) {
				clearTimeout(id);
			}
			this.#pendingTimeouts.clear();
		}
		#uploadFirstChunk(chunk, totalSize) {
			const file = this.#file;
			const fileName = normalizeFileName(file.getName());
			const type = main_core.Type.isStringFilled(file.getType()) ? file.getType() : 'application/octet-stream';
			const isOnlyOne = chunk.getSize() === totalSize;
			const headers = [{
				name: 'Content-Type',
				value: type
			}, {
				name: 'X-Upload-Content-Name',
				value: encodeURIComponent(fileName)
			}];
			if (!isOnlyOne) {
				headers.push({
					name: 'Content-Range',
					value: `bytes 0-${chunk.getSize() - 1}/${totalSize}`
				});
			}
			const retryDelays = [...this.getServer().getChunkRetryDelays()];
			const attempt = () => {
				if (this.#aborted) {
					return;
				}
				let xhr = null;
				main_core.ajax.runAction('ui.fileuploader.upload', {
					headers,
					data: chunk.getData(),
					preparePost: false,
					getParameters: {
						controller: this.getServer().getController(),
						controllerOptions: getControllerOptionsJSON(this.getServer()),
						strategy: 'parallel',
						token: ''
					},
					onrequeststart: req => {
						xhr = req;
						this.#activeXhrs.add(req);
					},
					onprogressupload: event => {
						this.#onPartProgress(1, event, chunk.getSize());
					}
				}).then(response => {
					this.#forgetXhr(xhr);
					if (this.#aborted) {
						return;
					}
					this.#onFirstChunkComplete(response.data, chunk.getSize());
				}).catch(response => {
					this.#forgetXhr(xhr);
					if (this.#aborted) {
						return;
					}
					const error = UploaderError.createFromAjaxErrors(response.errors);
					const shouldRetry = error.getCode() === 'NETWORK_ERROR' || error.getType() === UploaderError.Type.UNKNOWN;
					if (shouldRetry && retryDelays.length > 0) {
						const delay = retryDelays.shift();
						const id = setTimeout(() => {
							this.#pendingTimeouts.delete(id);
							attempt();
						}, delay);
						this.#pendingTimeouts.add(id);
					} else {
						this.emit('onError', {
							error
						});
					}
				});
			};
			attempt();
		}
		#onFirstChunkComplete(data, firstChunkSize) {
			if (!data || !data.token) {
				this.emit('onError', {
					error: new UploaderError('SERVER_ERROR')
				});
				return;
			}
			this.#token = data.token;
			this.#partProgress.delete(1);
			this.#completedSize = firstChunkSize;
			if (this.#file.getServerFileId() === null) {
				this.#file.setServerFileId(data.token);
			}
			if (data.file) {
				this.#fileInfo = data.file;
				this.emit('onProgress', {
					progress: 100
				});
				this.emit('onUpload', {
					fileInfo: data.file
				});
				return;
			}
			if (data.strategy !== 'parallel' || !main_core.Type.isNumber(data.partSize) || !main_core.Type.isNumber(data.partCount)) {
				this.emit('onError', {
					error: createCloudError('STRATEGY_MISMATCH')
				});
				return;
			}
			this.#partSize = data.partSize;
			this.#partCount = data.partCount;
			if (this.#partCount <= 1) {
				this.emit('onError', {
					error: new UploaderError('SERVER_ERROR')
				});
				return;
			}
			this.#scheduleRestParts();
		}
		#scheduleRestParts() {
			const queue = [];
			for (let partNo = 2; partNo <= this.#partCount; partNo++) {
				queue.push(partNo);
			}
			runConcurrentPool({
				items: queue,
				maxConcurrency: this.getServer().getMaxParallelChunks(),
				isAborted: () => this.#aborted,
				task: partNo => this.#uploadPart(partNo),
				onItemDone: (_partNo, data) => {
					if (data && data.file) {
						this.#fileInfo = data.file;
					}
				},
				onAllDone: () => this.#onAllPartsDone(),
				onError: (_partNo, error) => {
					this.abort();
					this.emit('onError', {
						error
					});
				}
			});
		}
		#uploadPart(partNo) {
			const file = this.#file;
			const totalSize = file.getSize();
			const startOffset = (partNo - 1) * this.#partSize;
			const endOffset = Math.min(startOffset + this.#partSize, totalSize);
			const partBlob = file.getBinary().slice(startOffset, endOffset);
			const partSize = partBlob.size;
			const fileName = normalizeFileName(file.getName());
			const type = main_core.Type.isStringFilled(file.getType()) ? file.getType() : 'application/octet-stream';
			const retryDelays = [...this.getServer().getChunkRetryDelays()];
			const headers = [{
				name: 'Content-Type',
				value: type
			}, {
				name: 'X-Upload-Content-Name',
				value: encodeURIComponent(fileName)
			}, {
				name: 'Content-Range',
				value: `bytes ${startOffset}-${endOffset - 1}/${totalSize}`
			}];
			return new Promise((resolve, reject) => {
				const attempt = () => {
					if (this.#aborted) {
						reject(new UploaderError('FILE_UPLOAD_ABORTED'));
						return;
					}
					let xhr = null;
					main_core.ajax.runAction('ui.fileuploader.uploadPart', {
						headers,
						data: partBlob,
						preparePost: false,
						getParameters: {
							controller: this.getServer().getController(),
							controllerOptions: getControllerOptionsJSON(this.getServer()),
							token: this.#token,
							partNo
						},
						onrequeststart: req => {
							xhr = req;
							this.#activeXhrs.add(req);
						},
						onprogressupload: event => {
							this.#onPartProgress(partNo, event, partSize);
						}
					}).then(response => {
						this.#forgetXhr(xhr);
						if (this.#aborted) {
							reject(new UploaderError('FILE_UPLOAD_ABORTED'));
							return;
						}
						this.#partProgress.delete(partNo);
						this.#failedParts.delete(partNo);
						this.#completedSize += partSize;
						this.#emitProgress();
						resolve(response.data);
					}).catch(response => {
						this.#forgetXhr(xhr);
						if (this.#aborted) {
							reject(new UploaderError('FILE_UPLOAD_ABORTED'));
							return;
						}
						const error = UploaderError.createFromAjaxErrors(response.errors);
						const shouldRetry = error.getCode() === 'NETWORK_ERROR' || error.getType() === UploaderError.Type.UNKNOWN;
						if (shouldRetry && retryDelays.length > 0) {
							this.#failedParts.add(partNo);
							this.#partProgress.set(partNo, 0);
							this.#emitProgress();
							const delay = retryDelays.shift();
							const id = setTimeout(() => {
								this.#pendingTimeouts.delete(id);
								attempt();
							}, delay);
							this.#pendingTimeouts.add(id);
						} else {
							reject(error);
						}
					});
				};
				attempt();
			});
		}
		#onPartProgress(partNo, event, partSize) {
			if (!event.lengthComputable || this.#failedParts.has(partNo)) {
				return;
			}
			this.#partProgress.set(partNo, Math.min(event.loaded, partSize));
			this.#emitProgress();
		}
		#emitProgress() {
			const totalSize = this.#file.getSize();
			let uploaded = this.#completedSize;
			for (const v of this.#partProgress.values()) {
				uploaded += v;
			}
			const progress = totalSize > 0 ? Math.floor(uploaded / totalSize * 100) : 100;
			this.emit('onProgress', {
				progress: Math.min(progress, 100)
			});
		}
		#onAllPartsDone() {
			if (this.#aborted) {
				return;
			}
			this.emit('onProgress', {
				progress: 100
			});
			if (this.#fileInfo) {
				this.emit('onUpload', {
					fileInfo: this.#fileInfo
				});
				return;
			}
			this.#fetchStatusAndFinish();
		}
		#fetchStatusAndFinish() {
			main_core.ajax.runAction('ui.fileuploader.getStatus', {
				getParameters: {
					controller: this.getServer().getController(),
					controllerOptions: getControllerOptionsJSON(this.getServer()),
					token: this.#token
				}
			}).then(response => {
				if (this.#aborted) {
					return;
				}
				if (response.data && response.data.done && response.data.file) {
					this.emit('onUpload', {
						fileInfo: response.data.file
					});
				} else {
					this.emit('onError', {
						error: createCloudError('FINALIZATION_NOT_READY')
					});
				}
			}).catch(response => {
				if (this.#aborted) {
					return;
				}
				const error = UploaderError.createFromAjaxErrors(response.errors);
				this.emit('onError', {
					error
				});
			});
		}
		#forgetXhr(xhr) {
			if (xhr) {
				this.#activeXhrs.delete(xhr);
			}
		}
	}

	function relayUploadEvents(source, target) {
		source.subscribe('onProgress', event => target.emit('onProgress', event.getData()));
		source.subscribeOnce('onUpload', event => target.emit('onUpload', event.getData()));
		source.subscribeOnce('onError', event => target.emit('onError', event.getData()));
	}

	const RETRIABLE_ERROR_CODES = new Set(['NETWORK_ERROR', 'EXPIRED_URL', 'S3_ERROR']);
	const FINALIZE_RETRIABLE_ERROR_CODES = new Set(['NETWORK_ERROR', 'CLOUD_FINISH_UPLOAD_FAILED', 'FINALIZATION_IN_PROGRESS']);
	class PresignedUploadController extends AbstractUploadController {
		#file = null;
		#token = null;
		#partSize = null;
		#partCount = null;
		#activeXhrs = new Set();
		#pendingTimeouts = new Set();
		#pendingWaitRejects = new Set();
		#aborted = false;
		#fellBack = false;
		#fallbackController = null;
		#urlCache = new Map();
		#partETags = new Map();
		#registeredParts = new Set();
		#flushTimerId = null;
		#flushing = false;
		#completedSize = 0;
		#partProgress = new Map();
		#failedParts = new Set();
		constructor(server, options = {}) {
			super(server, options);
		}
		upload(file) {
			if (!main_core.Type.isFile(file.getBinary())) {
				this.emit('onError', {
					error: new UploaderError('WRONG_FILE_SOURCE')
				});
				return;
			}
			if (this.#file !== null) {
				return;
			}
			this.#file = file;
			this.#initSession();
		}
		abort() {
			this.#aborted = true;
			this.#cancelTransfers();
			if (this.#fallbackController) {
				this.#fallbackController.abort();
			}
		}
		#isStopped() {
			return this.#aborted || this.#fellBack;
		}
		#cancelTransfers() {
			for (const xhr of this.#activeXhrs) {
				xhr.abort();
			}
			this.#activeXhrs.clear();
			for (const id of this.#pendingTimeouts) {
				clearTimeout(id);
			}
			this.#pendingTimeouts.clear();
			for (const reject of this.#pendingWaitRejects) {
				reject(new UploaderError('FILE_UPLOAD_ABORTED'));
			}
			this.#pendingWaitRejects.clear();
		}
		#fallBackToBackend() {
			if (this.#isStopped()) {
				return;
			}
			this.#fellBack = true;
			this.#cancelTransfers();
			this.#file?.setServerFileId(null);
			this.#delegateToFallback();
		}
		#initSession() {
			const file = this.#file;
			const fileName = normalizeFileName(file.getName());
			const type = main_core.Type.isStringFilled(file.getType()) ? file.getType() : 'application/octet-stream';
			const data = {
				name: fileName,
				size: file.getSize(),
				type
			};
			const requestedPartSize = this.getServer().getChunkSize();
			if (main_core.Type.isNumber(requestedPartSize) && requestedPartSize > 0) {
				data.partSize = requestedPartSize;
			}
			const width = file.getWidth();
			if (main_core.Type.isNumber(width) && width > 0) {
				data.width = width;
			}
			const height = file.getHeight();
			if (main_core.Type.isNumber(height) && height > 0) {
				data.height = height;
			}
			main_core.ajax.runAction('ui.fileuploader.initPresigned', {
				getParameters: {
					controller: this.getServer().getController(),
					controllerOptions: getControllerOptionsJSON(this.getServer())
				},
				data
			}).then(response => {
				if (this.#aborted) {
					return;
				}
				this.#onInitComplete(response.data);
			}).catch(response => {
				if (this.#aborted) {
					return;
				}
				const error = UploaderError.createFromAjaxErrors(response.errors);
				if (error.getCode() === 'PRESIGNED_UNSUPPORTED') {
					this.#delegateToFallback();
					return;
				}
				this.emit('onError', {
					error
				});
			});
		}
		#delegateToFallback() {
			const server = this.getServer();
			const fallback = server.isParallelChunkUploadEnabled() ? new ParallelUploadController(server, this.getOptions()) : new UploadController(server, this.getOptions());
			this.#delegateTo(fallback);
		}
		#delegateTo(fallback) {
			if (this.#aborted) {
				return;
			}
			this.#fallbackController = fallback;
			relayUploadEvents(fallback, this);
			fallback.upload(this.#file);
		}
		#onInitComplete(data) {
			if (!data || !data.token || data.strategy !== 'presigned' || !main_core.Type.isNumber(data.partSize) || !main_core.Type.isNumber(data.partCount)) {
				this.emit('onError', {
					error: new UploaderError('SERVER_ERROR')
				});
				return;
			}
			this.#token = data.token;
			this.#partSize = data.partSize;
			this.#partCount = data.partCount;
			this.#file?.setServerFileId(data.token);
			if (Array.isArray(data.parts)) {
				for (const entry of data.parts) {
					if (main_core.Type.isNumber(entry.partNo) && main_core.Type.isStringFilled(entry.url)) {
						this.#urlCache.set(entry.partNo, entry.url);
					}
				}
			}
			this.#scheduleParts();
		}
		#scheduleParts() {
			const queue = [];
			for (let partNo = 1; partNo <= this.#partCount; partNo++) {
				queue.push(partNo);
			}
			runConcurrentPool({
				items: queue,
				maxConcurrency: this.getServer().getMaxParallelChunks(),
				isAborted: () => this.#isStopped(),
				task: partNo => this.#uploadAndRegister(partNo),
				onAllDone: () => this.#finalize(),
				onError: (_partNo, error) => {
					if (this.#isStopped() || error instanceof UploaderError && error.getCode() === 'FILE_UPLOAD_ABORTED') {
						return;
					}
					if (this.#partETags.size === 0) {
						this.#fallBackToBackend();
						return;
					}
					this.abort();
					this.emit('onError', {
						error
					});
				}
			});
		}
		async #uploadAndRegister(partNo) {
			const blob = this.#sliceForPart(partNo);
			const retryDelays = [...this.getServer().getChunkRetryDelays()];
			while (true) {
				if (this.#isStopped()) {
					throw new UploaderError('FILE_UPLOAD_ABORTED');
				}
				const url = await this.#getUrlForPart(partNo);
				try {
					const etag = await this.#putBlobToCloud(url, blob, partNo);
					this.#partETags.set(partNo, etag);
					this.#partProgress.delete(partNo);
					this.#failedParts.delete(partNo);
					this.#completedSize += blob.size;
					this.#urlCache.delete(partNo);
					this.#emitProgress();
					this.#scheduleRegisterFlush();
					return;
				} catch (error) {
					if (this.#isStopped()) {
						throw error;
					}
					if (!(error instanceof UploaderError) || retryDelays.length === 0) {
						throw error;
					}
					if (!RETRIABLE_ERROR_CODES.has(error.getCode() ?? '')) {
						throw error;
					}
					this.#urlCache.delete(partNo);
					this.#failedParts.add(partNo);
					this.#partProgress.set(partNo, 0);
					this.#emitProgress();
					await this.#wait(retryDelays.shift());
				}
			}
		}
		async #getUrlForPart(partNo) {
			const cached = this.#urlCache.get(partNo);
			if (main_core.Type.isStringFilled(cached)) {
				return cached;
			}
			const urls = await this.#fetchUrlsFromServer([partNo]);
			const url = urls.get(partNo);
			if (!main_core.Type.isStringFilled(url)) {
				throw createCloudError('PRESIGNED_URL_FAILED', {
					partNo
				});
			}
			return url;
		}
		#fetchUrlsFromServer(partNumbers) {
			return main_core.ajax.runAction('ui.fileuploader.refreshPresigned', {
				getParameters: {
					controller: this.getServer().getController(),
					controllerOptions: getControllerOptionsJSON(this.getServer())
				},
				data: {
					token: this.#token,
					partNumbers
				}
			}).then(response => {
				const parts = response.data && response.data.parts || [];
				const result = new Map();
				for (const entry of parts) {
					const partNo = Number(entry.partNo);
					if (main_core.Type.isStringFilled(entry.url)) {
						this.#urlCache.set(partNo, entry.url);
						result.set(partNo, entry.url);
					}
				}
				return result;
			}).catch(response => {
				throw UploaderError.createFromAjaxErrors(response.errors);
			});
		}
		#putBlobToCloud(url, blob, partNo) {
			return new Promise((resolve, reject) => {
				if (this.#isStopped()) {
					reject(new UploaderError('FILE_UPLOAD_ABORTED'));
					return;
				}
				const xhr = new XMLHttpRequest();
				xhr.open('PUT', url, true);
				xhr.upload.onprogress = event => {
					if (event.lengthComputable && !this.#failedParts.has(partNo)) {
						this.#partProgress.set(partNo, Math.min(event.loaded, blob.size));
						this.#emitProgress();
					}
				};
				xhr.onload = () => {
					this.#activeXhrs.delete(xhr);
					if (xhr.status >= 200 && xhr.status < 300) {
						const etag = xhr.getResponseHeader('ETag');
						if (!main_core.Type.isStringFilled(etag)) {
							reject(createCloudError('INVALID_ETAG', {
								partNo
							}));
							return;
						}
						resolve(etag);
					} else if (xhr.status === 403 && /ExpiredToken|AccessDenied/.test(xhr.responseText || '')) {
						reject(createCloudError('EXPIRED_URL', {
							partNo
						}));
					} else {
						reject(createCloudError('S3_ERROR', {
							partNo,
							status: xhr.status
						}));
					}
				};
				xhr.onerror = () => {
					this.#activeXhrs.delete(xhr);
					reject(new UploaderError('NETWORK_ERROR'));
				};
				xhr.onabort = () => {
					this.#activeXhrs.delete(xhr);
					reject(new UploaderError('FILE_UPLOAD_ABORTED'));
				};
				this.#activeXhrs.add(xhr);
				xhr.send(blob);
			});
		}
		#scheduleRegisterFlush() {
			const interval = this.getServer().getPresignedRegisterInterval();
			if (interval <= 0 || this.#flushTimerId !== null || this.#isStopped()) {
				return;
			}
			const id = setTimeout(() => {
				this.#pendingTimeouts.delete(id);
				this.#flushTimerId = null;
				this.#flushRegistrations();
			}, interval);
			this.#pendingTimeouts.add(id);
			this.#flushTimerId = id;
		}
		#flushRegistrations() {
			if (this.#isStopped() || this.#flushing) {
				return;
			}
			const parts = this.#collectUnregisteredParts();
			if (parts.length === 0) {
				return;
			}
			this.#flushing = true;
			main_core.ajax.runAction('ui.fileuploader.registerParts', {
				getParameters: {
					controller: this.getServer().getController(),
					controllerOptions: getControllerOptionsJSON(this.getServer())
				},
				data: {
					token: this.#token,
					parts
				}
			}).then(() => {
				this.#flushing = false;
				for (const {
					partNo
				} of parts) {
					this.#registeredParts.add(partNo);
				}
				this.#scheduleRegisterFlush();
			}).catch(() => {
				this.#flushing = false;
			});
		}
		#collectUnregisteredParts() {
			const parts = [];
			this.#partETags.forEach((etag, partNo) => {
				if (!this.#registeredParts.has(partNo)) {
					parts.push({
						partNo,
						etag
					});
				}
			});
			return parts;
		}
		#finalize() {
			if (this.#aborted) {
				return;
			}
			if (this.#flushTimerId !== null) {
				clearTimeout(this.#flushTimerId);
				this.#pendingTimeouts.delete(this.#flushTimerId);
				this.#flushTimerId = null;
			}
			const retryDelays = [...this.getServer().getChunkRetryDelays()];
			const attempt = () => {
				const parts = this.#collectUnregisteredParts();
				main_core.ajax.runAction('ui.fileuploader.completePresigned', {
					getParameters: {
						controller: this.getServer().getController(),
						controllerOptions: getControllerOptionsJSON(this.getServer())
					},
					data: {
						token: this.#token,
						parts
					}
				}).then(response => {
					if (this.#aborted) {
						return;
					}
					const fileInfo = response.data && response.data.file;
					if (fileInfo) {
						this.emit('onProgress', {
							progress: 100
						});
						this.emit('onUpload', {
							fileInfo
						});
					} else {
						this.emit('onError', {
							error: createCloudError('FINALIZATION_NOT_READY')
						});
					}
				}).catch(response => {
					if (this.#aborted) {
						return;
					}
					const error = UploaderError.createFromAjaxErrors(response.errors);
					if (FINALIZE_RETRIABLE_ERROR_CODES.has(error.getCode() ?? '') && retryDelays.length > 0) {
						const id = setTimeout(() => {
							this.#pendingTimeouts.delete(id);
							attempt();
						}, retryDelays.shift());
						this.#pendingTimeouts.add(id);
						return;
					}
					this.emit('onError', {
						error
					});
				});
			};
			attempt();
		}
		#emitProgress() {
			const totalSize = this.#file.getSize();
			let uploaded = this.#completedSize;
			for (const v of this.#partProgress.values()) {
				uploaded += v;
			}
			const progress = totalSize > 0 ? Math.floor(uploaded / totalSize * 100) : 100;
			this.emit('onProgress', {
				progress: Math.min(progress, 99)
			});
		}
		#sliceForPart(partNo) {
			const file = this.#file;
			const partSize = this.#partSize;
			const startOffset = (partNo - 1) * partSize;
			const endOffset = Math.min(startOffset + partSize, file.getSize());
			const binary = file.getBinary();
			if (startOffset === 0 && endOffset === file.getSize()) {
				return binary;
			}
			return binary.slice(startOffset, endOffset);
		}
		#wait(ms) {
			return new Promise((resolve, reject) => {
				this.#pendingWaitRejects.add(reject);
				const id = setTimeout(() => {
					this.#pendingTimeouts.delete(id);
					this.#pendingWaitRejects.delete(reject);
					resolve();
				}, ms);
				this.#pendingTimeouts.add(id);
			});
		}
	}

	const pendingQueues = new WeakMap();
	const loadingFiles = new WeakMap();
	function loadMultiple(controller, file) {
		const server = controller.getServer();
		const timeout = controller.getOption('timeout', 100);
		let queue = pendingQueues.get(server);
		if (!queue) {
			queue = {
				tasks: [],
				load: main_core.Runtime.debounce(loadInternal, timeout, server),
				xhr: null,
				aborted: false
			};
			pendingQueues.set(server, queue);
		}
		queue.tasks.push({
			controller,
			file
		});
		queue.load();
	}
	function abort(controller, file) {
		const server = controller.getServer();
		const queue = pendingQueues.get(server);
		if (queue) {
			queue.tasks = queue.tasks.filter(task => {
				return task.file !== file;
			});
			if (queue.tasks.length === 0) {
				pendingQueues.delete(server);
			}
		} else {
			const loadingQueue = loadingFiles.get(file);
			if (loadingQueue) {
				loadingQueue.tasks = loadingQueue.tasks.filter(task => {
					return task.file !== file;
				});
				loadingFiles.delete(file);
				if (loadingQueue.tasks.length === 0) {
					loadingQueue.aborted = true;
					loadingQueue.xhr.abort();
				}
			}
		}
	}
	function loadInternal() {
		const server = this;
		const queue = pendingQueues.get(server);
		if (!queue) {
			return;
		}
		pendingQueues.delete(server);
		if (queue.tasks.length === 0) {
			return;
		}
		const fileIds = [];
		queue.tasks.forEach(task => {
			const file = task.file;
			fileIds.push(file.getServerFileId());
			loadingFiles.set(file, queue);
		});
		main_core.ajax.runAction('ui.fileuploader.load', {
			data: {
				fileIds
			},
			getParameters: {
				controller: server.getController(),
				controllerOptions: getControllerOptionsJSON(server)
			},
			onrequeststart: xhr => {
				queue.xhr = xhr;
			},
			onprogress: event => {
				if (event.lengthComputable) {
					const progress = event.total > 0 ? Math.floor(event.loaded / event.total * 100) : 100;
					queue.tasks.forEach(task => {
						const {
							controller
						} = task;
						controller.emit('onProgress', {
							progress
						});
					});
				}
			}
		}).then(response => {
			if (response.data?.files) {
				const fileResults = {};
				response.data.files.forEach(fileResult => {
					fileResults[fileResult.id] = fileResult;
				});
				queue.tasks.forEach(task => {
					const {
						controller,
						file
					} = task;
					const fileResult = fileResults[file.getServerFileId()] || null;
					loadingFiles.delete(file);
					if (fileResult && fileResult.success) {
						controller.emit('onProgress', {
							progress: 100
						});
						controller.emit('onLoad', {
							fileInfo: fileResult.data.file
						});
					} else {
						const error = UploaderError.createFromAjaxErrors(fileResult?.errors);
						controller.emit('onError', {
							error
						});
					}
				});
			} else {
				const error = new UploaderError('SERVER_ERROR');
				queue.tasks.forEach(task => {
					const {
						controller,
						file
					} = task;
					loadingFiles.delete(file);
					controller.emit('onError', {
						error: error.clone()
					});
				});
			}
		}).catch(response => {
			const error = queue.aborted ? null : UploaderError.createFromAjaxErrors(response.errors);
			queue.tasks.forEach(task => {
				const {
					controller,
					file
				} = task;
				loadingFiles.delete(file);
				if (!queue.aborted) {
					controller.emit('onError', {
						error: error.clone()
					});
				}
			});
		});
	}

	class ServerLoadController extends AbstractLoadController {
		#file = null;
		constructor(server, options = {}) {
			super(server, options);
		}
		load(file) {
			if (this.getServer().getController()) {
				this.#file = file;
				loadMultiple(this, file);
			} else {
				this.emit('onProgress', {
					progress: 100
				});
				this.emit('onLoad', {
					fileInfo: null
				});
			}
		}
		abort() {
			if (this.getServer().getController() && this.#file) {
				abort(this, this.#file);
			}
		}
	}

	class ClientLoadController extends AbstractLoadController {
		constructor(server, options = {}) {
			super(server, options);
		}
		load(file) {
			if (main_core.Type.isFile(file.getBinary())) {
				this.emit('onProgress', {
					progress: 100
				});
				this.emit('onLoad', {
					fileInfo: file
				});
			} else {
				this.emit('onError', {
					error: new UploaderError('WRONG_FILE_SOURCE')
				});
			}
		}
		abort() {
		}
	}

	const queues = new WeakMap();
	function removeMultiple(controller, file) {
		const server = controller.getServer();
		let queue = queues.get(server);
		if (!queue) {
			queue = {
				tasks: [],
				remove: main_core.Runtime.debounce(removeInternal, 1000, server),
				xhr: null
			};
			queues.set(server, queue);
		}
		queue.tasks.push({
			controller,
			file
		});
		queue.remove();
	}
	function removeInternal() {
		const server = this;
		const queue = queues.get(server);
		if (!queue) {
			return;
		}
		const {
			tasks
		} = queue;
		queues.delete(server);
		const fileIds = [];
		tasks.forEach(task => {
			const file = task.file;
			const serverFileId = file.getServerFileId();
			if (serverFileId !== null) {
				fileIds.push(serverFileId);
			}
		});
		if (fileIds.length === 0) {
			return;
		}
		main_core.ajax.runAction('ui.fileuploader.remove', {
			data: {
				fileIds
			},
			getParameters: {
				controller: server.getController(),
				controllerOptions: getControllerOptionsJSON(server)
			},
			onrequeststart: xhr => {
				queue.xhr = xhr;
			}
		}).then(response => {
			if (response.data?.files) {
				const fileResults = {};
				response.data.files.forEach(fileResult => {
					fileResults[fileResult.id] = fileResult;
				});
				tasks.forEach(task => {
					const {
						controller,
						file
					} = task;
					const serverFileId = file.getServerFileId();
					const fileResult = (serverFileId === null ? null : fileResults[serverFileId]) || null;
					if (fileResult && fileResult.success) {
						controller.emit('onRemove', {
							fileId: fileResult.id
						});
					} else {
						const error = UploaderError.createFromAjaxErrors(fileResult?.errors);
						controller.emit('onError', {
							error
						});
					}
				});
			} else {
				const error = new UploaderError('SERVER_ERROR');
				tasks.forEach(task => {
					const {
						controller
					} = task;
					controller.emit('onError', {
						error: error.clone()
					});
				});
			}
		}).catch(response => {
			const error = UploaderError.createFromAjaxErrors(response.errors);
			tasks.forEach(task => {
				const {
					controller
				} = task;
				controller.emit('onError', {
					error: error.clone()
				});
			});
		});
	}

	class RemoveController extends AbstractRemoveController {
		remove(file) {
			removeMultiple(this, file);
		}
	}

	class ServerlessLoadController extends AbstractLoadController {
		constructor(server, options = {}) {
			super(server, options);
		}
		load(file) {
			if (main_core.Type.isStringFilled(file.getName())) {
				this.emit('onProgress', {
					progress: 100
				});
				this.emit('onLoad', {
					fileInfo: file
				});
			} else {
				this.emit('onError', {
					error: new UploaderError('WRONG_FILE_SOURCE')
				});
			}
		}
		abort() {
		}
	}

	class Server {
		#controller = null;
		#controllerOptions = null;
		#uploadControllerClass = null;
		#uploadControllerOptions = {};
		#loadControllerClass = null;
		#loadControllerOptions = {};
		#removeControllerClass = null;
		#removeControllerOptions = {};
		#chunkSize = null;
		#defaultChunkSize = null;
		#chunkMinSize = null;
		#chunkMaxSize = null;
		#chunkRetryDelays = [1000, 3000, 6000];
		#parallelChunkUpload = false;
		#maxParallelChunks = 2;
		#presignedChunkUpload = false;
		#presignedThreshold = null;
		#presignedRegisterInterval = 15000;
		constructor(serverOptions) {
			const options = main_core.Type.isPlainObject(serverOptions) ? serverOptions : {};
			this.#controller = main_core.Type.isStringFilled(options.controller) ? options.controller : null;
			this.#controllerOptions = main_core.Type.isPlainObject(options.controllerOptions) ? options.controllerOptions : null;
			const chunkSize = main_core.Type.isNumber(options.chunkSize) && options.chunkSize > 0 ? options.chunkSize : this.getDefaultChunkSize();
			this.#chunkSize = options.forceChunkSize === true ? chunkSize : this.#calcChunkSize(chunkSize);
			const settings = main_core.Extension.getSettings('ui.uploader.core');
			this.#parallelChunkUpload = main_core.Type.isBoolean(options.parallelChunkUpload) ? options.parallelChunkUpload : settings.get('parallelChunkUpload', false);
			const maxParallelChunks = main_core.Type.isNumber(options.maxParallelChunks) && options.maxParallelChunks > 0 ? options.maxParallelChunks : settings.get('maxParallelChunks', 2);
			this.#maxParallelChunks = Math.max(1, maxParallelChunks);
			this.#presignedChunkUpload = main_core.Type.isBoolean(options.presignedChunkUpload) ? options.presignedChunkUpload : settings.get('presignedChunkUpload', false);
			const presignedThreshold = main_core.Type.isNumber(options.presignedThreshold) ? options.presignedThreshold : settings.get('presignedThreshold', null);
			this.#presignedThreshold = main_core.Type.isNumber(presignedThreshold) && presignedThreshold > 0 ? presignedThreshold : null;
			const registerInterval = main_core.Type.isNumber(options.presignedRegisterInterval) ? options.presignedRegisterInterval : settings.get('presignedRegisterInterval', null);
			this.#presignedRegisterInterval = main_core.Type.isNumber(registerInterval) ? Math.max(0, registerInterval) : this.#presignedRegisterInterval;
			const chunkRetryDelays = options.chunkRetryDelays;
			if (chunkRetryDelays === false || chunkRetryDelays === null) {
				this.#chunkRetryDelays = [];
			} else if (main_core.Type.isArray(chunkRetryDelays)) {
				this.#chunkRetryDelays = chunkRetryDelays;
			}
			const controllerClasses = ['uploadControllerClass', 'loadControllerClass', 'removeControllerClass'];
			controllerClasses.forEach(controllerClass => {
				let fn = null;
				const option = options[controllerClass];
				if (main_core.Type.isStringFilled(option)) {
					fn = main_core.Reflection.getClass(option);
					if (!main_core.Type.isFunction(fn)) {
						throw new TypeError(`Uploader.Server: "${controllerClass}" must be a function.`);
					}
				} else if (main_core.Type.isFunction(option)) {
					fn = option;
				}
				switch (controllerClass) {
					case 'uploadControllerClass':
						this.#uploadControllerClass = fn;
						break;
					case 'loadControllerClass':
						this.#loadControllerClass = fn;
						break;
					case 'removeControllerClass':
						this.#removeControllerClass = fn;
						break;
				}
			});
			this.#loadControllerOptions = main_core.Type.isPlainObject(options.loadControllerOptions) ? options.loadControllerOptions : {};
			this.#uploadControllerOptions = main_core.Type.isPlainObject(options.uploadControllerOptions) ? options.uploadControllerOptions : {};
			this.#removeControllerOptions = main_core.Type.isPlainObject(options.removeControllerOptions) ? options.removeControllerOptions : {};
		}
		canCreateUploadController() {
			return this.#uploadControllerClass !== null || main_core.Type.isStringFilled(this.#controller);
		}
		createUploadController(file = null) {
			if (!this.canCreateUploadController()) {
				return null;
			}
			if (this.#uploadControllerClass) {
				const controller = new this.#uploadControllerClass(this, this.#uploadControllerOptions ?? {});
				if (!(controller instanceof AbstractUploadController)) {
					throw new TypeError('Uploader.Server: "uploadControllerClass" must be an instance of AbstractUploadController.');
				}
				return controller;
			}
			if (file === null) {
				return new UploadController(this, this.#uploadControllerOptions ?? {});
			}
			const fileSize = file.getSize();
			const isMultiChunk = fileSize > this.getChunkSize();
			const qualifiesForPresigned = this.#presignedThreshold === null ? isMultiChunk : fileSize >= this.#presignedThreshold;
			if (this.isPresignedChunkUploadEnabled() && qualifiesForPresigned && !file.isImage()) {
				return new PresignedUploadController(this, this.#uploadControllerOptions ?? {});
			}
			if (isMultiChunk && this.isParallelChunkUploadEnabled()) {
				return new ParallelUploadController(this, this.#uploadControllerOptions ?? {});
			}
			return new UploadController(this, this.#uploadControllerOptions ?? {});
		}
		createServerLoadController() {
			if (this.#loadControllerClass) {
				const controller = new this.#loadControllerClass(this, this.#loadControllerOptions ?? {});
				if (!(controller instanceof AbstractLoadController)) {
					throw new TypeError('Uploader.Server: "loadControllerClass" must be an instance of AbstractLoadController.');
				}
				return controller;
			}
			return this.createDefaultServerLoadController();
		}
		createDefaultServerLoadController() {
			return new ServerLoadController(this, this.#loadControllerOptions ?? {});
		}
		createClientLoadController() {
			return new ClientLoadController(this, this.#loadControllerOptions ?? {});
		}
		createServerlessLoadController() {
			return new ServerlessLoadController(this, this.#loadControllerOptions ?? {});
		}
		createRemoveController() {
			if (this.#removeControllerClass) {
				const controller = new this.#removeControllerClass(this, this.#removeControllerOptions ?? {});
				if (!(controller instanceof AbstractRemoveController)) {
					throw new TypeError('Uploader.Server: "removeControllerClass" must be an instance of AbstractRemoveController.');
				}
				return controller;
			}
			if (main_core.Type.isStringFilled(this.#controller)) {
				return new RemoveController(this, this.#removeControllerOptions ?? {});
			}
			return null;
		}
		getController() {
			return this.#controller;
		}
		getControllerOptions() {
			return this.#controllerOptions;
		}
		getChunkSize() {
			return this.#chunkSize;
		}
		getDefaultChunkSize() {
			if (this.#defaultChunkSize === null) {
				const settings = main_core.Extension.getSettings('ui.uploader.core');
				this.#defaultChunkSize = settings.get('defaultChunkSize', 5 * 1024 * 1024);
			}
			return this.#defaultChunkSize;
		}
		getChunkMinSize() {
			if (this.#chunkMinSize === null) {
				const settings = main_core.Extension.getSettings('ui.uploader.core');
				this.#chunkMinSize = settings.get('chunkMinSize', 1024 * 1024);
			}
			return this.#chunkMinSize;
		}
		getChunkMaxSize() {
			if (this.#chunkMaxSize === null) {
				const settings = main_core.Extension.getSettings('ui.uploader.core');
				this.#chunkMaxSize = settings.get('chunkMaxSize', 5 * 1024 * 1024);
			}
			return this.#chunkMaxSize;
		}
		getChunkRetryDelays() {
			return this.#chunkRetryDelays;
		}
		isParallelChunkUploadEnabled() {
			return this.#parallelChunkUpload;
		}
		getMaxParallelChunks() {
			return this.#maxParallelChunks;
		}
		isPresignedChunkUploadEnabled() {
			return this.#presignedChunkUpload;
		}
		getPresignedThreshold() {
			return this.#presignedThreshold;
		}
		getPresignedRegisterInterval() {
			return this.#presignedRegisterInterval;
		}
		#calcChunkSize(chunkSize) {
			return Math.min(Math.max(this.getChunkMinSize(), chunkSize), this.getChunkMaxSize());
		}
	}

	class Filter {
		#uploader;
		constructor(uploader, filterOptions = {}) {
			this.#uploader = uploader;
		}
		getUploader() {
			return this.#uploader;
		}
		apply(...args) {
			throw new Error('You must implement apply() method.');
		}
	}

	class FileSizeFilter extends Filter {
		#maxFileSize = 256 * 1024 * 1024;
		#minFileSize = 0;
		#maxTotalFileSize = null;
		#imageMaxFileSize = 48 * 1024 * 1024;
		#imageMinFileSize = 0;
		#treatOversizeImageAsFile = false;
		constructor(uploader, filterOptions = {}) {
			super(uploader);
			const settings = main_core.Extension.getSettings('ui.uploader.core');
			this.#maxFileSize = settings.get('maxFileSize', this.#maxFileSize);
			this.#minFileSize = settings.get('minFileSize', this.#minFileSize);
			this.#maxTotalFileSize = settings.get('maxTotalFileSize', this.#maxTotalFileSize);
			this.#imageMaxFileSize = settings.get('imageMaxFileSize', this.#imageMaxFileSize);
			this.#imageMinFileSize = settings.get('imageMinFileSize', this.#imageMinFileSize);
			const options = main_core.Type.isPlainObject(filterOptions) ? filterOptions : {};
			this.setMaxFileSize(options.maxFileSize);
			this.setMinFileSize(options.minFileSize);
			this.setMaxTotalFileSize(options.maxTotalFileSize);
			this.setImageMaxFileSize(options.imageMaxFileSize);
			this.setImageMinFileSize(options.imageMinFileSize);
			this.setTreatOversizeImageAsFile(options.treatOversizeImageAsFile);
		}
		apply(file) {
			return new Promise((resolve, reject) => {
				if (this.getMaxFileSize() !== null && file.getSize() > this.getMaxFileSize()) {
					reject(new UploaderError('MAX_FILE_SIZE_EXCEEDED', {
						maxFileSize: formatFileSize(this.getMaxFileSize()),
						maxFileSizeInBytes: this.getMaxFileSize()
					}));
					return;
				}
				if (file.getSize() < this.getMinFileSize()) {
					reject(new UploaderError('MIN_FILE_SIZE_EXCEEDED', {
						minFileSize: formatFileSize(this.getMinFileSize()),
						minFileSizeInBytes: this.getMinFileSize()
					}));
					return;
				}
				if (isResizableImage(file.getName(), file.getType())) {
					if (this.getImageMaxFileSize() !== null && file.getSize() > this.getImageMaxFileSize()) {
						if (this.shouldTreatOversizeImageAsFile()) {
							file.setTreatImageAsFile(true);
						} else {
							reject(new UploaderError('IMAGE_MAX_FILE_SIZE_EXCEEDED', {
								imageMaxFileSize: formatFileSize(this.getImageMaxFileSize()),
								imageMaxFileSizeInBytes: this.getImageMaxFileSize()
							}));
							return;
						}
					}
					if (file.getSize() < this.getImageMinFileSize()) {
						if (this.shouldTreatOversizeImageAsFile()) {
							file.setTreatImageAsFile(true);
						} else {
							reject(new UploaderError('IMAGE_MIN_FILE_SIZE_EXCEEDED', {
								imageMinFileSize: formatFileSize(this.getImageMinFileSize()),
								imageMinFileSizeInBytes: this.getImageMinFileSize()
							}));
							return;
						}
					}
				}
				if (this.getMaxTotalFileSize() !== null && this.getUploader().getTotalSize() > this.getMaxTotalFileSize()) {
					reject(new UploaderError('MAX_TOTAL_FILE_SIZE_EXCEEDED', {
						maxTotalFileSize: formatFileSize(this.getMaxTotalFileSize()),
						maxTotalFileSizeInBytes: this.getMaxTotalFileSize()
					}));
					return;
				}
				resolve();
			});
		}
		getMaxFileSize() {
			return this.#maxFileSize;
		}
		setMaxFileSize(value) {
			if (main_core.Type.isNumber(value) && value >= 0 || main_core.Type.isNull(value)) {
				this.#maxFileSize = value;
			}
		}
		getMinFileSize() {
			return this.#minFileSize;
		}
		setMinFileSize(value) {
			if (main_core.Type.isNumber(value) && value >= 0) {
				this.#minFileSize = value;
			}
		}
		getMaxTotalFileSize() {
			return this.#maxTotalFileSize;
		}
		setMaxTotalFileSize(value) {
			if (main_core.Type.isNumber(value) && value >= 0 || main_core.Type.isNull(value)) {
				this.#maxTotalFileSize = value;
			}
		}
		getImageMaxFileSize() {
			return this.#imageMaxFileSize;
		}
		setImageMaxFileSize(value) {
			if (main_core.Type.isNumber(value) && value >= 0 || main_core.Type.isNull(value)) {
				this.#imageMaxFileSize = value;
			}
		}
		getImageMinFileSize() {
			return this.#imageMinFileSize;
		}
		setImageMinFileSize(value) {
			if (main_core.Type.isNumber(value) && value >= 0) {
				this.#imageMinFileSize = value;
			}
		}
		setTreatOversizeImageAsFile(value) {
			if (main_core.Type.isBoolean(value)) {
				this.#treatOversizeImageAsFile = value;
			}
		}
		shouldTreatOversizeImageAsFile() {
			return this.#treatOversizeImageAsFile;
		}
	}

	const isValidFileType = (file, fileTypes) => {
		if (!main_core.Type.isArrayFilled(fileTypes)) {
			return true;
		}
		const mimeType = file.type;
		const baseMimeType = mimeType.replace(/\/.*$/, '');
		for (const fileType of fileTypes) {
			if (!main_core.Type.isStringFilled(fileType)) {
				continue;
			}
			const type = fileType.trim().toLowerCase();
			if (type.charAt(0) === '.')
				{
					if (file.name.toLowerCase().includes(type, file.name.length - type.length)) {
						return true;
					}
				} else if (/\/\*$/.test(type))
				{
					if (baseMimeType === type.replace(/\/.*$/, '')) {
						return true;
					}
				} else if (mimeType === type) {
				return true;
			}
		}
		return false;
	};

	class FileTypeFilter extends Filter {
		constructor(uploader, filterOptions = {}) {
			super(uploader);
		}
		apply(file) {
			return new Promise((resolve, reject) => {
				if (isValidFileType(file.getBinary(), this.getUploader().getAcceptedFileTypes())) {
					resolve();
				} else {
					reject(new UploaderError('FILE_TYPE_NOT_ALLOWED'));
				}
			});
		}
	}

	const getArrayBuffer = file => {
		if (file.arrayBuffer) {
			return file.arrayBuffer();
		}
		return new Promise((resolve, reject) => {
			const fileReader = new FileReader();
			fileReader.readAsArrayBuffer(file);
			fileReader.onload = () => {
				const buffer = fileReader.result;
				resolve(buffer);
			};
			fileReader.onerror = () => {
				reject(fileReader.error);
			};
		});
	};

	const convertStringToBuffer = str => {
		const result = [];
		for (let i = 0; i < str.length; i++) {
			result.push((str.codePointAt(i) ?? 0) & 0xFF);
		}
		return result;
	};

	const compareBuffers = (dataView, dest, start) => {
		for (let i = start, j = 0; j < dest.length;) {
			if (dataView.getUint8(i++) !== dest[j++]) {
				return false;
			}
		}
		return true;
	};

	const GIF87a = convertStringToBuffer('GIF87a');
	const GIF89a = convertStringToBuffer('GIF89a');
	class Gif {
		getSize(file) {
			return new Promise((resolve, reject) => {
				if (file.size < 10) {
					reject(new Error('GIF signature not found.'));
					return;
				}
				getArrayBuffer(file).then(buffer => {
					const view = new DataView(buffer);
					if (!compareBuffers(view, GIF87a, 0) && !compareBuffers(view, GIF89a, 0)) {
						reject(new Error('GIF signature not found.'));
						return;
					}
					let frames = 0;
					for (let i = 0, len = view.byteLength - 9; i < len && frames < 2; i++) {
						if (view.getUint8(i) === 0x00 && view.getUint8(i + 1) === 0x21 && view.getUint8(i + 2) === 0xF9 && view.getUint8(i + 3) === 0x04 && view.getUint8(i + 8) === 0x00 && (view.getUint8(i + 9) === 0x2C || view.getUint8(i + 9) === 0x21)) {
							frames++;
						}
					}
					const animated = frames > 1;
					resolve({
						width: view.getUint16(6, true),
						height: view.getUint16(8, true),
						animated
					});
				}).catch(error => {
					reject(error);
				});
			});
		}
	}

	const PNG_SIGNATURE = convertStringToBuffer('\x89PNG\r\n\x1A\n');
	const IHDR_SIGNATURE = convertStringToBuffer('IHDR');
	const FRIED_CHUNK_NAME = convertStringToBuffer('CgBI');
	class Png {
		getSize(file) {
			return new Promise((resolve, reject) => {
				if (file.size < 40) {
					reject(new Error('PNG signature not found.'));
					return;
				}
				const blob = file.slice(0, 40);
				getArrayBuffer(blob).then(buffer => {
					const view = new DataView(buffer);
					if (!compareBuffers(view, PNG_SIGNATURE, 0)) {
						reject(new Error('PNG signature not found.'));
						return;
					}
					if (compareBuffers(view, FRIED_CHUNK_NAME, 12)) {
						if (compareBuffers(view, IHDR_SIGNATURE, 28)) {
							resolve({
								width: view.getUint32(32),
								height: view.getUint32(36)
							});
						} else {
							reject(new Error('PNG IHDR not found.'));
						}
					} else if (compareBuffers(view, IHDR_SIGNATURE, 12)) {
						resolve({
							width: view.getUint32(16),
							height: view.getUint32(20)
						});
					} else {
						reject(new Error('PNG IHDR not found.'));
					}
				}).catch(error => {
					return reject(error);
				});
			});
		}
	}

	const BMP_SIGNATURE = 0x424D;
	class Bmp {
		getSize(file) {
			return new Promise((resolve, reject) => {
				if (file.size < 26) {
					reject(new Error('BMP signature not found.'));
					return;
				}
				const blob = file.slice(0, 26);
				getArrayBuffer(blob).then(buffer => {
					const view = new DataView(buffer);
					if (view.getUint16(0) !== BMP_SIGNATURE) {
						reject(new Error('BMP signature not found.'));
						return;
					}
					resolve({
						width: view.getUint32(18, true),
						height: Math.abs(view.getInt32(22, true))
					});
				}).catch(error => {
					reject(error);
				});
			});
		}
	}

	const EXIF_SIGNATURE = convertStringToBuffer('Exif\0\0');
	class Jpeg {
		getSize(file) {
			return new Promise((resolve, reject) => {
				if (file.size < 2) {
					reject(new Error('JPEG signature not found.'));
					return;
				}
				getArrayBuffer(file).then(buffer => {
					const view = new DataView(buffer);
					if (view.getUint8(0) !== 0xFF || view.getUint8(1) !== 0xD8) {
						reject(new Error('JPEG signature not found.'));
						return;
					}
					let offset = 2;
					let orientation = -1;
					for (;;) {
						if (view.byteLength - offset < 2) {
							reject(new Error('JPEG signature not found.'));
							return;
						}
						if (view.getUint8(offset++) !== 0xFF) {
							reject(new Error('JPEG signature not found.'));
							return;
						}
						let code = view.getUint8(offset++);
						let length = 0;
						while (code === 0xFF) {
							code = view.getUint8(offset++);
						}
						if (code >= 0xD0 && code <= 0xD9 || code === 0x01) {
							length = 0;
						} else if (code >= 0xC0 && code <= 0xFE) {
							if (view.byteLength - offset < 2) {
								reject(new Error('JPEG signature not found.'));
								return;
							}
							length = view.getUint16(offset) - 2;
							offset += 2;
						} else {
							reject(new Error('JPEG unknown markers.'));
							return;
						}
						if (code === 0xD9  || code === 0xDA ) {
							reject(new Error('JPEG end of the data stream.'));
							return;
						}
						if (code === 0xE1 && length >= 10 && compareBuffers(view, EXIF_SIGNATURE, offset)) {
							const exifBlock = new DataView(view.buffer, offset + 6, offset + length);
							orientation = getOrientation(exifBlock);
						}
						if (length >= 5 && code >= 0xC0 && code <= 0xCF && code !== 0xC4 && code !== 0xC8 && code !== 0xCC) {
							if (view.byteLength - offset < length) {
								reject(new Error('JPEG size not found.'));
								return;
							}
							let width = view.getUint16(offset + 3);
							let height = view.getUint16(offset + 1);
							if (orientation >= 5 && orientation <= 8) {
								[width, height] = [height, width];
							}
							resolve({
								width,
								height,
								orientation
							});
							return;
						}
						offset += length;
					}
				}).catch(error => {
					reject(error);
				});
			});
		}
	}
	const Marker$1 = {
		BIG_ENDIAN: 0x4D4D,
		LITTLE_ENDIAN: 0x4949
	};
	const getOrientation = exifBlock => {
		const byteAlign = exifBlock.getUint16(0);
		const isBigEndian = byteAlign === Marker$1.BIG_ENDIAN;
		const isLittleEndian = byteAlign === Marker$1.LITTLE_ENDIAN;
		if (isBigEndian || isLittleEndian) {
			return extractOrientation(exifBlock, isLittleEndian);
		}
		return -1;
	};
	const extractOrientation = (exifBlock, littleEndian = false) => {
		const offset = 8;
		const idfDirectoryEntries = exifBlock.getUint16(offset, littleEndian);
		const IDF_ENTRY_BYTES = 12;
		const NUM_DIRECTORY_ENTRIES_BYTES = 2;
		for (let directoryEntryNumber = 0; directoryEntryNumber < idfDirectoryEntries; directoryEntryNumber++) {
			const start = offset + NUM_DIRECTORY_ENTRIES_BYTES + directoryEntryNumber * IDF_ENTRY_BYTES;
			const end = start + IDF_ENTRY_BYTES;
			if (start > exifBlock.byteLength) {
				return -1;
			}
			const block = new DataView(exifBlock.buffer, exifBlock.byteOffset + start, end - start);
			const tagNumber = block.getUint16(0, littleEndian);
			if (tagNumber === 274) {
				const dataFormat = block.getUint16(2, littleEndian);
				if (dataFormat !== 3) {
					return -1;
				}
				const numberOfComponents = block.getUint32(4, littleEndian);
				if (numberOfComponents !== 1) {
					return -1;
				}
				return block.getUint16(8, littleEndian);
			}
		}
		return -1;
	};

	const RIFF_HEADER = 0x52494646;
	const WEBP_SIGNATURE = 0x57454250;
	const VP8_SIGNATURE = 0x56503820;
	const VP8L_SIGNATURE = 0x5650384C;
	const VP8X_SIGNATURE = 0x56503858;
	class Webp {
		getSize(file) {
			return new Promise((resolve, reject) => {
				if (file.size < 16) {
					reject(new Error('WEBP signature not found.'));
					return;
				}
				const blob = file.slice(0, 30);
				getArrayBuffer(blob).then(buffer => {
					const view = new DataView(buffer);
					if (view.getUint32(0) !== RIFF_HEADER && view.getUint32(8) !== WEBP_SIGNATURE) {
						reject(new Error('WEBP signature not found.'));
						return;
					}
					const headerType = view.getUint32(12);
					const headerView = new DataView(buffer, 20, 10);
					if (headerType === VP8_SIGNATURE && headerView.getUint8(0) !== 0x2F) {
						resolve({
							width: headerView.getUint16(6, true) & 0x3FFF,
							height: headerView.getUint16(8, true) & 0x3FFF
						});
						return;
					}
					if (headerType === VP8L_SIGNATURE && headerView.getUint8(0) === 0x2F) {
						const bits = headerView.getUint32(1, true);
						resolve({
							width: (bits & 0x3FFF) + 1,
							height: (bits >> 14 & 0x3FFF) + 1
						});
						return;
					}
					if (headerType === VP8X_SIGNATURE) {
						const extendedHeader = headerView.getUint8(0);
						const validStart = (extendedHeader & 0xC0) === 0;
						const validEnd = (extendedHeader & 0x01) === 0;
						if (validStart && validEnd) {
							const animated = (extendedHeader & 2) === 2;
							const width = 1 + (headerView.getUint8(6) << 16 | headerView.getUint8(5) << 8 | headerView.getUint8(4));
							const height = 1 + (Math.trunc(headerView.getUint8(9)) | headerView.getUint8(8) << 8 | headerView.getUint8(7));
							resolve({
								width,
								height,
								animated
							});
							return;
						}
					}
					reject(new Error('WEBP signature not found.'));
				}).catch(error => {
					reject(error);
				});
			});
		}
	}

	const jpg = new Jpeg();
	const typeHandlers = {
		gif: new Gif(),
		png: new Png(),
		bmp: new Bmp(),
		jpg,
		jpeg: jpg,
		jpe: jpg,
		webp: new Webp()
	};
	const getImageSize = file => {
		if (file.size === 0) {
			return Promise.reject(new Error('Unknown image type.'));
		}
		const extension = getFileExtension(file.name).toLowerCase();
		const type = file.type.replace(/^image\//, '');
		const typeHandler = typeHandlers[extension] || typeHandlers[type];
		if (!typeHandler) {
			return Promise.reject(new Error('Unknown image type.'));
		}
		return typeHandler.getSize(file);
	};

	class ImageSizeFilter extends Filter {
		#imageMinWidth = 1;
		#imageMinHeight = 1;
		#imageMaxWidth = 7000;
		#imageMaxHeight = 7000;
		#ignoreUnknownImageTypes = false;
		#treatOversizeImageAsFile = false;
		constructor(uploader, filterOptions = {}) {
			super(uploader);
			const settings = main_core.Extension.getSettings('ui.uploader.core');
			this.#imageMinWidth = settings.get('imageMinWidth', this.#imageMinWidth);
			this.#imageMinHeight = settings.get('imageMinHeight', this.#imageMinHeight);
			this.#imageMaxWidth = settings.get('imageMaxWidth', this.#imageMaxWidth);
			this.#imageMaxHeight = settings.get('imageMaxHeight', this.#imageMaxHeight);
			const options = main_core.Type.isPlainObject(filterOptions) ? filterOptions : {};
			this.setImageMinWidth(options.imageMinWidth);
			this.setImageMinHeight(options.imageMinHeight);
			this.setImageMaxWidth(options.imageMaxWidth);
			this.setImageMaxHeight(options.imageMaxHeight);
			this.setIgnoreUnknownImageTypes(options.ignoreUnknownImageTypes);
			this.setTreatOversizeImageAsFile(options.treatOversizeImageAsFile);
		}
		apply(file) {
			return new Promise((resolve, reject) => {
				if (!isResizableImage(file.getName(), file.getType())) {
					resolve();
					return;
				}
				getImageSize(file.getBinary()).then(({
					width,
					height,
					animated
				}) => {
					file.setWidth(width);
					file.setHeight(height);
					file.setAnimated(animated === true);
					if (width < this.getImageMinWidth() || height < this.getImageMinHeight()) {
						if (this.shouldTreatOversizeImageAsFile()) {
							file.setTreatImageAsFile(true);
							resolve();
						} else {
							reject(new UploaderError('IMAGE_IS_TOO_SMALL', {
								minWidth: this.getImageMinWidth(),
								minHeight: this.getImageMinHeight()
							}));
						}
					} else if (width > this.getImageMaxWidth() || height > this.getImageMaxHeight()) {
						if (this.shouldTreatOversizeImageAsFile()) {
							file.setTreatImageAsFile(true);
							resolve();
						} else {
							reject(new UploaderError('IMAGE_IS_TOO_BIG', {
								maxWidth: this.getImageMaxWidth(),
								maxHeight: this.getImageMaxHeight()
							}));
						}
					} else {
						resolve();
					}
				}).catch(error => {
					if (this.getIgnoreUnknownImageTypes()) {
						file.setTreatImageAsFile(true);
						resolve();
					} else {
						if (error) {
							console.warn('Uploader ImageSizeFilter:', error);
						}
						reject(new UploaderError('IMAGE_TYPE_NOT_SUPPORTED'));
					}
				});
			});
		}
		getImageMinWidth() {
			return this.#imageMinWidth;
		}
		setImageMinWidth(value) {
			if (main_core.Type.isNumber(value) && value > 0) {
				this.#imageMinWidth = value;
			}
		}
		getImageMinHeight() {
			return this.#imageMinHeight;
		}
		setImageMinHeight(value) {
			if (main_core.Type.isNumber(value) && value > 0) {
				this.#imageMinHeight = value;
			}
		}
		getImageMaxWidth() {
			return this.#imageMaxWidth;
		}
		setImageMaxWidth(value) {
			if (main_core.Type.isNumber(value) && value > 0) {
				this.#imageMaxWidth = value;
			}
		}
		getImageMaxHeight() {
			return this.#imageMaxHeight;
		}
		setImageMaxHeight(value) {
			if (main_core.Type.isNumber(value) && value > 0) {
				this.#imageMaxHeight = value;
			}
		}
		getIgnoreUnknownImageTypes() {
			return this.#ignoreUnknownImageTypes;
		}
		setIgnoreUnknownImageTypes(value) {
			if (main_core.Type.isBoolean(value)) {
				this.#ignoreUnknownImageTypes = value;
			}
		}
		setTreatOversizeImageAsFile(value) {
			if (main_core.Type.isBoolean(value)) {
				this.#treatOversizeImageAsFile = value;
			}
		}
		shouldTreatOversizeImageAsFile() {
			return this.#treatOversizeImageAsFile;
		}
	}

	const createWorker = fn => {
		const workerBlob = new Blob(['(', fn.toString(), ')()'], {
			type: 'application/javascript'
		});
		const workerURL = URL.createObjectURL(workerBlob);
		const worker = new Worker(workerURL);
		return {
			post: (message, callback, transfer = []) => {
				const id = createUniqueId();
				worker.onmessage = event => {
					if (event.data.id === id) {
						callback(event.data.message);
					}
				};
				worker.postMessage({
					id,
					message
				}, transfer);
			},
			terminate: () => {
				worker.terminate();
				URL.revokeObjectURL(workerURL);
			}
		};
	};

	const BitmapWorker = function () {
		self.onmessage = event => {
			setTimeout(() => {
				createImageBitmap(event.data.message.file).then(bitmap => {
					self.postMessage({
						id: event?.data?.id,
						message: bitmap
					}, [bitmap]);
				}).catch(() => {
					self.postMessage({
						id: event.data.id,
						message: null
					}, []);
				});
			}, 0);
		};
	};

	const ResizeWorker = () => {
		self.onmessage = event => {
			setTimeout(() => {
				const {
					file,
					options = {},
					getResizedImageSizeSource,
					createImagePreviewCanvasSource,
					sharpenSource,
					shouldSharpenSource
				} = event.data.message;
				createImageBitmap(file).then(bitmap => {
					const getResizedImageSize = new Function(`return ${getResizedImageSizeSource}`)();
					const {
						targetWidth,
						targetHeight,
						useOriginalSize
					} = getResizedImageSize(bitmap, options);
					if (useOriginalSize) {
						bitmap.close();
						self.postMessage({
							id: event?.data?.id,
							message: {
								useOriginalSize,
								targetWidth,
								targetHeight
							}
						}, []);
					} else {
						const createImagePreviewCanvas = new Function(`return ${createImagePreviewCanvasSource}`)();
						let offscreenCanvas = createImagePreviewCanvas(bitmap, targetWidth, targetHeight);
						const sharpen = new Function(`return ${sharpenSource}`)();
						const shouldSharpen = new Function(`return ${shouldSharpenSource}`)();
						if (shouldSharpen(bitmap, targetWidth, targetHeight)) {
							sharpen(offscreenCanvas, targetWidth, targetHeight, 0.2);
						}
						bitmap.close();
						const previewBitmap = offscreenCanvas.transferToImageBitmap();
						offscreenCanvas.width = 0;
						offscreenCanvas.height = 0;
						offscreenCanvas = null;
						self.postMessage({
							id: event?.data?.id,
							message: {
								bitmap: previewBitmap,
								useOriginalSize,
								targetWidth,
								targetHeight
							}
						}, [previewBitmap]);
					}
				}).catch(error => {
					console.log('Uploader: Resize Worker Error (createImageBitmap)', error);
					self.postMessage({
						id: event.data.id,
						message: null
					}, []);
				});
			}, 0);
		};
	};

	const loadImage = file => new Promise((resolve, reject) => {
		const image = document.createElement('img');
		const url = URL.createObjectURL(file);
		image.src = url;
		image.onerror = error => {
			URL.revokeObjectURL(image.src);
			reject(error);
		};
		image.onload = () => {
			URL.revokeObjectURL(url);
			resolve({
				width: image.naturalWidth,
				height: image.naturalHeight,
				image
			});
		};
	});

	const createImagePreviewCanvas = (imageSource, newWidth, newHeight) => {
		const width = Math.round(newWidth);
		const height = Math.round(newHeight);
		const isPageContext = typeof window !== 'undefined' && typeof document !== 'undefined' && typeof parent !== 'undefined';
		const createCanvas = (canvasWidth, canvasHeight) => {
			if (isPageContext) {
				const canvas = document.createElement('canvas');
				canvas.width = canvasWidth;
				canvas.height = canvasHeight;
				return canvas;
			}
			return new OffscreenCanvas(canvasWidth, canvasHeight);
		};
		if (imageSource.height <= height && imageSource.width <= width) {
			const canvas = createCanvas(width, height);
			const context = canvas.getContext('2d');
			context.imageSmoothingQuality = 'high';
			context.drawImage(imageSource, 0, 0, width, height);
			return canvas;
		}
		let currentImageWidth = Math.floor(imageSource.width);
		let currentImageHeight = Math.floor(imageSource.height);
		let currentImageSource = imageSource;
		let resizingCanvas = null;
		while (currentImageWidth * 0.5 > width) {
			const halfImageWidth = Math.floor(currentImageWidth * 0.5);
			const halfImageHeight = Math.floor(currentImageHeight * 0.5);
			resizingCanvas = createCanvas(halfImageWidth, halfImageHeight);
			const resizingCanvasContext = resizingCanvas.getContext('2d');
			resizingCanvasContext.imageSmoothingQuality = 'high';
			resizingCanvasContext.drawImage(currentImageSource, 0, 0, currentImageWidth, currentImageHeight, 0, 0, halfImageWidth, halfImageHeight);
			currentImageWidth = halfImageWidth;
			currentImageHeight = halfImageHeight;
			currentImageSource = resizingCanvas;
		}
		const outputCanvas = createCanvas(width, height);
		const outputCanvasContext = outputCanvas.getContext('2d');
		outputCanvasContext.imageSmoothingQuality = 'high';
		outputCanvasContext.drawImage(resizingCanvas === null ? imageSource : resizingCanvas, 0, 0, currentImageWidth, currentImageHeight, 0, 0, width, height);
		if (resizingCanvas) {
			resizingCanvas.width = 0;
			resizingCanvas.height = 0;
			resizingCanvas = null;
			currentImageSource.width = 0;
			currentImageSource.height = 0;
			currentImageSource = null;
		}
		return outputCanvas;
	};

	const getResizedImageSize = (imageData, options) => {
		const {
			mode = 'contain',
			upscale = false
		} = options;
		let {
			width,
			height
		} = options;
		if (!width && !height) {
			return {
				targetWidth: 0,
				targetHeight: 0,
				useOriginalSize: true
			};
		}
		if (width === null || width === undefined) {
			width = height;
		} else if (height === null || height === undefined) {
			height = width;
		}
		if (mode !== 'force') {
			const ratioWidth = width / imageData.width;
			const ratioHeight = height / imageData.height;
			let ratio = 1;
			if (mode === 'cover') {
				ratio = Math.max(ratioWidth, ratioHeight);
			} else if (mode === 'contain') {
				ratio = Math.min(ratioWidth, ratioHeight);
			}
			if (ratio > 1 && upscale === false) {
				return {
					targetWidth: imageData.width,
					targetHeight: imageData.height,
					useOriginalSize: true
				};
			}
			width = imageData.width * ratio;
			height = imageData.height * ratio;
		}
		return {
			targetWidth: Math.floor(width),
			targetHeight: Math.floor(height),
			useOriginalSize: false
		};
	};

	const canvasPrototype = window.HTMLCanvasElement && window.HTMLCanvasElement.prototype;
	const hasToBlobSupport = Boolean(window.HTMLCanvasElement) && main_core.Type.isFunction(canvasPrototype.toBlob);
	const canUseOffscreenCanvas$1 = !main_core.Type.isUndefined(window.OffscreenCanvas);
	const convertCanvasToBlob = (canvas, type, quality) => {
		return new Promise((resolve, reject) => {
			if (canUseOffscreenCanvas$1 && canvas instanceof OffscreenCanvas) {
				canvas.convertToBlob({
					type,
					quality
				}).then(blob => {
					resolve(blob);
				}).catch(error => {
					reject(error);
				});
			} else if (hasToBlobSupport) {
				canvas.toBlob(blob => {
					resolve(blob);
				}, type, quality);
			} else {
				const blob = createBlobFromDataUri(canvas.toDataURL(type, quality));
				resolve(blob);
			}
		});
	};

	const supportedMimeTypes = main_core.Browser.isSafari() ? ['image/jpeg', 'image/png'] : ['image/jpeg', 'image/png', 'image/webp'];
	const isSupportedMimeType = mimeType => {
		return supportedMimeTypes.includes(mimeType);
	};

	const sharpen = (canvas, width, height, mixFactor) => {
		const context = canvas.getContext('2d');
		const weights = [0, -1, 0, -1, 5, -1, 0, -1, 0];
		const katet = Math.round(Math.sqrt(weights.length));
		const half = Math.trunc(katet * 0.5);
		const destinationData = context.createImageData(width, height);
		const destinationBuffer = destinationData.data;
		const sourceBuffer = context.getImageData(0, 0, width, height).data;
		let y = height;
		while (y--) {
			let x = width;
			while (x--) {
				const sy = y;
				const sx = x;
				const dstOff = (y * width + x) * 4;
				let red = 0;
				let green = 0;
				let blue = 0;
				for (let cy = 0; cy < katet; cy++) {
					for (let cx = 0; cx < katet; cx++) {
						const scy = sy + cy - half;
						const scx = sx + cx - half;
						if (scy >= 0 && scy < height && scx >= 0 && scx < width) {
							const srcOff = (scy * width + scx) * 4;
							const wt = weights[cy * katet + cx];
							red += sourceBuffer[srcOff] * wt;
							green += sourceBuffer[srcOff + 1] * wt;
							blue += sourceBuffer[srcOff + 2] * wt;
						}
					}
				}
				destinationBuffer[dstOff] = red * mixFactor + sourceBuffer[dstOff] * (1 - mixFactor);
				destinationBuffer[dstOff + 1] = green * mixFactor + sourceBuffer[dstOff + 1] * (1 - mixFactor);
				destinationBuffer[dstOff + 2] = blue * mixFactor + sourceBuffer[dstOff + 2] * (1 - mixFactor);
				destinationBuffer[dstOff + 3] = sourceBuffer[dstOff + 3];
			}
		}
		context.putImageData(destinationData, 0, 0);
	};
	const shouldSharpen = (imageData, width, height) => {
		const scaleX = width / imageData.width;
		const scaleY = height / imageData.height;
		const scale = Math.min(scaleX, scaleY);
		return scale < 0.5;
	};

	const createImagePreview = (imageData, options) => {
		const {
			targetWidth,
			targetHeight
		} = getResizedImageSize(imageData, options);
		const canvas = createImagePreviewCanvas(imageData, targetWidth, targetHeight);
		if (shouldSharpen(imageData, targetWidth, targetHeight)) {
			sharpen(canvas, targetWidth, targetHeight, 0.2);
		}
		const {
			quality = 0.92
		} = options;
		const mimeType = options.mimeType !== undefined && isSupportedMimeType(options.mimeType) ? options.mimeType : 'image/jpeg';
		return convertCanvasToBlob(canvas, mimeType, quality).then(blob => {
			return {
				width: targetWidth,
				height: targetHeight,
				blob
			};
		});
	};

	const getCanvasToBlobType = (blob, options) => {
		const mimeType = options.mimeType !== undefined && isSupportedMimeType(options.mimeType) ? options.mimeType : 'image/jpeg';
		const mimeTypeMode = options.mimeTypeMode;
		if (mimeTypeMode === 'force') {
			return mimeType;
		}
		return isSupportedMimeType(blob.type) ? blob.type : mimeType;
	};

	const getFilenameWithoutExtension = name => {
		return name.slice(0, Math.max(0, name.lastIndexOf('.'))) || name;
	};

	const extensionMap = {
		jpeg: 'jpg'
	};
	const renameFileToMatchMimeType = (filename, mimeType) => {
		const name = getFilenameWithoutExtension(filename);
		const type = mimeType.split('/')[1];
		const extension = extensionMap[type] || type;
		return `${name}.${extension}`;
	};

	let canCreateImageBitmap = 'createImageBitmap' in window && !main_core.Type.isUndefined(window.ImageBitmap) && ImageBitmap.prototype && ImageBitmap.prototype.close;
	if (canCreateImageBitmap && main_core.Browser.isSafari()) {
		const ua = navigator.userAgent.toLowerCase();
		const regex = /version\/([\d.]+)/i;
		const result = regex.exec(ua);
		if (result && result[1] && result[1] < '16.4') {
			canCreateImageBitmap = false;
		}
	}
	const createImagePreviewCanvasSource = createImagePreviewCanvas.toString();
	const getResizedImageSizeSource = getResizedImageSize.toString();
	const sharpenSource = sharpen.toString();
	const shouldSharpenSource = shouldSharpen.toString();
	const canUseOffscreenCanvas = canCreateImageBitmap && !main_core.Type.isUndefined(window.OffscreenCanvas);
	const resizeImage = (source, options) => {
		return new Promise((resolve, reject) => {
			if (canUseOffscreenCanvas) {
				const resizeWorker = createWorker(ResizeWorker);
				const type = getCanvasToBlobType(source, options);
				resizeWorker.post({
					file: source,
					type,
					options,
					createImagePreviewCanvasSource,
					getResizedImageSizeSource,
					sharpenSource,
					shouldSharpenSource
				}, message => {
					resizeWorker.terminate();
					if (message) {
						const {
							bitmap,
							targetWidth,
							targetHeight,
							useOriginalSize
						} = message;
						if (useOriginalSize) {
							resolve({
								preview: source,
								width: targetWidth,
								height: targetHeight
							});
						} else {
							let canvas = document.createElement('canvas');
							canvas.width = bitmap.width;
							canvas.height = bitmap.height;
							const context = canvas.getContext('bitmaprenderer');
							context.transferFromImageBitmap(bitmap);
							const {
								quality = 0.92
							} = options;
							convertCanvasToBlob(canvas, type, quality).then(blob => {
								let preview = blob;
								if (main_core.Type.isFile(source)) {
									const newFileName = renameFileToMatchMimeType(source.name, type);
									preview = createFileFromBlob(blob, newFileName);
								}
								resolve({
									preview,
									width: targetWidth,
									height: targetHeight
								});
							}).catch(error => {
								console.log('Uploader: convertCanvasToBlob error', error);
								loadImageDataFallback();
							}).finally(() => {
								canvas.width = 0;
								canvas.height = 0;
								canvas = null;
								bitmap.close();
							});
						}
					} else {
						loadImageDataFallback();
					}
				});
			} else if (canCreateImageBitmap) {
				const bitmapWorker = createWorker(BitmapWorker);
				bitmapWorker.post({
					file: source
				}, imageBitmap => {
					bitmapWorker.terminate();
					if (imageBitmap) {
						handleImageLoad(imageBitmap);
					} else {
						loadImageDataFallback();
					}
				});
			} else {
				loadImageDataFallback();
			}
			function handleImageLoad(imageData) {
				const {
					useOriginalSize,
					targetWidth,
					targetHeight
				} = getResizedImageSize(imageData, options);
				if (useOriginalSize) {
					if ('close' in imageData) {
						imageData.close();
					}
					resolve({
						preview: source,
						width: targetWidth,
						height: targetHeight
					});
				} else {
					const mimeType = getCanvasToBlobType(source, options);
					createImagePreview(imageData, {
						...options,
						mimeType
					}).then(({
						blob,
						width,
						height
					}) => {
						let preview = blob;
						if (main_core.Type.isFile(source)) {
							const newFileName = renameFileToMatchMimeType(source.name, mimeType);
							preview = createFileFromBlob(blob, newFileName);
						}
						resolve({
							preview,
							width,
							height
						});
					}).catch(error => {
						reject(error);
					}).finally(() => {
						if ('close' in imageData) {
							imageData.close();
						}
					});
				}
			}
			function loadImageDataFallback() {
				console.log('Uploader: resize image fallback');
				loadImage(source).then(result => {
					const {
						image
					} = result;
					handleImageLoad(image);
				}).catch(error => {
					reject(error);
				});
			}
		});
	};

	const isVideo = file => {
		return /^video\/[\d.a-z-]+$/i.test(file.getType()) || file.getExtension() === 'mkv';
	};

	const DEFAULT_VIDEO_PREVIEW_OPTIONS = {
		width: 300,
		height: 3000
	};
	const createVideoPreview = (blob, options = DEFAULT_VIDEO_PREVIEW_OPTIONS, seekTime = 10) => {
		return new Promise((resolve, reject) => {
			const video = document.createElement('video');
			video.setAttribute('src', URL.createObjectURL(blob));
			video.load();
			main_core.Event.bind(video, 'error', error => {
				reject(error || 'Error while loading video file');
			});
			main_core.Event.bind(video, 'loadedmetadata', () => {
				video.currentTime = video.duration < seekTime ? 0 : seekTime;
				main_core.Event.bind(video, 'seeked', () => {
					const imageData = {
						width: video.videoWidth,
						height: video.videoHeight
					};
					const {
						targetWidth,
						targetHeight
					} = getResizedImageSize(imageData, options);
					if (!targetWidth || !targetHeight) {
						reject();
						return;
					}
					const canvas = createImagePreviewCanvas(video, targetWidth, targetHeight);
					const {
						quality = 0.92,
						mimeType = 'image/jpeg'
					} = options;
					convertCanvasToBlob(canvas, mimeType, quality).then(previewBlob => {
						resolve({
							preview: previewBlob,
							width: targetWidth,
							height: targetHeight
						});
					}).catch(() => {
						reject();
					});
				});
			});
		});
	};

	class ImagePreviewFilter extends Filter {
		#imagePreviewWidth = 300;
		#imagePreviewHeight = 300;
		#imagePreviewQuality = 0.92;
		#imagePreviewMimeType = 'image/jpeg';
		#imagePreviewMimeTypeMode = 'auto';
		#imagePreviewUpscale = false;
		#imagePreviewResizeMode = 'contain';
		#imagePreviewFilter = null;
		constructor(uploader, filterOptions = {}) {
			super(uploader);
			const options = main_core.Type.isPlainObject(filterOptions) ? filterOptions : {};
			this.setImagePreviewWidth(options.imagePreviewWidth);
			this.setImagePreviewHeight(options.imagePreviewHeight);
			this.setImagePreviewQuality(options.imagePreviewQuality);
			this.setImagePreviewUpscale(options.imagePreviewUpscale);
			this.setImagePreviewResizeMode(options.imagePreviewResizeMode);
			this.setImagePreviewMimeType(options.imagePreviewMimeType);
			this.setImagePreviewMimeTypeMode(options.imagePreviewMimeTypeMode);
			this.setImagePreviewFilter(options.imagePreviewFilter);
		}
		apply(file) {
			return new Promise(resolve => {
				if (!file.shouldTreatImageAsFile() && isResizableImage(file.getBinary())) {
					const result = this.invokeFilter(file);
					if (result === false) {
						resolve();
						return;
					}
					const resizeOptions = main_core.Type.isPlainObject(result) ? result : {};
					resizeImage(file.getBinary(), this.#getResizeImageOptions(resizeOptions)).then(({
						preview,
						width,
						height
					}) => {
						file.setClientPreview(preview, width, height);
						resolve();
					}).catch(error => {
						if (error) {
							console.warn('Uploader: image resize error', error);
						}
						resolve();
					});
				} else if (isVideo(file) && !main_core.Browser.isSafari()) {
					createVideoPreview(file.getBinary(), this.#getResizeImageOptions()).then(({
						preview,
						width,
						height
					}) => {
						file.setClientPreview(preview, width, height);
						resolve();
					}).catch(error => {
						if (error) {
							console.warn('Uploader: video preview error', error);
						}
						resolve();
					});
				} else {
					resolve();
				}
			});
		}
		getImagePreviewWidth() {
			return this.#imagePreviewWidth;
		}
		setImagePreviewWidth(value) {
			if (main_core.Type.isNumber(value) && value > 0) {
				this.#imagePreviewWidth = value;
			}
		}
		getImagePreviewHeight() {
			return this.#imagePreviewHeight;
		}
		setImagePreviewHeight(value) {
			if (main_core.Type.isNumber(value) && value > 0) {
				this.#imagePreviewHeight = value;
			}
		}
		getImagePreviewQuality() {
			return this.#imagePreviewQuality;
		}
		setImagePreviewQuality(value) {
			if (main_core.Type.isNumber(value) && value > 0.1 && value <= 1) {
				this.#imagePreviewQuality = value;
			}
		}
		getImagePreviewUpscale() {
			return this.#imagePreviewUpscale;
		}
		setImagePreviewUpscale(value) {
			if (main_core.Type.isBoolean(value)) {
				this.#imagePreviewUpscale = value;
			}
		}
		getImagePreviewResizeMode() {
			return this.#imagePreviewResizeMode;
		}
		setImagePreviewResizeMode(value) {
			if (['contain', 'force', 'cover'].includes(value)) {
				this.#imagePreviewResizeMode = value;
			}
		}
		getImagePreviewMimeType() {
			return this.#imagePreviewMimeType;
		}
		setImagePreviewMimeType(value) {
			if (['image/jpeg', 'image/png', 'image/webp'].includes(value)) {
				this.#imagePreviewMimeType = value;
			}
		}
		getImagePreviewMimeTypeMode() {
			return this.#imagePreviewMimeTypeMode;
		}
		setImagePreviewMimeTypeMode(value) {
			if (['auto', 'force'].includes(value)) {
				this.#imagePreviewMimeTypeMode = value;
			}
		}
		setImagePreviewFilter(fn) {
			if (main_core.Type.isFunction(fn)) {
				this.#imagePreviewFilter = fn;
			}
		}
		invokeFilter(file) {
			if (this.#imagePreviewFilter !== null) {
				const result = this.#imagePreviewFilter(file);
				if (main_core.Type.isBoolean(result) || main_core.Type.isPlainObject(result)) {
					return result;
				}
			}
			return true;
		}
		#getResizeImageOptions(overrides = {}) {
			return {
				width: main_core.Type.isNumber(overrides.width) ? overrides.width : this.getImagePreviewWidth(),
				height: main_core.Type.isNumber(overrides.height) ? overrides.height : this.getImagePreviewHeight(),
				mode: main_core.Type.isStringFilled(overrides.mode) ? overrides.mode : this.getImagePreviewResizeMode(),
				upscale: main_core.Type.isBoolean(overrides.upscale) ? overrides.upscale : this.getImagePreviewUpscale(),
				quality: main_core.Type.isNumber(overrides.quality) ? overrides.quality : this.getImagePreviewQuality(),
				mimeType: main_core.Type.isStringFilled(overrides.mimeType) ? overrides.mimeType : this.getImagePreviewMimeType(),
				mimeTypeMode: main_core.Type.isStringFilled(overrides.mimeTypeMode) ? overrides.mimeTypeMode : this.getImagePreviewMimeTypeMode()
			};
		}
	}

	class ImageResizeFilter extends Filter {
		#resizeWidth = null;
		#resizeHeight = null;
		#resizeMethod = 'contain';
		#resizeMimeType = 'image/jpeg';
		#resizeMimeTypeMode = 'auto';
		#resizeQuality = 0.92;
		#resizeFilter = null;
		constructor(uploader, filterOptions = {}) {
			super(uploader);
			const options = main_core.Type.isPlainObject(filterOptions) ? filterOptions : {};
			this.setResizeWidth(options.imageResizeWidth);
			this.setResizeHeight(options.imageResizeHeight);
			this.setResizeMode(options.imageResizeMode);
			this.setResizeMimeType(options.imageResizeMimeType);
			this.setResizeMimeTypeMode(options.imageResizeMimeTypeMode);
			this.setResizeQuality(options.imageResizeQuality);
			this.setResizeFilter(options.imageResizeFilter);
		}
		apply(file) {
			return new Promise(resolve => {
				if (this.getResizeWidth() === null && this.getResizeHeight() === null) {
					resolve();
					return;
				}
				if (file.shouldTreatImageAsFile() || !isResizableImage(file.getBinary())) {
					resolve();
					return;
				}
				const result = this.invokeFilter(file);
				if (result === false) {
					resolve();
					return;
				}
				const overrides = main_core.Type.isPlainObject(result) ? result : {};
				const options = {
					width: main_core.Type.isNumber(overrides.width) ? overrides.width : this.getResizeWidth(),
					height: main_core.Type.isNumber(overrides.height) ? overrides.height : this.getResizeHeight(),
					mode: main_core.Type.isStringFilled(overrides.mode) ? overrides.mode : this.getResizeMode(),
					quality: main_core.Type.isNumber(overrides.quality) ? overrides.quality : this.getResizeQuality(),
					mimeType: main_core.Type.isStringFilled(overrides.mimeType) ? overrides.mimeType : this.getResizeMimeType(),
					mimeTypeMode: main_core.Type.isStringFilled(overrides.mimeTypeMode) ? overrides.mimeTypeMode : this.getResizeMimeTypeMode()
				};
				resizeImage(file.getBinary(), options).then(({
					preview,
					width,
					height
				}) => {
					file.setWidth(width);
					file.setHeight(height);
					file.setFile(preview);
					resolve();
				}).catch(error => {
					if (error) {
						console.warn('image resize error', error);
					}
					resolve();
				});
			});
		}
		getResizeWidth() {
			return this.#resizeWidth;
		}
		setResizeWidth(value) {
			if (main_core.Type.isNumber(value) && value > 0 || main_core.Type.isNull(value)) {
				this.#resizeWidth = value;
			}
		}
		getResizeHeight() {
			return this.#resizeHeight;
		}
		setResizeHeight(value) {
			if (main_core.Type.isNumber(value) && value > 0 || main_core.Type.isNull(value)) {
				this.#resizeHeight = value;
			}
		}
		getResizeMode() {
			return this.#resizeMethod;
		}
		setResizeMode(value) {
			if (value !== undefined && ['contain', 'force', 'cover'].includes(value)) {
				this.#resizeMethod = value;
			}
		}
		getResizeMimeType() {
			return this.#resizeMimeType;
		}
		setResizeMimeType(value) {
			if (value !== undefined && ['image/jpeg', 'image/png', 'image/webp'].includes(value)) {
				this.#resizeMimeType = value;
			}
		}
		getResizeMimeTypeMode() {
			return this.#resizeMimeTypeMode;
		}
		setResizeMimeTypeMode(value) {
			if (value !== undefined && ['auto', 'force'].includes(value)) {
				this.#resizeMimeTypeMode = value;
			}
		}
		getResizeQuality() {
			return this.#resizeQuality;
		}
		setResizeQuality(value) {
			if (main_core.Type.isNumber(value) && value > 0.1 && value <= 1) {
				this.#resizeQuality = value;
			}
		}
		setResizeFilter(fn) {
			if (main_core.Type.isFunction(fn)) {
				this.#resizeFilter = fn;
			}
		}
		invokeFilter(file) {
			if (this.#resizeFilter !== null) {
				const result = this.#resizeFilter(file);
				if (main_core.Type.isBoolean(result) || main_core.Type.isPlainObject(result)) {
					return result;
				}
			}
			return true;
		}
	}

	const UploaderStatus = {
		STARTED: 0,
		STOPPED: 1
	};

	const UploaderEvent = {
		UPLOAD_START: 'onUploadStart',
		UPLOAD_COMPLETE: 'onUploadComplete',
		ERROR: 'onError',
		MAX_FILE_COUNT_EXCEEDED: 'onMaxFileCountExceeded',
		DESTROY: 'onDestroy',
		BEFORE_BROWSE: 'onBeforeBrowse',
		BEFORE_DROP: 'onBeforeDrop',
		BEFORE_PASTE: 'onBeforePaste',
		BEFORE_FILES_ADD: 'onBeforeFilesAdd',
		FILE_BEFORE_ADD: 'File:onBeforeAdd',
		FILE_ADD_START: 'File:onAddStart',
		FILE_LOAD_START: 'File:onLoadStart',
		FILE_LOAD_PROGRESS: 'File:onLoadProgress',
		FILE_LOAD_COMPLETE: 'File:onLoadComplete',
		FILE_ERROR: 'File:onError',
		FILE_ADD: 'File:onAdd',
		FILE_REMOVE: 'File:onRemove',
		FILE_UPLOAD_START: 'File:onUploadStart',
		FILE_UPLOAD_PROGRESS: 'File:onUploadProgress',
		FILE_UPLOAD_COMPLETE: 'File:onUploadComplete',
		FILE_COMPLETE: 'File:onComplete',
		FILE_STATUS_CHANGE: 'File:onStatusChange',
		FILE_STATE_CHANGE: 'File:onStateChange'
	};

	const FilterType = {
		VALIDATION: 'validation',
		PREPARATION: 'preparation'
	};

	const getFilesInDirectory = entry => {
		return new Promise((resolve, reject) => {
			const files = [];
			let dirCounter = 0;
			let fileCounter = 0;
			const resolveIfDone = () => {
				if (fileCounter === 0 && dirCounter === 0) {
					resolve(files);
				}
			};
			const readEntries = dirEntry => {
				dirCounter++;
				const directoryReader = dirEntry.createReader();
				const readBatch = () => {
					directoryReader.readEntries(entries => {
						if (entries.length === 0) {
							dirCounter--;
							resolveIfDone();
							return;
						}
						entries.forEach(fileEntry => {
							if (fileEntry.isDirectory) {
								readEntries(fileEntry);
							} else {
								fileCounter++;
								fileEntry.file(file => {
									files.push(file);
									fileCounter--;
									resolveIfDone();
								});
							}
						});
						readBatch();
					}, reject);
				};
				readBatch();
			};
			readEntries(entry);
		});
	};

	const isDirectoryEntry = item => {
		return 'webkitGetAsEntry' in item && (item.webkitGetAsEntry() || {}).isDirectory === true;
	};

	const isFileSystemItem = item => {
		if ('webkitGetAsEntry' in item) {
			const entry = item.webkitGetAsEntry();
			if (entry) {
				return entry.isFile || entry.isDirectory;
			}
		}
		return item.kind === 'file';
	};

	const getFilesFromItem = item => {
		return new Promise((resolve, reject) => {
			if (isDirectoryEntry(item)) {
				getFilesInDirectory(item.webkitGetAsEntry()).then(resolve).catch(reject);
				return;
			}
			resolve([item.getAsFile()]);
		});
	};
	const getFilesFromDataTransfer = (dataTransfer, browseFolders = true) => {
		return new Promise((resolve, reject) => {
			if (!dataTransfer.items || dataTransfer.items.length === 0) {
				resolve(dataTransfer.files ? [...dataTransfer.files] : []);
				return;
			}
			const items = [...dataTransfer.items].filter(item => {
				return browseFolders ? isFileSystemItem(item) : item.kind === 'file';
			}).map(item => {
				return getFilesFromItem(item);
			});
			Promise.all(items).then(fileGroups => {
				const files = [];
				fileGroups.forEach(group => {
					files.push(...group);
				});
				resolve(files);
			}).catch(reject);
		});
	};
	const hasDataTransferOnlyFiles = (dataTransfer, browseFolders = true) => {
		return new Promise((resolve, reject) => {
			if (!dataTransfer.items) {
				resolve(dataTransfer.files ? dataTransfer.files.length > 0 : false);
				return;
			}
			const success = [...dataTransfer.items].every(item => {
				return browseFolders ? isFileSystemItem(item) : item.kind === 'file' && !isDirectoryEntry(item);
			});
			resolve(success);
		});
	};
	const isFilePasted = (dataTransfer, browseFolders = true) => {
		if (!dataTransfer.types.includes('Files')) {
			return false;
		}
		let files = 0;
		let texts = 0;
		const items = dataTransfer.items;
		for (const item of items) {
			if (item.kind === 'string') {
				texts++;
			} else {
				const isFile = browseFolders ? isFileSystemItem(item) : item.kind === 'file' && !isDirectoryEntry(item);
				if (isFile) {
					files++;
				}
			}
		}
		return files >= texts;
	};

	let result = null;
	const canAppendFileToForm = () => {
		if (result === null) {
			try {
				const dataTransfer = new DataTransfer();
				const file = new File(['hello'], 'my.txt');
				dataTransfer.items.add(file);
				const input = document.createElement('input');
				input.setAttribute('type', 'file');
				input.files = dataTransfer.files;
				result = input.files.length === 1;
			} catch {
				result = false;
			}
		}
		return result;
	};

	const assignFileToInput = (input, file) => {
		try {
			const dataTransfer = new DataTransfer();
			const files = main_core.Type.isArray(file) ? file : [file];
			files.forEach(item => {
				dataTransfer.items.add(item);
			});
			input.files = dataTransfer.files;
		} catch {
			return false;
		}
		return true;
	};

	const instances = new Map();
	class Uploader extends main_core_events.EventEmitter {
		#id = null;
		#files = [];
		#multiple = false;
		#autoUpload = true;
		#allowReplaceSingle = true;
		#maxParallelUploads = 2;
		#maxParallelLoads = 10;
		#acceptOnlyImages = false;
		#acceptedFileTypes = [];
		#ignoredFileNames = ['.ds_store', 'thumbs.db', 'desktop.ini'];
		#maxFileCount = null;
		#server = null;
		#hiddenFields = new Map();
		#hiddenFieldsContainer = null;
		#hiddenFieldName = 'file';
		#assignAsFile = false;
		#assignServerFile = true;
		#filters = new Map();
		#status = UploaderStatus.STOPPED;
		#onBeforeUploadHandler = null;
		#onFileStatusChangeHandler = null;
		#onFileStateChangeHandler = null;
		#onInputFileChangeHandler = null;
		#onPasteHandler = null;
		#onDropHandler = null;
		#browsingNodes = new Map();
		#dropNodes = new Set();
		#pastingNodes = new Set();
		#destroying = false;
		static getById(id) {
			return instances.get(id) || null;
		}
		static getInstances() {
			return [...instances.values()];
		}
		constructor(uploaderOptions) {
			super();
			this.setEventNamespace('BX.UI.Uploader');
			this.#onBeforeUploadHandler = this.#handleBeforeUpload.bind(this);
			this.#onFileStatusChangeHandler = this.#handleFileStatusChange.bind(this);
			this.#onFileStateChangeHandler = this.#handleFileStateChange.bind(this);
			this.#onInputFileChangeHandler = this.#handleInputFileChange.bind(this);
			this.#onPasteHandler = this.#handlePaste.bind(this);
			this.#onDropHandler = this.#handleDrop.bind(this);
			const options = main_core.Type.isPlainObject(uploaderOptions) ? {
				...uploaderOptions
			} : {};
			this.#id = main_core.Type.isStringFilled(options.id) ? options.id : `ui-uploader-${main_core.Text.getRandom().toLowerCase()}`;
			this.#multiple = main_core.Type.isBoolean(options.multiple) ? options.multiple : false;
			const acceptOnlyImages = main_core.Type.isBoolean(options.acceptOnlyImages) ? options.acceptOnlyImages : null;
			const acceptOnlyImagesGlobal = Uploader.getGlobalOption('acceptOnlyImages', null);
			this.setAcceptOnlyImages(acceptOnlyImages || acceptOnlyImagesGlobal);
			if (main_core.Type.isString(options.acceptedFileTypes) || main_core.Type.isArray(options.acceptedFileTypes)) {
				this.setAcceptedFileTypes(options.acceptedFileTypes);
			} else if (acceptOnlyImages !== true) {
				const acceptedFileTypesGlobal = Uploader.getGlobalOption('acceptedFileTypes', null);
				this.setAcceptedFileTypes(acceptedFileTypesGlobal);
			}
			const ignoredFileNames = main_core.Type.isArray(options.ignoredFileNames) ? options.ignoredFileNames : Uploader.getGlobalOption('ignoredFileNames', null);
			this.setIgnoredFileNames(ignoredFileNames);
			this.setMaxFileCount(options.maxFileCount);
			this.setAllowReplaceSingle(options.allowReplaceSingle);
			this.assignBrowse(options.browseElement);
			this.assignDropzone(options.dropElement);
			this.assignPaste(options.pasteElement);
			this.setHiddenFieldsContainer(options.hiddenFieldsContainer);
			this.setHiddenFieldName(options.hiddenFieldName);
			this.setAssignAsFile(options.assignAsFile);
			this.setAssignServerFile(options.assignServerFile);
			this.setAutoUpload(options.autoUpload);
			this.setMaxParallelUploads(options.maxParallelUploads);
			this.setMaxParallelLoads(options.maxParallelLoads);
			let serverOptions = main_core.Type.isPlainObject(options.serverOptions) ? options.serverOptions : {};
			serverOptions = {
				controller: options.controller,
				controllerOptions: options.controllerOptions,
				...serverOptions
			};
			this.#server = new Server(serverOptions);
			this.subscribeFromOptions(options.events);
			this.addFilter(FilterType.VALIDATION, new FileSizeFilter(this, options));
			this.addFilter(FilterType.VALIDATION, new FileTypeFilter(this, options));
			this.addFilter(FilterType.VALIDATION, new ImageSizeFilter(this, options));
			this.addFilter(FilterType.VALIDATION, new ImagePreviewFilter(this, options));
			this.addFilter(FilterType.PREPARATION, new ImageResizeFilter(this, options));
			this.addFilters(options.filters);
			this.addFiles(options.files);
			instances.set(this.#id, this);
		}
		static getGlobalOption(path, defaultValue = null) {
			const globalOptions = main_core.Extension.getSettings('ui.uploader.core');
			return globalOptions.get(path, defaultValue);
		}
		addFiles(fileList) {
			if (!main_core.Type.isArrayLike(fileList)) {
				return [];
			}
			const files = [];
			Array.from(fileList).forEach(item => {
				if (item instanceof UploaderFile) {
					if (item.getStatus() === FileStatus.INIT) {
						files.push(item);
					}
				} else if (main_core.Type.isArrayFilled(item)) {
					files.push(new UploaderFile(item[0], item[1]));
				} else {
					files.push(new UploaderFile(item));
				}
			});
			const event = new main_core_events.BaseEvent({
				data: {
					files: [...files]
				}
			});
			this.emit(UploaderEvent.BEFORE_FILES_ADD, event);
			if (event.isDefaultPrevented()) {
				const {
					error
				} = event.getData();
				if (error instanceof UploaderError) {
					this.emit(UploaderEvent.ERROR, {
						error
					});
				}
				return [];
			}
			if (this.#exceedsMaxFileCount(files)) {
				return [];
			}
			const results = [];
			files.forEach(file => {
				const result = this.addFile(file);
				if (result !== null) {
					results.push(result);
				}
			});
			return results;
		}
		addFile(source, options) {
			if (source instanceof UploaderFile && source.getStatus() !== FileStatus.INIT) {
				return null;
			}
			const file = source instanceof UploaderFile ? source : new UploaderFile(source, options);
			if (this.getIgnoredFileNames().includes(file.getName().toLowerCase())) {
				return null;
			}
			if (this.#exceedsMaxFileCount([file])) {
				return null;
			}
			if (!this.isMultiple() && this.shouldReplaceSingle() && this.#files.length > 0) {
				const fileToReplace = this.#files[0];
				this.removeFile(fileToReplace);
			}
			const event = new main_core_events.BaseEvent({
				data: {
					file
				}
			});
			this.emit(UploaderEvent.FILE_BEFORE_ADD, event);
			if (event.isDefaultPrevented()) {
				return null;
			}
			file.subscribe(FileEvent.STATUS_CHANGE, this.#onFileStatusChangeHandler);
			file.subscribe(FileEvent.STATE_CHANGE, this.#onFileStateChangeHandler);
			this.#setUploadEvents(file);
			this.#setLoadEvents(file);
			this.#setRemoveEvents(file);
			if (!file.isLoadable()) {
				if (file.getOrigin() === FileOrigin.SERVER) {
					const preloaded = main_core.Type.isStringFilled(file.getName());
					if (!preloaded || file.shouldForceServerLoad()) {
						file.setLoadController(this.getServer().createServerLoadController());
					} else {
						file.setLoadController(this.getServer().createServerlessLoadController());
					}
				} else {
					file.setLoadController(this.getServer().createClientLoadController());
				}
			}
			if (!file.isUploadable() && file.getOrigin() === FileOrigin.CLIENT) {
				file.setServer(this.getServer());
			}
			if (!file.isRemoveable()) {
				file.setRemoveController(this.getServer().createRemoveController());
			}
			this.#files.push(file);
			file.emit(FileEvent.ADD);
			this.emit(UploaderEvent.FILE_ADD_START, {
				file
			});
			if (file.getOrigin() === FileOrigin.CLIENT) {
				this.#loadNext();
			} else {
				file.load();
			}
			return file;
		}
		#setLoadEvents(file) {
			file.subscribeFromOptions({
				[FileEvent.LOAD_START]: () => {
					this.emit(UploaderEvent.FILE_LOAD_START, {
						file
					});
				},
				[FileEvent.LOAD_PROGRESS]: event => {
					const {
						progress
					} = event.getData();
					this.emit(UploaderEvent.FILE_LOAD_PROGRESS, {
						file,
						progress
					});
				},
				[FileEvent.LOAD_ERROR]: event => {
					const {
						error
					} = event.getData();
					this.emit(UploaderEvent.FILE_ERROR, {
						file,
						error
					});
					this.emit(UploaderEvent.FILE_ADD, {
						file,
						error
					});
					this.#loadNext();
				},
				[FileEvent.LOAD_COMPLETE]: () => {
					this.emit(UploaderEvent.FILE_ADD, {
						file
					});
					this.emit(UploaderEvent.FILE_LOAD_COMPLETE, {
						file
					});
					if (!file.isUploadable()) {
						this.emit(UploaderEvent.FILE_COMPLETE, {
							file
						});
						this.#setHiddenField(file);
					} else if (this.shouldAutoUpload()) {
						file.upload();
					}
					this.#loadNext();
				},
				[FileEvent.VALIDATE_FILE_ASYNC]: event => {
					const targetFile = event.getData().file;
					return this.#applyFilters(FilterType.VALIDATION, targetFile);
				},
				[FileEvent.PREPARE_FILE_ASYNC]: event => {
					const targetFile = event.getData().file;
					return this.#applyFilters(FilterType.PREPARATION, targetFile);
				}
			});
		}
		#setUploadEvents(file) {
			file.subscribeFromOptions({
				[FileEvent.BEFORE_UPLOAD]: this.#onBeforeUploadHandler,
				[FileEvent.UPLOAD_START]: () => {
					this.emit(UploaderEvent.FILE_UPLOAD_START, {
						file
					});
				},
				[FileEvent.UPLOAD_PROGRESS]: event => {
					const {
						progress
					} = event.getData();
					this.emit(UploaderEvent.FILE_UPLOAD_PROGRESS, {
						file,
						progress
					});
				},
				[FileEvent.UPLOAD_ERROR]: event => {
					const {
						error
					} = event.getData();
					this.emit(UploaderEvent.FILE_ERROR, {
						file,
						error
					});
					this.#uploadNext();
				},
				[FileEvent.UPLOAD_COMPLETE]: () => {
					this.emit(UploaderEvent.FILE_UPLOAD_COMPLETE, {
						file
					});
					this.emit(UploaderEvent.FILE_COMPLETE, {
						file
					});
					this.#setHiddenField(file);
					this.#uploadNext();
				}
			});
		}
		#setRemoveEvents(file) {
			file.subscribeOnce(FileEvent.REMOVE_ERROR, event => {
				const {
					error
				} = event.getData();
				this.emit(UploaderEvent.FILE_ERROR, {
					file,
					error
				});
			});
			file.subscribeOnce(FileEvent.REMOVE_COMPLETE, () => {
				this.#removeFile(file);
			});
		}
		#handleBeforeUpload(event) {
			if (this.getStatus() === UploaderStatus.STOPPED) {
				event.preventDefault();
				this.start();
			} else if (this.getUploadingFileCount() >= this.getMaxParallelUploads()) {
				event.preventDefault();
			}
		}
		#handleFileStatusChange(event) {
			const file = event.getTarget();
			this.emit(UploaderEvent.FILE_STATUS_CHANGE, {
				file
			});
		}
		#handleFileStateChange(event) {
			const file = event.getTarget();
			const property = event.getData().property;
			const value = event.getData().value;
			if (property === 'serverFileId') {
				this.#updateHiddenField(file);
			}
			this.emit(UploaderEvent.FILE_STATE_CHANGE, {
				file,
				property,
				value
			});
		}
		#exceedsMaxFileCount(fileList) {
			const totalNewFiles = fileList.length;
			const totalFiles = this.#files.length;
			if (!this.isMultiple() && totalNewFiles > 1) {
				return true;
			}
			let maxFileCount = null;
			if (this.isMultiple()) {
				maxFileCount = this.getMaxFileCount() ?? null;
			} else {
				maxFileCount = this.shouldReplaceSingle() ? null : 1;
			}
			if (maxFileCount !== null && totalFiles + totalNewFiles > maxFileCount) {
				const error = new UploaderError('MAX_FILE_COUNT_EXCEEDED', {
					maxFileCount
				});
				this.emit(UploaderEvent.MAX_FILE_COUNT_EXCEEDED, {
					error
				});
				this.emit(UploaderEvent.ERROR, {
					error
				});
				return true;
			}
			return false;
		}
		#applyFilters(type, ...args) {
			return new Promise((resolve, reject) => {
				const filters = [...(this.#filters?.get(type) || [])];
				if (filters.length === 0) {
					resolve();
					return;
				}
				const firstFilter = filters.shift();
				filters.reduce((current, next) => {
					return current.then(() => next.apply(...args));
				}, firstFilter.apply(...args)).then(result => resolve(result)).catch(error => reject(error));
			});
		}
		start() {
			if (this.getStatus() !== UploaderStatus.STARTED && this.getPendingFileCount() > 0) {
				this.#status = UploaderStatus.STARTED;
				this.emit(UploaderEvent.UPLOAD_START);
				this.#uploadNext();
			}
		}
		stop() {
			if (this.#status !== UploaderStatus.STOPPED) {
				this.#status = UploaderStatus.STOPPED;
				this.emit('onStop');
			}
		}
		isDestroyed() {
			return false;
		}
		destroy(options) {
			if (this.#destroying) {
				return;
			}
			this.#destroying = true;
			this.emit(UploaderEvent.DESTROY);
			this.unassignBrowseAll();
			this.unassignDropzoneAll();
			this.unassignPasteAll();
			const removeFromServer = !options || options.removeFilesFromServer !== false;
			this.removeFiles({
				removeFromServer
			});
			this.#resetHiddenFields();
			instances.delete(this.getId());
			this.#files = [];
			this.#server = null;
			this.#acceptedFileTypes = [];
			this.#ignoredFileNames = [];
			this.#filters = new Map();
			Object.setPrototypeOf(this, null);
			this.isDestroyed = () => true;
		}
		removeFiles(options) {
			this.getFiles().forEach(file => {
				file.remove(options);
			});
		}
		removeFile(fileOrId, options) {
			const file = main_core.Type.isString(fileOrId) ? this.getFile(fileOrId) : fileOrId;
			const index = this.#files.indexOf(file);
			if (index === -1) {
				return;
			}
			file.remove(options);
		}
		#removeFile(file) {
			const index = this.#files.indexOf(file);
			if (index !== -1) {
				this.#files.splice(index, 1);
			}
			file.unsubscribeAll();
			this.emit(UploaderEvent.FILE_REMOVE, {
				file
			});
			this.#resetHiddenField(file);
		}
		getFile(id) {
			return this.#files.find(file => file.getId() === id) || null;
		}
		getFiles() {
			return [...this.#files];
		}
		getFileCount() {
			return this.#files.length;
		}
		getId() {
			return this.#id;
		}
		isMultiple() {
			return this.#multiple;
		}
		getStatus() {
			return this.#status;
		}
		addFilter(type, filterEntity, filterOptions = {}) {
			let filter = null;
			if (main_core.Type.isFunction(filterEntity) || main_core.Type.isString(filterEntity)) {
				const ClassName = main_core.Type.isString(filterEntity) ? main_core.Reflection.getClass(filterEntity) : filterEntity;
				if (main_core.Type.isFunction(ClassName)) {
					filter = new ClassName(this, filterOptions);
				}
			} else {
				filter = filterEntity;
			}
			if (filter instanceof Filter) {
				let filters = this.#filters?.get(type);
				if (!main_core.Type.isArray(filters)) {
					filters = [];
					this.#filters?.set(type, filters);
				}
				filters.push(filter);
			} else {
				throw new TypeError('Uploader: a filter must be an instance of FileUploader.Filter.');
			}
		}
		addFilters(filters) {
			if (main_core.Type.isArray(filters)) {
				filters.forEach(filter => {
					if (main_core.Type.isPlainObject(filter)) {
						this.addFilter(filter.type, filter.filter, filter.options);
					}
				});
			}
		}
		getServer() {
			return this.#server;
		}
		assignBrowse(htmlElement) {
			const nodes = main_core.Type.isElementNode(htmlElement) ? [htmlElement] : htmlElement;
			if (!main_core.Type.isArray(nodes)) {
				return;
			}
			nodes.forEach(node => {
				if (!main_core.Type.isElementNode(node) || this.#browsingNodes.has(node)) {
					return;
				}
				let input;
				if (node.tagName === 'INPUT' && node.type === 'file') {
					input = node;
					if (input.files && input.files.length > 0) {
						this.addFiles(input.files);
					}
					const acceptAttr = input.getAttribute('accept');
					if (main_core.Type.isStringFilled(acceptAttr)) {
						this.setAcceptedFileTypes(acceptAttr);
					}
					this.#browsingNodes.set(node, null);
				} else {
					input = document.createElement('input');
					input.setAttribute('type', 'file');
					const onBrowseClickHandler = this.#handleBrowseClick.bind(this, input, node);
					this.#browsingNodes.set(node, onBrowseClickHandler);
					main_core.Event.bind(node, 'click', onBrowseClickHandler);
				}
				if (this.isMultiple()) {
					input.setAttribute('multiple', 'multiple');
				}
				if (main_core.Type.isArrayFilled(this.getAcceptedFileTypes())) {
					input.setAttribute('accept', this.getAcceptedFileTypes().join(','));
				}
				main_core.Event.bind(input, 'change', this.#onInputFileChangeHandler);
			});
		}
		#handleBrowseClick(input, node) {
			const event = new main_core_events.BaseEvent({
				data: {
					input,
					node
				}
			});
			this.emit(UploaderEvent.BEFORE_BROWSE, event);
			if (event.isDefaultPrevented()) {
				return;
			}
			input.click();
		}
		#handleInputFileChange(event) {
			const input = event.currentTarget;
			this.addFiles([...input.files]);
			input.value = '';
		}
		unassignBrowse(htmlElement) {
			const nodes = main_core.Type.isElementNode(htmlElement) ? [htmlElement] : htmlElement;
			if (!main_core.Type.isArray(nodes)) {
				return;
			}
			nodes.forEach(node => {
				if (this.#browsingNodes.has(node)) {
					main_core.Event.unbind(node, 'click', this.#browsingNodes.get(node));
					main_core.Event.unbind(node, 'change', this.#onInputFileChangeHandler);
					this.#browsingNodes.delete(node);
				}
			});
		}
		unassignBrowseAll() {
			[...this.#browsingNodes.keys()].forEach(node => {
				this.unassignBrowse(node);
			});
		}
		assignDropzone(htmlElement) {
			const nodes = main_core.Type.isElementNode(htmlElement) ? [htmlElement] : htmlElement;
			if (!main_core.Type.isArray(nodes)) {
				return;
			}
			nodes.forEach(node => {
				if (!main_core.Type.isElementNode(node) || this.#dropNodes.has(node)) {
					return;
				}
				main_core.Event.bind(node, 'dragover', this.#preventDefault);
				main_core.Event.bind(node, 'dragenter', this.#preventDefault);
				main_core.Event.bind(node, 'drop', this.#onDropHandler);
				this.#dropNodes.add(node);
			});
		}
		#handleDrop(dragEvent) {
			dragEvent.preventDefault();
			const event = new main_core_events.BaseEvent({
				data: {
					dragEvent
				}
			});
			this.emit(UploaderEvent.BEFORE_DROP, event);
			if (event.isDefaultPrevented()) {
				return;
			}
			getFilesFromDataTransfer(dragEvent.dataTransfer).then(files => {
				this.addFiles(files);
			}).catch(error => {
				console.error('Uploader: data transfer error', error);
			});
		}
		#preventDefault(event) {
			event.preventDefault();
		}
		unassignDropzone(htmlElement) {
			const nodes = main_core.Type.isElementNode(htmlElement) ? [htmlElement] : htmlElement;
			if (!main_core.Type.isArray(nodes)) {
				return;
			}
			nodes.forEach(node => {
				if (this.#dropNodes.has(node)) {
					main_core.Event.unbind(node, 'dragover', this.#preventDefault);
					main_core.Event.unbind(node, 'dragenter', this.#preventDefault);
					main_core.Event.unbind(node, 'drop', this.#onDropHandler);
					this.#dropNodes.delete(node);
				}
			});
		}
		unassignDropzoneAll() {
			[...this.#dropNodes].forEach(node => {
				this.unassignDropzone(node);
			});
		}
		assignPaste(htmlElement) {
			const nodes = main_core.Type.isElementNode(htmlElement) ? [htmlElement] : htmlElement;
			if (!main_core.Type.isArray(nodes)) {
				return;
			}
			nodes.forEach(node => {
				if (!main_core.Type.isElementNode(node) || this.#pastingNodes.has(node)) {
					return;
				}
				main_core.Event.bind(node, 'paste', this.#onPasteHandler);
				this.#pastingNodes.add(node);
			});
		}
		#handlePaste(clipboardEvent) {
			const clipboardData = clipboardEvent.clipboardData;
			if (!clipboardData) {
				return;
			}
			const event = new main_core_events.BaseEvent({
				data: {
					clipboardEvent
				}
			});
			this.emit(UploaderEvent.BEFORE_PASTE, event);
			if (event.isDefaultPrevented()) {
				return;
			}
			if (isFilePasted(clipboardData)) {
				clipboardEvent.preventDefault();
				getFilesFromDataTransfer(clipboardData).then(files => {
					this.addFiles(files);
				}).catch(error => {
					console.error('Uploader: data transfer error', error);
				});
			}
		}
		unassignPaste(htmlElement) {
			const nodes = main_core.Type.isElementNode(htmlElement) ? [htmlElement] : htmlElement;
			if (!main_core.Type.isArray(nodes)) {
				return;
			}
			nodes.forEach(node => {
				if (this.#pastingNodes.has(node)) {
					main_core.Event.unbind(node, 'paste', this.#onPasteHandler);
					this.#pastingNodes.delete(node);
				}
			});
		}
		unassignPasteAll() {
			[...this.#pastingNodes].forEach(node => {
				this.unassignPaste(node);
			});
		}
		getHiddenFieldsContainer() {
			let element = null;
			if (main_core.Type.isStringFilled(this.#hiddenFieldsContainer)) {
				element = document.querySelector(this.#hiddenFieldsContainer) || null;
				if (!main_core.Type.isElementNode(element)) {
					console.error(`Uploader: a hidden field container was not found (${this.#hiddenFieldsContainer}).`);
				}
			} else if (main_core.Type.isElementNode(this.#hiddenFieldsContainer)) {
				element = this.#hiddenFieldsContainer;
			}
			return element;
		}
		setHiddenFieldsContainer(container) {
			if (main_core.Type.isStringFilled(container) || main_core.Type.isElementNode(container) || main_core.Type.isNull(container)) {
				this.#hiddenFieldsContainer = container;
			}
		}
		getHiddenFieldName() {
			return this.#hiddenFieldName;
		}
		setHiddenFieldName(name) {
			if (main_core.Type.isStringFilled(name)) {
				this.#hiddenFieldName = name;
			}
		}
		shouldAssignAsFile() {
			return this.#assignAsFile;
		}
		setAssignAsFile(flag) {
			if (main_core.Type.isBoolean(flag)) {
				this.#assignAsFile = flag;
			}
		}
		shouldAssignServerFile() {
			return this.#assignServerFile;
		}
		setAssignServerFile(flag) {
			if (main_core.Type.isBoolean(flag)) {
				this.#assignServerFile = flag;
			}
		}
		getTotalSize() {
			return this.#files.reduce((totalSize, file) => {
				return totalSize + file.getSize();
			}, 0);
		}
		shouldAutoUpload() {
			return this.#autoUpload;
		}
		setAutoUpload(flag) {
			if (main_core.Type.isBoolean(flag)) {
				this.#autoUpload = flag;
			}
		}
		getMaxParallelUploads() {
			return this.#maxParallelUploads;
		}
		setMaxParallelUploads(number) {
			if (main_core.Type.isNumber(number) && number > 0) {
				this.#maxParallelUploads = number;
			}
		}
		getMaxParallelLoads() {
			return this.#maxParallelLoads;
		}
		setMaxParallelLoads(number) {
			if (main_core.Type.isNumber(number) && number > 0) {
				this.#maxParallelLoads = number;
			}
		}
		getUploadingFileCount() {
			return this.#files.filter(file => file.isUploading() || file.isPreparing()).length;
		}
		getPendingFileCount() {
			return this.#files.filter(file => file.isReadyToUpload()).length;
		}
		isInProgress() {
			if (this.getStatus() === UploaderStatus.STARTED) {
				return true;
			}
			return this.#files.some(file => file.isInProgress());
		}
		static getImageExtensions() {
			return this.getGlobalOption('imageExtensions', ['jpg', 'bmp', 'jpeg', 'jpe', 'gif', 'png', 'webp']);
		}
		static getVideoExtensions() {
			return this.getGlobalOption('videoExtensions', ['avi', 'wmv', 'mp4', 'mov', 'webm', 'flv', 'm4v', 'mkv', 'vob', '3gp', 'ogv', 'h264']);
		}
		setAcceptOnlyImages(flag) {
			if (main_core.Type.isBoolean(flag)) {
				this.#acceptOnlyImages = flag;
				if (flag) {
					this.acceptOnlyImages();
				}
			}
		}
		acceptOnlyImages() {
			const imageExtensions = Uploader.getImageExtensions().map(extension => {
				return `.${extension}`;
			});
			this.setAcceptedFileTypes(imageExtensions);
			this.#acceptOnlyImages = true;
		}
		shouldAcceptOnlyImages() {
			return this.#acceptOnlyImages;
		}
		getAcceptedFileTypes() {
			return this.#acceptedFileTypes;
		}
		setAcceptedFileTypes(fileTypes) {
			const types = main_core.Type.isString(fileTypes) ? fileTypes.split(',') : fileTypes;
			if (main_core.Type.isArray(types)) {
				this.#acceptedFileTypes = [];
				this.#acceptOnlyImages = false;
				types.forEach(type => {
					if (main_core.Type.isStringFilled(type)) {
						this.#acceptedFileTypes.push(type);
					}
				});
			}
		}
		getIgnoredFileNames() {
			return this.#ignoredFileNames;
		}
		setIgnoredFileNames(fileNames) {
			if (main_core.Type.isArray(fileNames)) {
				this.#ignoredFileNames = [];
				fileNames.forEach(fileName => {
					if (main_core.Type.isStringFilled(fileName)) {
						this.#ignoredFileNames.push(fileName.toLowerCase());
					}
				});
			}
		}
		setMaxFileCount(maxFileCount) {
			if (main_core.Type.isNumber(maxFileCount) && maxFileCount > 0 || maxFileCount === null) {
				this.#maxFileCount = maxFileCount;
			}
		}
		getMaxFileCount() {
			return this.#maxFileCount;
		}
		setAllowReplaceSingle(flag) {
			if (main_core.Type.isBoolean(flag)) {
				this.#allowReplaceSingle = flag;
			}
		}
		shouldReplaceSingle() {
			return this.#allowReplaceSingle;
		}
		#uploadNext() {
			if (this.getStatus() !== UploaderStatus.STARTED) {
				return;
			}
			const maxParallelUploads = this.getMaxParallelUploads();
			const currentUploads = this.getUploadingFileCount();
			const pendingFiles = this.#files.filter(file => file.isReadyToUpload());
			const pendingUploads = pendingFiles.length;
			if (currentUploads < maxParallelUploads) {
				const limit = Math.min(maxParallelUploads - currentUploads, pendingFiles.length);
				for (let i = 0; i < limit; i++) {
					const pendingFile = pendingFiles[i];
					pendingFile.upload();
				}
			}
			if (currentUploads === 0 && pendingUploads === 0) {
				this.#status = UploaderStatus.STOPPED;
				this.emit(UploaderEvent.UPLOAD_COMPLETE);
			}
		}
		#loadNext() {
			const maxParallelLoads = this.getMaxParallelLoads();
			const currentLoads = this.#files.filter(file => file.isLoading()).length;
			const pendingFiles = this.#files.filter(file => {
				return file.getStatus() === FileStatus.ADDED && file.getOrigin() === FileOrigin.CLIENT;
			});
			if (currentLoads < maxParallelLoads) {
				const limit = Math.min(maxParallelLoads - currentLoads, pendingFiles.length);
				for (let i = 0; i < limit; i++) {
					const pendingFile = pendingFiles[i];
					pendingFile.load();
				}
			}
		}
		#setHiddenField(file) {
			const container = this.getHiddenFieldsContainer();
			if (!container || this.#hiddenFields.has(file.getId())) {
				return;
			}
			if (file.getOrigin() === FileOrigin.SERVER && !this.shouldAssignServerFile()) {
				return;
			}
			const assignAsFile = file.getOrigin() === FileOrigin.CLIENT && !file.isUploadable() && this.shouldAssignAsFile() && canAppendFileToForm();
			const input = document.createElement('input');
			input.type = assignAsFile ? 'file' : 'hidden';
			input.name = this.getHiddenFieldName() + (this.isMultiple() ? '[]' : '');
			if (assignAsFile) {
				main_core.Dom.style(input, {
					visibility: 'hidden',
					left: 0,
					top: 0,
					width: 0,
					height: 0,
					position: 'absolute',
					'pointer-events': 'none'
				});
				assignFileToInput(input, file.getBinary());
			} else if (file.getServerFileId() !== null) {
				input.value = String(file.getServerFileId());
			}
			main_core.Dom.append(input, container);
			this.#hiddenFields.set(file.getId(), input);
			this.#syncInputPositions();
		}
		#updateHiddenField(file) {
			const input = this.#hiddenFields.get(file.getId());
			if (input && input.type === 'hidden') {
				if (file.getServerFileId() === null) {
					this.#resetHiddenField(file);
				} else {
					input.value = String(file.getServerFileId());
				}
			}
		}
		#resetHiddenField(file) {
			const input = this.#hiddenFields.get(file.getId());
			if (input) {
				main_core.Dom.remove(input);
				this.#hiddenFields.delete(file.getId());
			}
		}
		#resetHiddenFields() {
			[...this.#hiddenFields.values()].forEach(input => {
				main_core.Dom.remove(input);
			});
			this.#hiddenFields = new Map();
		}
		#syncInputPositions() {
			const container = this.getHiddenFieldsContainer();
			if (!container) {
				return;
			}
			this.getFiles().forEach(file => {
				const input = this.#hiddenFields.get(file.getId());
				if (input) {
					main_core.Dom.append(input, container);
				}
			});
		}
	}

	const isImage = blob => {
		return /^image\/[\d.a-z-]+$/i.test(blob.type);
	};

	const Marker = {
		JPEG: 0xFFD8,
		APP1: 0xFFE1,
		EXIF: 0x45786966,
		TIFF: 0x4949,
		Orientation: 0x0112,
		Unknown: 0xFF00
	};
	const getUint16 = (view, offset, little = false) => view.getUint16(offset, little);
	const getUint32 = (view, offset, little = false) => view.getUint32(offset, little);
	const getJpegOrientation = file => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = function (e) {
				const view = new DataView(e.target.result);
				if (getUint16(view, 0) !== Marker.JPEG) {
					resolve(-1);
					return;
				}
				const length = view.byteLength;
				let offset = 2;
				while (offset < length) {
					const marker = getUint16(view, offset);
					offset += 2;
					if (marker === Marker.APP1) {
						offset += 2;
						if (getUint32(view, offset) !== Marker.EXIF) {
							break;
						}
						const little = getUint16(view, offset += 6) === Marker.TIFF;
						offset += getUint32(view, offset + 4, little);
						const tags = getUint16(view, offset, little);
						offset += 2;
						for (let i = 0; i < tags; i++) {
							if (getUint16(view, offset + i * 12, little) === Marker.Orientation) {
								resolve(getUint16(view, offset + i * 12 + 8, little));
								return;
							}
						}
					} else if ((marker & Marker.Unknown) === Marker.Unknown) {
						offset += getUint16(view, offset);
					} else {
						break;
					}
				}
				resolve(-1);
			};
			reader.readAsArrayBuffer(file.slice(0, 64 * 1024));
		});
	};

	const isJpeg = blob => {
		return /^image\/jpeg$/i.test(blob.type);
	};

	var index = Object.freeze({
		__proto__: null,
		assignFileToInput: assignFileToInput,
		canAppendFileToForm: canAppendFileToForm,
		createBlobFromDataUri: createBlobFromDataUri,
		createFileFromBlob: createFileFromBlob,
		createUniqueId: createUniqueId,
		createVideoPreview: createVideoPreview,
		createWorker: createWorker,
		formatFileSize: formatFileSize,
		getArrayBuffer: getArrayBuffer,
		getExtensionFromType: getExtensionFromType,
		getFileExtension: getFileExtension,
		getFilenameWithoutExtension: getFilenameWithoutExtension,
		getFilesFromDataTransfer: getFilesFromDataTransfer,
		getImageSize: getImageSize,
		getJpegOrientation: getJpegOrientation,
		getResizedImageSize: getResizedImageSize,
		hasDataTransferOnlyFiles: hasDataTransferOnlyFiles,
		isDataUri: isDataUri,
		isFilePasted: isFilePasted,
		isImage: isImage,
		isJpeg: isJpeg,
		isResizableImage: isResizableImage,
		isSupportedVideo: isSupportedVideo,
		isValidFileType: isValidFileType,
		loadImage: loadImage,
		resizeImage: resizeImage
	});

	exports.AbstractLoadController = AbstractLoadController;
	exports.AbstractRemoveController = AbstractRemoveController;
	exports.AbstractUploadController = AbstractUploadController;
	exports.FileEvent = FileEvent;
	exports.FileOrigin = FileOrigin;
	exports.FileStatus = FileStatus;
	exports.Filter = Filter;
	exports.FilterType = FilterType;
	exports.Helpers = index;
	exports.ParallelUploadController = ParallelUploadController;
	exports.PresignedUploadController = PresignedUploadController;
	exports.Server = Server;
	exports.Uploader = Uploader;
	exports.UploaderError = UploaderError;
	exports.UploaderEvent = UploaderEvent;
	exports.UploaderStatus = UploaderStatus;
	exports.assignFileToInput = assignFileToInput;
	exports.canAppendFileToForm = canAppendFileToForm;
	exports.createBlobFromDataUri = createBlobFromDataUri;
	exports.createFileFromBlob = createFileFromBlob;
	exports.createUniqueId = createUniqueId;
	exports.createVideoPreview = createVideoPreview;
	exports.createWorker = createWorker;
	exports.formatFileSize = formatFileSize;
	exports.getArrayBuffer = getArrayBuffer;
	exports.getExtensionFromType = getExtensionFromType;
	exports.getFileExtension = getFileExtension;
	exports.getFilenameWithoutExtension = getFilenameWithoutExtension;
	exports.getFilesFromDataTransfer = getFilesFromDataTransfer;
	exports.getImageSize = getImageSize;
	exports.getJpegOrientation = getJpegOrientation;
	exports.getResizedImageSize = getResizedImageSize;
	exports.hasDataTransferOnlyFiles = hasDataTransferOnlyFiles;
	exports.isDataUri = isDataUri;
	exports.isFilePasted = isFilePasted;
	exports.isImage = isImage;
	exports.isJpeg = isJpeg;
	exports.isResizableImage = isResizableImage;
	exports.isSupportedVideo = isSupportedVideo;
	exports.isValidFileType = isValidFileType;
	exports.loadImage = loadImage;
	exports.resizeImage = resizeImage;

})(this.BX.UI.Uploader = this.BX.UI.Uploader || {}, BX, BX.Event);
//# sourceMappingURL=ui.uploader.bundle.js.map
