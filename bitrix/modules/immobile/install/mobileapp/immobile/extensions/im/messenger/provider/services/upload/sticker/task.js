/**
 * @module im/messenger/provider/services/upload/sticker/task
 */
jn.define('im/messenger/provider/services/upload/sticker/task', (require, exports, module) => {
	const { getUploadFileChunkSize } = require('im/messenger/lib/helper');

	/**
	 * @class StickerUploadTask
	 */
	class StickerUploadTask
	{
		constructor({
			taskId,
			resize,
			type,
			mimeType,
			params,
			name,
			url,
		})
		{
			const chunkSize = getUploadFileChunkSize();

			this.taskId = taskId;
			this.controller = 'im.v2.controller.sticker.stickerUploader';
			// this.resize = resize;
			this.type = type;
			this.mimeType = mimeType;
			this.chunk = chunkSize;
			this.params = params;
			this.name = name;
			this.url = url;
		}
	}

	module.exports = { StickerUploadTask };
});
