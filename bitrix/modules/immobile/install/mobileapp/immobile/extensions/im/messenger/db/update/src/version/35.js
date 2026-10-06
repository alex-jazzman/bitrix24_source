/**
 * @module im/messenger/db/update/version/35
 */
jn.define('im/messenger/db/update/version/35', (require, exports, module) => {
	const { UserTable } = require('im/messenger/db/table');

	/**
	 * @param {Updater} updater
	 */
	module.exports = async (updater) => {
		await updater.ifTableExists(UserTable, async () => {
			await updater.ifColumnNotExists(UserTable, 'active', async () => {
				await updater.addColumn(UserTable, 'active');
			});

			await updater.ifColumnExists(UserTable, 'active', async () => {
				await updater.executeSql({
					query: 'UPDATE b_im_user SET active = 1',
				});
			});
		});
	};
});
