import { Loc } from 'main.core';
import { EventEmitter } from 'main.core.events';

import { Logger } from 'call.adapter.logger';
import { Uploader } from 'call.adapter.uploader';
import { Notifier } from 'call.adapter.notifier';

const FILE_MAX_SIZE = 100 * 1024 * 1024;
const FILE_MAX_SIZE_PHRASE_NUMBER = 100;
const UPLOAD_CHUNK_SIZE = 1024 * 1024;
const NOTIFICATION_HIDE_DELAY = 5000;
const CUSTOM_BG_TASK_PREFIX = 'custom';
const EVENT_NAMESPACE = 'BX.Call.Component.v2.CallBackground.UploadManager';

export class UploadManager extends EventEmitter
{
	static allowedFileTypes = [
		'image/png',
		'image/jpg',
		'image/jpeg',
		'video/avi',
		'video/mp4',
		'video/quicktime',
	];

	static event = {
		uploadStart: 'uploadStart',
		uploadProgress: 'uploadProgress',
		uploadComplete: 'uploadComplete',
		uploadError: 'uploadError',
	};

	uploader: Uploader;
	diskFolderId: number;

	constructor(params: {inputNode: HTMLElement})
	{
		super();
		this.setEventNamespace(EVENT_NAMESPACE);

		const { inputNode } = params;
		this.uploader = new Uploader({
			inputNode,
			generatePreview: true,
			fileMaxSize: FILE_MAX_SIZE,
		});

		this.#bindEvents();
	}

	setDiskFolderId(diskFolderId: number)
	{
		this.diskFolderId = diskFolderId;
	}

	cancelUpload(fileId: string)
	{
		this.uploader.deleteTask(fileId);
	}

	// region events
	#bindEvents()
	{
		this.uploader.subscribe('onFileMaxSizeExceeded', this.#onFileMaxSizeExceeded.bind(this));
		this.uploader.subscribe('onSelectFile', this.#onSelectFile.bind(this));
		this.uploader.subscribe('onStartUpload', this.#onStartUpload.bind(this));
		this.uploader.subscribe('onProgress', this.#onProgress.bind(this));
		this.uploader.subscribe('onComplete', this.#onComplete.bind(this));
		this.uploader.subscribe('onUploadFileError', this.#onUploadError.bind(this));
		this.uploader.subscribe('onCreateFileError', this.#onUploadError.bind(this));
	}

	#onFileMaxSizeExceeded(event)
	{
		Logger.warn('UploadManager: onFileMaxSizeExceeded', event);
		const eventData = event.getData();
		const { file } = eventData;

		Notifier.call.onBackgroundFileSizeError({
			fileName: file.name,
			fileSizeLimit: FILE_MAX_SIZE_PHRASE_NUMBER,
		});
	}

	#onSelectFile(event)
	{
		Logger.warn('UploadManager: onSelectFile', event);
		const { file, previewData } = event.getData();

		if (!this.#isAllowedType(file.type) || !previewData)
		{
			Notifier.call.onBackgroundUnsupportedError(file.name);

			return;
		}

		this.#addUploadTask(file, previewData);
	}

	#onStartUpload(event)
	{
		Logger.warn('UploadManager: onStartUpload', event);
		const { previewData, id, file } = event.getData();

		const filePreview = URL.createObjectURL(previewData);
		this.emit(UploadManager.event.uploadStart, {
			id,
			filePreview,
			file,
		});
	}

	#onProgress(event)
	{
		Logger.warn('UploadManager: onProgress', event);
		const { id, progress } = event.getData();
		this.emit(UploadManager.event.uploadProgress, {
			id,
			progress,
		});
	}

	#onComplete(event)
	{
		Logger.warn('UploadManager: onComplete', event);
		const { id, result } = event.getData();
		this.emit(UploadManager.event.uploadComplete, {
			id,
			fileResult: result.data.file,
		});
	}

	#onUploadError(event)
	{
		Logger.warn('UploadManager: onUploadError', event);
		const eventData = event.getData();
		this.emit(UploadManager.event.uploadError, { id: eventData.id });
	}
	// endregion events

	#addUploadTask(file: File, previewData)
	{
		this.uploader.addTask({
			taskId: `${CUSTOM_BG_TASK_PREFIX}:${Date.now()}`,
			chunkSize: UPLOAD_CHUNK_SIZE,
			fileData: file,
			fileName: file.name,
			diskFolderId: this.diskFolderId,
			generateUniqueName: true,
			previewBlob: previewData,
		});
	}

	#isAllowedType(fileType: string): boolean
	{
		return UploadManager.allowedFileTypes.includes(fileType);
	}
}
