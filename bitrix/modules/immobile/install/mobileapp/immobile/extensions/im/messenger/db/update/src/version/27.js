/**
 * @module im/messenger/db/update/version/27
 */
jn.define('im/messenger/db/update/version/27', (require, exports, module) => {
	const { FileTable } = require('im/messenger/db/table');

	/**
	 * @param {Updater} updater
	 */
	module.exports = async (updater) => {
		const isFileTableExist = await updater.isTableExists('b_im_file');

		if (isFileTableExist === true)
		{
			await updater.addColumnIfNotExists(FileTable, 'isVideoNote');
			await updater.addColumnIfNotExists(FileTable, 'isVoiceNote');
		}
	};
});
