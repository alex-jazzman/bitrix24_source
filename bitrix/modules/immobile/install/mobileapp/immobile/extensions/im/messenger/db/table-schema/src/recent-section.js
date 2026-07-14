/**
 * @module im/messenger/db/table-schema/src/recent-section
 */
jn.define('im/messenger/db/table-schema/src/recent-section', (require, exports, module) => {
	const { StringField } = require('im/messenger/db/schema/field');
	const { Index } = require('im/messenger/db/schema/index');
	const { BaseSchema } = require('im/messenger/db/schema/base-schema');

	/**
	 * Schema for `b_im_recent_section` — many-to-many mapping between dialogs and recent sections.
	 *
	 * Composite PK on (dialogId, section) guarantees uniqueness and provides an implicit index.
	 * Additional index on `section` for efficient filtering by tab.
	 */
	class RecentSectionSchema extends BaseSchema
	{
		static dialogId = new StringField('dialogId').configurePrimary().configureNullable(false);
		static section = new StringField('section').configurePrimary().configureNullable(false);

		static getTableName()
		{
			return 'b_im_recent_section';
		}

		static getMap()
		{
			return this.mapCache ??= [
				this.dialogId,
				this.section,
			];
		}

		static getIndexes()
		{
			return [
				new Index([this.section]),
			];
		}
	}

	module.exports = { RecentSectionSchema };
});
