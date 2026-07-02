/**
 * @module im/messenger/db/update/version/31
 */
jn.define('im/messenger/db/update/version/31', (require, exports, module) => {
	const { MessageTable } = require('im/messenger/db/table');

	/**
	 * @param {Updater} updater
	 */
	module.exports = async (updater) => {
		const isMessageTableExist = await updater.isTableExists('b_im_message');

		if (isMessageTableExist === true)
		{
			await updater.addColumnIfNotExists(MessageTable, 'builder');
		}
	};
});
