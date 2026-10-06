/**
 * @module im/messenger/db/update/version/33
 */
jn.define('im/messenger/db/update/version/33', (require, exports, module) => {
	const { RecentTable } = require('im/messenger/db/table');

	/**
	 * @param {Updater} updater
	 */
	module.exports = async (updater) => {
		await updater.ifTableExists(RecentTable, async () => {
			await updater.ifColumnNotExists(RecentTable, 'ownMessage', async () => {
				await updater.addColumn(RecentTable, 'ownMessage');
			});
		});
	};
});
