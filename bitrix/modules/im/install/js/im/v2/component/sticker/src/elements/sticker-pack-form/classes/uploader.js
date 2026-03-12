import { EventEmitter } from 'main.core.events';
import { FilterType, UploaderEvent } from 'ui.uploader.core';

import { UploaderFilter } from './uploader-filter';

import type { UploaderOptions } from 'ui.uploader.core';

const CONTROLLER_ACTION = 'im.v2.controller.sticker.stickerUploader';
const MAX_FILES_COUNT = 50;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const FILE_TYPES = ['image/jpg', 'image/jpeg', 'image/png', 'image/webp'];

export class Uploader extends EventEmitter
{
	#fileIds: Set<string> = new Set();
	static UPLOAD_EVENT = 'uploadedFiles';

	constructor()
	{
		super();
		this.setEventNamespace('BX.Messenger.v2.Textarea.StickersUploader');
	}

	getOptions(): UploaderOptions
	{
		return {
			controller: CONTROLLER_ACTION,
			multiple: true,
			maxFileCount: MAX_FILES_COUNT,
			autoUpload: true,
			maxFileSize: MAX_FILE_SIZE,
			acceptedFileTypes: FILE_TYPES,
			events: {
				[UploaderEvent.FILE_COMPLETE]: (event) => {
					const { file } = event.getData();
					const id = file.getServerFileId();
					if (id)
					{
						this.#fileIds.add(id);
						this.emit(Uploader.UPLOAD_EVENT, [...this.#fileIds.values()]);
					}
				},
				[UploaderEvent.FILE_REMOVE]: (event) => {
					const { file } = event.getData();
					const id = file.getServerFileId();
					if (id)
					{
						this.#fileIds.delete(id);
						this.emit(Uploader.UPLOAD_EVENT, [...this.#fileIds.values()]);
					}
				},
			},
			filters: [
				{
					type: FilterType.PREPARATION,
					filter: UploaderFilter,
				},
			],
		};
	}
}
