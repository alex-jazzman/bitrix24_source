/**
 * @module im/messenger/controller/dialog/lib/sticker/src/service/upload-queue
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/service/upload-queue', (require, exports, module) => {
	const { Type } = require('type');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { StickerUploadService, UploaderEvents } = require('im/messenger/provider/services/upload/sticker');

	const { UploadStatus } = require('im/messenger/controller/dialog/lib/sticker/src/const');

	const logger = getLoggerWithContext('dialog--sticker', 'StickerUploadQueue');

	/**
	 * @class StickerUploadQueue
	 */
	class StickerUploadQueue
	{
		/** @type {Array<Array<UploadingStickerData>>} */
		#chunkUploadQueue = [];
		/** @type {Map<string, UploadingStickerData>} */
		#currentChunk = new Map();
		/** @type {Map<string, UploadingStickerData>} */
		#errorCollection = new Map();
		/** @type {StickerUploadService} */
		#uploader;

		/**
		 * @param {(stickerId: string, percent: number) => void} onUploadProgress
		 * @param {(stickerId: string, serverFileId: string) => void} onUploadComplete
		 * @param {(stickerId: string, errors: Array<{code, message, desctiption}>) => void} onUploadError
		 */
		constructor({
			onUploadProgress,
			onUploadComplete,
			onUploadError,
		})
		{
			this.onUploadProgress = onUploadProgress;
			this.onUploadComplete = onUploadComplete;
			this.onUploadError = onUploadError;
			this.#uploader = StickerUploadService.getInstance();

			this.#setupUploadHandlers();
		}

		/**
		 * @param {Array<UploadingStickerData>} stickers
		 */
		uploadStickers(stickers)
		{
			this.#addStickersToQueue(stickers);
		}

		/**
		 * @param {Array<UploadingStickerData>} uploadStickersData
		 */
		#addStickersToQueue(uploadStickersData)
		{
			if (this.#currentChunk.size === 0)
			{
				this.#startUploadChunk(uploadStickersData);
			}
			else
			{
				this.#chunkUploadQueue.push(uploadStickersData);
			}
		}

		uploadErrorSticker(stickerId)
		{
			const uploadData = this.#errorCollection.get(stickerId);
			this.#errorCollection.delete(stickerId);

			this.#addStickersToQueue([uploadData]);
		}

		subscribeUploaderEvents()
		{
			this.#uploader.on(UploaderEvents.progress, this.uploadProgressHandler);
			this.#uploader.on(UploaderEvents.complete, this.uploadCompleteHandler);
			this.#uploader.on(UploaderEvents.error, this.uploadErrorHandler);
		}

		unsubscribeUploaderEvents()
		{
			this.#uploader.off(UploaderEvents.progress, this.uploadProgressHandler);
			this.#uploader.off(UploaderEvents.complete, this.uploadCompleteHandler);
			this.#uploader.off(UploaderEvents.error, this.uploadErrorHandler);
		}

		#setupUploadHandlers()
		{
			this.uploadProgressHandler = (data) => {
				const { stickerId, percent } = data;

				logger.log('uploadProgressHandler', data);
				this.onUploadProgress?.(stickerId, percent);
			};

			this.uploadCompleteHandler = (data) => {
				const { stickerId, serverFileId } = data;

				this.#updateStickerStatus(stickerId, UploadStatus.complete, serverFileId);

				logger.info('uploadCompleteHandler', data);
				this.onUploadComplete?.(stickerId, serverFileId);

				if (this.#isCurrentChunkComplete())
				{
					this.#processNextChunk();
				}
			};

			this.uploadErrorHandler = (data) => {
				const { stickerId, errors } = data;
				this.#updateStickerStatus(stickerId, UploadStatus.error);
				this.#errorCollection.set(stickerId, this.#currentChunk.get(stickerId));

				logger.error('uploadErrorHandler', data);
				this.onUploadError?.(stickerId, Type.isArray(errors) ? errors[0] : errors);

				if (this.#isCurrentChunkComplete())
				{
					this.#processNextChunk();
				}
			};
		}

		/**
		 * @param {Array<UploadingStickerData>} chunk
		 */
		#startUploadChunk(chunk)
		{
			this.#currentChunk = new Map(chunk.map((item) => [item.stickerId, item]));

			this.#uploader.uploadStickers(chunk).catch((error) => {
				logger.error('uploadStickers error', error);
				this.#handleUploadError(chunk, error);
			});
		}

		#handleUploadError(chunk)
		{
			chunk.forEach((item) => {
				item.status = UploadStatus.error;
				this.#errorCollection.set(item.stickerId, item);
			});
			this.#currentChunk.clear();
			this.#processNextChunk();
		}

		#processNextChunk()
		{
			this.#currentChunk.clear();
			if (this.#chunkUploadQueue.length > 0)
			{
				const chunk = this.#chunkUploadQueue.shift();
				this.#startUploadChunk(chunk);
			}
		}

		#updateStickerStatus(stickerId, status, serverFileId = null)
		{
			const sticker = this.#currentChunk.get(stickerId);
			if (sticker)
			{
				sticker.status = status;
				if (serverFileId)
				{
					sticker.serverFileId = serverFileId;
				}
			}
		}

		#isCurrentChunkComplete()
		{
			return [...this.#currentChunk.values()].every((item) => item.status !== UploadStatus.progress);
		}
	}

	module.exports = { StickerUploadQueue };
});
