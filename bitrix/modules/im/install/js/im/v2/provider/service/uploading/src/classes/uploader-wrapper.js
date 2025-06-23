import { BaseEvent, EventEmitter } from 'main.core.events';
import { Uploader, UploaderEvent } from 'ui.uploader.core';

import { EventType } from 'im.v2.const';

import type { UploaderFile } from 'ui.uploader.core';
import type { MessageWithFile } from '../types/uploading';

export type UploaderWrapperOptions = {
	diskFolderId: number,
	uploaderId: string,
	chatId: number,
	dialogId: string,
	autoUpload: boolean,
	maxParallelLoads: number,
	maxParallelUploads: number,
}

const MAX_FILES_IN_ONE_MESSAGE = 10;

export class UploaderWrapper extends EventEmitter
{
	#uploaderRegistry: {[uploaderId: string]: Uploader} = {};
	#onUploadCancelHandler: Function;

	static eventNamespace = 'BX.Messenger.v2.Service.Uploading.UploaderWrapper';

	static events = {
		onFileAddStart: 'onFileAddStart',
		onFileAdd: 'onFileAdd',
		onFileUploadStart: 'onFileUploadStart',
		onFileUploadProgress: 'onFileUploadProgress',
		onFileUploadComplete: 'onFileUploadComplete',
		onFileUploadError: 'onFileUploadError',
		onFileUploadCancel: 'onFileUploadCancel',
		onMaxFileCountExceeded: 'onMaxFileCountExceeded',
		onUploadComplete: 'onUploadComplete',
	};

	constructor()
	{
		super();
		this.setEventNamespace(UploaderWrapper.eventNamespace);

		this.#onUploadCancelHandler = this.#onUploadCancel.bind(this);
		EventEmitter.subscribe(EventType.uploader.cancel, this.#onUploadCancelHandler);
	}

	createUploader(options: UploaderWrapperOptions)
	{
		const {
			diskFolderId,
			uploaderId,
			chatId,
			dialogId,
			autoUpload = false,
			maxParallelLoads,
			maxParallelUploads,
		} = options;

		this.#uploaderRegistry[uploaderId] = new Uploader({
			autoUpload,
			maxParallelLoads,
			maxParallelUploads,
			controller: 'disk.uf.integration.diskUploaderController',
			multiple: true,
			controllerOptions: {
				folderId: diskFolderId,
				chat: {
					chatId,
					dialogId,
				},
			},
			imageResizeWidth: 1280,
			imageResizeHeight: 1280,
			imageResizeMode: 'contain',
			imageResizeFilter: (file: UploaderFile) => {
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
				[UploaderEvent.FILE_ADD_START]: (event) => {
					this.emit(UploaderWrapper.events.onFileAddStart, { ...event.getData(), uploaderId });
				},
				[UploaderEvent.FILE_UPLOAD_START]: (event) => {
					this.emit(UploaderWrapper.events.onFileUploadStart, { ...event.getData(), uploaderId });
				},
				[UploaderEvent.FILE_ADD]: (event) => {
					this.emit(UploaderWrapper.events.onFileAdd, { ...event.getData(), uploaderId });
				},
				[UploaderEvent.FILE_UPLOAD_PROGRESS]: (event) => {
					this.emit(UploaderWrapper.events.onFileUploadProgress, { ...event.getData(), uploaderId });
				},
				[UploaderEvent.FILE_UPLOAD_COMPLETE]: (event) => {
					this.emit(UploaderWrapper.events.onFileUploadComplete, { ...event.getData(), uploaderId });
				},
				[UploaderEvent.ERROR]: (event) => {
					this.emit(UploaderWrapper.events.onFileUploadError, { ...event.getData(), uploaderId });
				},
				[UploaderEvent.FILE_ERROR]: (event) => {
					this.emit(UploaderWrapper.events.onFileUploadError, { ...event.getData(), uploaderId });
				},
				[UploaderEvent.MAX_FILE_COUNT_EXCEEDED]: (event) => {
					this.emit(UploaderWrapper.events.onMaxFileCountExceeded, { ...event.getData(), uploaderId });
				},
				[UploaderEvent.UPLOAD_COMPLETE]: (event) => {
					this.emit(UploaderWrapper.events.onUploadComplete, { ...event.getData(), uploaderId });
				},
			},
		});
	}

	start(uploaderId: string)
	{
		this.#uploaderRegistry[uploaderId].setAutoUpload(true);
		this.#uploaderRegistry[uploaderId].start();
	}

	stop(uploaderId: string)
	{
		this.#uploaderRegistry[uploaderId].stop();
	}

	destroyUploader(uploaderId: string)
	{
		this.#uploaderRegistry[uploaderId].destroy({ removeFilesFromServer: false });
		delete this.#uploaderRegistry[uploaderId];
	}

	addFiles(tasks: MessageWithFile[]): UploaderFile[]
	{
		const firstTenTasks = tasks.slice(0, MAX_FILES_IN_ONE_MESSAGE);

		const addedFiles = [];
		firstTenTasks.forEach((task) => {
			const file = this.#addFile(task);
			if (file)
			{
				addedFiles.push(file);
			}
		});

		return addedFiles;
	}

	getFiles(uploaderId): UploaderFile[]
	{
		return this.#uploaderRegistry[uploaderId].getFiles();
	}

	#addFile(task: MessageWithFile): ?UploaderFile
	{
		return this.#uploaderRegistry[task.uploaderId].addFile(
			task.file,
			{
				id: task.tempFileId,
				customData: {
					dialogId: task.dialogId,
					chatId: task.chatId,
					tempMessageId: task.tempMessageId,
					sendAsFile: task.sendAsFile,
				},
			},
		);
	}

	#onUploadCancel(event: BaseEvent)
	{
		const { tempFileId, tempMessageId } = event.getData();
		if (!tempFileId || !tempMessageId)
		{
			return;
		}

		this.#removeFileFromUploader(tempFileId);
		this.emit(UploaderWrapper.events.onFileUploadCancel, { tempMessageId, tempFileId });
	}

	#removeFileFromUploader(tempFileId: string)
	{
		const uploaderList = Object.values(this.#uploaderRegistry);
		for (const uploader of uploaderList)
		{
			if (!uploader.getFile)
			{
				continue;
			}

			const file = uploader.getFile(tempFileId);
			if (file)
			{
				file.remove();

				break;
			}
		}
	}

	destroy()
	{
		EventEmitter.unsubscribe(EventType.uploader.cancel, this.#onUploadCancelHandler);
	}
}
