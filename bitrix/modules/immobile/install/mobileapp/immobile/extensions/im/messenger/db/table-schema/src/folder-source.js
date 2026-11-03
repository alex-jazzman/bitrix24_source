/**
 * @module im/messenger/db/table-schema/src/folder-source
 */
jn.define('im/messenger/db/table-schema/src/folder-source', (require, exports, module) => {
	const { IntegerField, StringField } = require('im/messenger/db/schema/field');
	const { Index } = require('im/messenger/db/schema/index');
	const { BaseSchema } = require('im/messenger/db/schema/base-schema');

	/**
	 * Schema for `b_im_folder_source` - the source composition of the 'all' folder.
	 *
	 * Pure set of codes: a row means the source folder is included (no SORT - order
	 * comes from the backend registry). Composite PK (folderId, sourceFolderCode)
	 * guarantees uniqueness; extra index on folderId speeds up per-folder rebuild.
	 * Auto-created by ensureSchema (BaseSchema, CREATE TABLE IF NOT EXISTS) - no migration.
	 */
	class FolderSourceSchema extends BaseSchema
	{
		static folderId = new IntegerField('folderId').configurePrimary().configureNullable(false);
		static sourceFolderCode = new StringField('sourceFolderCode').configurePrimary().configureNullable(false);

		static getTableName()
		{
			return 'b_im_folder_source';
		}

		/** @protected */
		static getMap()
		{
			return [
				this.folderId,
				this.sourceFolderCode,
			];
		}

		static getIndexes()
		{
			return [
				new Index([this.folderId]),
			];
		}
	}

	module.exports = { FolderSourceSchema };
});
