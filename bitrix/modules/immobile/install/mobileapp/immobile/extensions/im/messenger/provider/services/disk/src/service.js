/**
 * @module im/messenger/provider/services/disk/service
 */
jn.define('im/messenger/provider/services/disk/service', (require, exports, module) => {
	const { Logger } = require('im/messenger/lib/logger');
	const { RestMethod } = require('im/messenger/const');

	/**
	 * @class DiskService
	 */
	class DiskService
	{
		delete({ chatId, fileId })
		{
			const queryParams = {
				chat_id: chatId,
				file_id: fileId,
			};

			return BX.rest.callMethod(RestMethod.imDiskFileDelete, queryParams).catch((error) => {
				Logger.error('DiskService.delete error: ', error);
				throw new Error(error);
			});
		}

		/**
		 * @param {Array<number>} fileIds
		 * @returns {*}
		 */
		save(fileIds)
		{
			const ids = fileIds && !Array.isArray(fileIds) ? [fileIds] : fileIds;
			const queryParams = { ids };

			return BX.rest.callMethod(RestMethod.imV2DiskFileSave, queryParams).catch((error) => {
				Logger.error('DiskService.save error: ', error);
				throw new Error(error);
			});
		}
	}

	module.exports = {
		DiskService,
	};
});
