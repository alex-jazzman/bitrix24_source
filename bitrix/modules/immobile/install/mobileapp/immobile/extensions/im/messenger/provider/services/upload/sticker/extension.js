/**
 * @module im/messenger/provider/services/upload/sticker
 */
jn.define('im/messenger/provider/services/upload/sticker', (require, exports, module) => {
	const { Filesystem } = require('native/filesystem');

	const { Uuid } = require('utils/uuid');
	const { UploaderClient } = require('uploader/client');
	const { FileConverter } = require('files/converter');

	const { StickerUploadTask } = require('im/messenger/provider/services/upload/sticker/task');

	const UploaderEvents = {
		progress: 'progress',
		complete: 'complete',
		error: 'error',
	};

	/**
	 * @class StickerUploadService
	 */
	class StickerUploadService
	{
		static #instance;

		/**
		 * @return {StickerUploadService}
		 */
		static getInstance()
		{
			this.#instance = this.#instance ?? new StickerUploadService();

			return this.#instance;
		}

		constructor()
		{
			this.uploaderClient = new UploaderClient();
			this.emitter = new JNEventEmitter();
			this.converter = new FileConverter();

			this.#subscribeClientEvents();
		}

		/**
		 * @param {Array<UploadingStickerData>} stickers
		 * @return {Promise<void>}
		 */
		async uploadStickers(stickers)
		{
			for (const sticker of stickers)
			{
				const deviceFileUrl = sticker.localUrl;
				const fileInfo = await Filesystem.getFile(deviceFileUrl);

				const taskOptions = {
					taskId: Uuid.getV4(),
					resize: {
						height: 512,
						width: 512,
						quality: 80,
					},
					type: fileInfo.type,
					mimeType: fileInfo.type,
					name: fileInfo.name,
					url: deviceFileUrl,
					params: {
						stickerId: sticker.stickerId,
					},
				};

				const task = new StickerUploadTask(taskOptions);
				this.uploaderClient.addTask(task);
			}
		}

		on(event, handler)
		{
			this.emitter.on(event, handler);
		}

		emit(event, data)
		{
			this.emitter.emit(event, [data]);
		}

		off(event, handler)
		{
			this.emitter.off(event, handler);
		}

		#subscribeClientEvents()
		{
			this.uploaderClient.on('progress', (taskId, data) => {
				const { percent, file } = data;

				const eventData = {
					...file.params,
					percent,
				};

				this.emitter.emit(UploaderEvents.progress, [eventData]);
			});

			this.uploaderClient.on('done', (taskId, data) => {
				const { file, result } = data;

				const eventData = {
					...file.params,
					serverFileId: result.data.file.serverFileId,
				};

				this.emit(UploaderEvents.complete, eventData);

			});

			this.uploaderClient.on('error', (taskId, data) => {
				const { file, error } = data;

				this.emit(UploaderEvents.error, { ...file.params, errors: error.errors });
			});
		}
	}

	module.exports = { StickerUploadService, UploaderEvents };
});
