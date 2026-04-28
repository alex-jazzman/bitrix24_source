/**
 * @module im/messenger/db/update/version/30
 */
jn.define('im/messenger/db/update/version/30', (require, exports, module) => {
	const { CounterPendingOperationInternalTable, CounterTable } = require('im/messenger/db/table');
	/**
	 * @param {Updater} updater
	 */
	module.exports = async (updater) => {
		await updater.ifTableExists(CounterTable, () => {
			return updater.ifColumnNotExists(
				CounterTable,
				'recentSections',
				() => updater.dropTable('b_im_counter'),
			);
		});

		new CounterTable().createDatabaseTableInstance();
		new CounterPendingOperationInternalTable().createDatabaseTableInstance();
	};
});
