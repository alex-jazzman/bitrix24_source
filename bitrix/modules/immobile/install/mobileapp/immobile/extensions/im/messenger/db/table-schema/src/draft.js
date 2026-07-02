/**
 * @module im/messenger/db/table-schema/src/draft
 */
jn.define('im/messenger/db/table-schema/src/draft', (require, exports, module) => {
	const {
		StringField,
		DateField,
		ObjectField,
		ArrayField,
	} = require('im/messenger/db/schema/field');
	const { BaseSchema } = require('im/messenger/db/schema/base-schema');

	/**
	 * Schema for `b_im_draft` — message drafts per dialog.
	 *
	 * Legacy-parity with native DDL: nullable-by-default, no SQL DEFAULT clause.
	 *
	 * `message`, `image`, `video` were `FieldType.json` with `emptyArray` default -> ArrayField.
	 */
	class DraftSchema extends BaseSchema
	{
		static dialogId = new StringField('dialogId').configurePrimary();
		static messageId = new StringField('messageId');
		static lastActivityDate = new DateField('lastActivityDate');
		static messageType = new StringField('messageType');
		static type = new StringField('type');
		static text = new StringField('text');
		static userName = new StringField('userName');
		static message = new ArrayField('message');
		static image = new ArrayField('image');
		static video = new ArrayField('video');

		static getTableName()
		{
			return 'b_im_draft';
		}

		static getMap()
		{
			return this.mapCache ??= [
				this.dialogId,
				this.messageId,
				this.lastActivityDate,
				this.messageType,
				this.type,
				this.text,
				this.userName,
				this.message,
				this.image,
				this.video,
			];
		}
	}

	module.exports = { DraftSchema };
});
