/**
 * @module im/messenger/controller/dialog/lib/sticker/src/service/factory
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/service/factory', (require, exports, module) => {
	const { Uuid } = require('utils/uuid');

	const { UploadStatus } = require('im/messenger/controller/dialog/lib/sticker/src/const');

	/**
	 * @class StickerFactory
	 */
	class StickerFactory
	{
		/**
		 * @param {DeviceFile} file
		 * @return {UploadingStickerData}
		 */
		static createUploadData(file)
		{
			return {
				stickerId: Uuid.getV4(),
				status: UploadStatus.progress,
				serverFileId: null,
				localUrl: file.url,
				progress: 0,
			};
		}
	}

	module.exports = { StickerFactory };
});
