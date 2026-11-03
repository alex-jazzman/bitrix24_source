/**
 * @module im/messenger/db/update/version/37
 */
jn.define('im/messenger/db/update/version/37', (require, exports, module) => {
	/**
	 * @param {Updater} updater
	 */
	module.exports = async (updater) => {
		const tableName = 'b_im_folder';
		const columnName = 'visible';

		const isTableExists = await updater.isTableExists(tableName);
		if (!isTableExists)
		{
			return;
		}

		const isColumnExists = await updater.isColumnExists(tableName, columnName);
		if (!isColumnExists)
		{
			// SQLite fills existing rows with the column DEFAULT, so there is no explicit
			// backfill: on a replay it would turn hidden folders visible again.
			await updater.executeSql({
				query: "ALTER TABLE b_im_folder ADD COLUMN visible TEXT DEFAULT '1'",
			});
		}
	};
});
