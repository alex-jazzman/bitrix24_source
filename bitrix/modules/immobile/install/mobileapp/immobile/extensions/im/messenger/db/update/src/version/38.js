/**
 * @module im/messenger/db/update/version/38
 */
jn.define('im/messenger/db/update/version/38', (require, exports, module) => {
	/**
	 * @param {Updater} updater
	 */
	module.exports = async (updater) => {
		const tableName = 'b_im_folder';
		const columnName = 'description';

		const isTableExists = await updater.isTableExists(tableName);
		if (!isTableExists)
		{
			return;
		}

		const isColumnExists = await updater.isColumnExists(tableName, columnName);
		if (!isColumnExists)
		{
			// The description is a server-side text, so existing rows are left empty:
			// they get the value with the first folder snapshot written after the update.
			await updater.executeSql({
				query: 'ALTER TABLE b_im_folder ADD COLUMN description TEXT',
			});
		}
	};
});
