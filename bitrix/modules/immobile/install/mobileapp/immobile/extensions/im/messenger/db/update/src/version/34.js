/**
 * @module im/messenger/db/update/version/34
 */
jn.define('im/messenger/db/update/version/34', (require, exports, module) => {
	const { DialogTable } = require('im/messenger/db/table');

	/**
	 * @param {Updater} updater
	 */
	module.exports = async (updater) => {
		await updater.ifTableExists(DialogTable, async () => {
			await updater.ifColumnNotExists(DialogTable, 'guestCount', async () => {
				await updater.addColumn(DialogTable, 'guestCount');
			});
		});
	};
});
