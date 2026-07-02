/**
 * @module im/messenger/db/table-schema/src/folder
 */
jn.define('im/messenger/db/table-schema/src/folder', (require, exports, module) => {
	const {
		IntegerField,
		StringField,
	} = require('im/messenger/db/schema/field');
	const { FieldDefaultValue } = require('im/messenger/db/const');
	const { Index } = require('im/messenger/db/schema/index');
	const { BaseSchema } = require('im/messenger/db/schema/base-schema');

	class FolderSchema extends BaseSchema
	{
		static id = new IntegerField('id').configurePrimary();
		static parentChatId = new IntegerField('parentChatId')
			.configureDefaultValue(FieldDefaultValue.zeroInteger);
		static type = new StringField('type').configureDefaultValue('personal');
		static code = new StringField('code');
		static title = new StringField('title')
			.configureDefaultValue(FieldDefaultValue.emptyText);
		static sort = new IntegerField('sort')
			.configureDefaultValue(FieldDefaultValue.zeroInteger);
		static recentSection = new StringField('recentSection');

		static getTableName()
		{
			return 'b_im_folder';
		}

		/** @protected */
		static getMap()
		{
			return [
				this.id,
				this.parentChatId,
				this.type,
				this.code,
				this.title,
				this.sort,
				this.recentSection,
			];
		}

		static getIndexes()
		{
			return [
				new Index([this.parentChatId]),
				new Index([this.sort]),
			];
		}
	}

	module.exports = { FolderSchema };
});
