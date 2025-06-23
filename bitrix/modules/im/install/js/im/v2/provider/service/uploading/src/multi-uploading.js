import { Utils } from 'im.v2.lib.utils';
import { Type } from 'main.core';
import { getFilesFromDataTransfer, isFilePasted, UploaderFile } from 'ui.uploader.core';
import { UploadingService } from './uploading';

import type {
	UploadFilesParams,
	UploadFromClipboardParams,
	UploadFromDragAndDrop,
	UploadFromInputParams,
} from './types/uploading';

type AddFilesResult = {
	uploaderFiles: Array<UploaderFile>,
	uploaderId: string,
};

type MakeChunksOptions<T> = {
	files: Array<T>,
	chunkSize?: number,
	maxFilesCount?: number,
};

export type MultiUploadingResult = {
	uploaderIds: Array<string>,
	sourceFilesCount: number,
};

const MAX_FILES_COUNT_IN_ONE_MESSAGE = 10;
const MAX_FILES_COUNT = 100;
const MAX_PARALLEL_LOADS = 10;
const MAX_PARALLEL_UPLOADS = 3;

export class MultiUploadingService
{
	static makeChunks<T>(options: MakeChunksOptions): Array<Array<T>>
	{
		const {
			files,
			chunkSize = MAX_FILES_COUNT_IN_ONE_MESSAGE,
			maxFilesCount = MAX_FILES_COUNT,
		}: MakeChunksOptions = options;

		const chunks: Array<Array<T>> = [];
		if (Type.isArray(files))
		{
			const preparedFiles: Array<T> = files.slice(0, maxFilesCount);
			for (let i = 0; i < preparedFiles.length; i += chunkSize)
			{
				const chunk = preparedFiles.slice(i, i + chunkSize);
				chunks.push(chunk);
			}
		}

		return chunks;
	}

	static getMaxParallelLoads<T>(chunks: Array<Array<T>>): number
	{
		return Math.floor(MAX_PARALLEL_LOADS / chunks.length);
	}

	#getUploadingService(): UploadingService
	{
		return UploadingService.getInstance();
	}

	async addFiles(params: UploadFilesParams): Promise<AddFilesResult>
	{
		return this.#getUploadingService().addFiles(params);
	}

	async uploadFromInput(params: UploadFromInputParams): Promise<MultiUploadingResult>
	{
		const { event, sendAsFile, autoUpload, dialogId } = params;
		const rawFiles = Object.values(event.target.files);
		const chunks: Array<Array<File>> = MultiUploadingService.makeChunks({
			files: rawFiles,
		});

		const addFilesResults: Array<AddFilesResult> = await Promise.all(
			chunks.map((chunk: Array<File>) => {
				return this.addFiles({
					files: chunk,
					maxParallelLoads: MultiUploadingService.getMaxParallelLoads(chunks),
					maxParallelUploads: MAX_PARALLEL_UPLOADS,
					dialogId,
					autoUpload,
					sendAsFile,
				});
			}),
		);

		const uploaderIds: Array<string> = addFilesResults.map(({ uploaderId }) => {
			return uploaderId;
		});
		const sourceFilesCount: number = rawFiles.length;

		return {
			uploaderIds,
			sourceFilesCount,
		};
	}

	async uploadFromClipboard(params: UploadFromClipboardParams): Promise<MultiUploadingResult>
	{
		const { clipboardEvent, dialogId, autoUpload, imagesOnly } = params;

		const { clipboardData } = clipboardEvent;
		if (!clipboardData || !isFilePasted(clipboardData))
		{
			return {
				uploaderIds: [],
				sourceFilesCount: 0,
			};
		}

		clipboardEvent.preventDefault();

		let files: Array<File> = await getFilesFromDataTransfer(clipboardData);
		if (imagesOnly)
		{
			files = files.filter((file) => Utils.file.isImage(file.name));
			if (imagesOnly.length === 0)
			{
				return {
					uploaderIds: [],
					sourceFilesCount: 0,
				};
			}
		}

		const chunks: Array<Array<File>> = MultiUploadingService.makeChunks({
			files,
		});

		const addFilesResults: Array<AddFilesResult> = await Promise.all(
			chunks.map((chunk: Array<File>) => {
				return this.addFiles({
					files: chunk,
					maxParallelLoads: MultiUploadingService.getMaxParallelLoads(chunks),
					maxParallelUploads: MAX_PARALLEL_UPLOADS,
					dialogId,
					autoUpload,
				});
			}),
		);

		const uploaderIds: Array<string> = addFilesResults
			.filter((addFilesResult: AddFilesResult) => {
				return addFilesResult.uploaderFiles.length > 0;
			})
			.map(({ uploaderId }) => {
				return uploaderId;
			});
		const sourceFilesCount: number = files.length;

		return {
			uploaderIds,
			sourceFilesCount,
		};
	}

	async uploadFromDragAndDrop(params: UploadFromDragAndDrop): Promise<MultiUploadingResult>
	{
		const { event, dialogId, autoUpload, sendAsFile } = params;

		const rawFiles: Array<File> = await getFilesFromDataTransfer(event.dataTransfer);
		const chunks: Array<Array<File>> = MultiUploadingService.makeChunks({
			files: rawFiles,
		});

		const addFilesResults: Array<AddFilesResult> = await Promise.all(
			chunks.map((chunk: Array<File>) => {
				return this.addFiles({
					files: chunk,
					maxParallelLoads: MultiUploadingService.getMaxParallelLoads(chunks),
					maxParallelUploads: MAX_PARALLEL_UPLOADS,
					dialogId,
					autoUpload,
					sendAsFile,
				});
			}),
		);

		const uploaderIds: Array<string> = addFilesResults.map(({ uploaderId }) => {
			return uploaderId;
		});
		const sourceFilesCount: number = rawFiles.length;

		return {
			uploaderIds,
			sourceFilesCount,
		};
	}
}
