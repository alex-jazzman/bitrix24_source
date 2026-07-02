/**
 * @module im/messenger/db/update/version/32
 */
jn.define('im/messenger/db/update/version/32', (require, exports, module) => {
	const { DialogTable } = require('im/messenger/db/table');

	/**
	 * @param {Updater} updater
	 */
	module.exports = async (updater) => {
		await updater.ifTableExists(DialogTable, async () => {
			await updater.ifColumnNotExists(DialogTable, 'parentChatId', async () => {
				await updater.addColumn(DialogTable, 'parentChatId');
			});

			await updater.ifColumnExists(DialogTable, 'parentChatId', async () => {
				await updater.executeSql({
					query: 'UPDATE b_im_dialog SET parentChatId = 0',
				});
			});

			await updater.ifColumnNotExists(DialogTable, 'parentMessageId', async () => {
				await updater.addColumn(DialogTable, 'parentMessageId');
			});

			await updater.ifColumnExists(DialogTable, 'parentMessageId', async () => {
				await updater.executeSql({
					query: 'UPDATE b_im_dialog SET parentMessageId = 0',
				});
			});
		});
	};
});
