/**
 * @module im/messenger/db/update/version/36
 */
jn.define('im/messenger/db/update/version/36', (require, exports, module) => {
	const { CommentTable } = require('im/messenger/db/table');

	/**
	 * @param {Updater} updater
	 */
	module.exports = async (updater) => {
		await updater.ifTableExists(CommentTable, async () => {
			await updater.ifColumnNotExists(CommentTable, 'messageCount', async () => {
				await updater.addColumn(CommentTable, 'messageCount');
			});

			await updater.ifColumnNotExists(CommentTable, 'lastUserIds', async () => {
				await updater.addColumn(CommentTable, 'lastUserIds');
			});
		});
	};
});
