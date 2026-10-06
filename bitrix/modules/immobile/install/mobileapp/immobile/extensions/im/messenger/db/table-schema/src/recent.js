/**
 * @module im/messenger/db/table-schema/src/recent
 */
jn.define('im/messenger/db/table-schema/src/recent', (require, exports, module) => {
	const {
		StringField,
		DateField,
		BooleanField,
		ObjectField,
	} = require('im/messenger/db/schema/field');
	const { FieldDefaultValue } = require('im/messenger/db/const');
	const { Index } = require('im/messenger/db/schema/index');
	const { BaseSchema } = require('im/messenger/db/schema/base-schema');

	/**
	 * @class RecentSchema
	 */
	class RecentSchema extends BaseSchema
	{
		static id = new StringField('id').configurePrimary();
		static lastActivityDate = new DateField('lastActivityDate');
		static message = new ObjectField('message');
		static ownMessage = new ObjectField('ownMessage');
		static dateMessage = new DateField('dateMessage');
		static unread = new BooleanField('unread');
		static pinned = new BooleanField('pinned');
		static invitation = new ObjectField('invitation')
			.configureDefaultValue(FieldDefaultValue.emptyObject);
		static options = new ObjectField('options');

		static getTableName()
		{
			return 'b_im_recent';
		}

		/** @protected */
		static getMap()
		{
			return [
				this.id,
				this.lastActivityDate,
				this.message,
				this.ownMessage,
				this.dateMessage,
				this.unread,
				this.pinned,
				this.invitation,
				this.options,
			];
		}

		static getIndexes()
		{
			return [
				new Index([this.lastActivityDate]),
			];
		}
	}

	module.exports = { RecentSchema };
});
