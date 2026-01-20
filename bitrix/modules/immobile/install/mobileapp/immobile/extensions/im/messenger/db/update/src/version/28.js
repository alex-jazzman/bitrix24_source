/**
 * @module im/messenger/db/update/version/28
 */
jn.define('im/messenger/db/update/version/28', (require, exports, module) => {
	const { MessageTable, LinkPinMessageTable } = require('im/messenger/db/table');

	/**
	 * @param {Updater} updater
	 */
	module.exports = async (updater) => {
		const isMessageTableExist = await updater.isTableExists('b_im_message');

		if (isMessageTableExist === true)
		{
			await updater.addColumnIfNotExists(MessageTable, 'stickerParams');
		}

		const isLinkPinMessageTableExist = await updater.isTableExists('b_im_link_pin_message');

		if (isLinkPinMessageTableExist === true)
		{
			await updater.addColumnIfNotExists(LinkPinMessageTable, 'stickerParams');
		}
	};
});