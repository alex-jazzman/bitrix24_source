/**
 * @module im/messenger/db/table-schema/src/dialog
 */
jn.define('im/messenger/db/table-schema/src/dialog', (require, exports, module) => {
	const {
		IntegerField,
		StringField,
		DateField,
		BooleanField,
		ObjectField,
		ArrayField,
	} = require('im/messenger/db/schema/field');
	const { FieldDefaultValue } = require('im/messenger/db/const');
	const { BaseSchema } = require('im/messenger/db/schema/base-schema');

	/**
	 * @class DialogSchema
	 */
	class DialogSchema extends BaseSchema
	{
		static dialogId = new StringField('dialogId').configurePrimary();
		static chatId = new IntegerField('chatId');
		static type = new StringField('type');
		static name = new StringField('name');
		static description = new StringField('description');
		static avatar = new StringField('avatar');
		static color = new StringField('color');
		static extranet = new BooleanField('extranet');
		static counter = new IntegerField('counter');
		static userCounter = new IntegerField('userCounter');
		static lastReadId = new IntegerField('lastReadId');
		static markedId = new IntegerField('markedId');
		static lastMessageId = new IntegerField('lastMessageId');
		static lastMessageViews = new ObjectField('lastMessageViews')
			.configureDefaultValue(FieldDefaultValue.emptyObject);
		static countOfViewers = new IntegerField('countOfViewers');
		static managerList = new ArrayField('managerList')
			.configureDefaultValue(FieldDefaultValue.emptyArray);
		static readList = new ArrayField('readList')
			.configureDefaultValue(FieldDefaultValue.emptyArray);
		static muteList = new ArrayField('muteList')
			.configureDefaultValue(FieldDefaultValue.emptyArray);
		static owner = new IntegerField('owner');
		static entityType = new StringField('entityType');
		static entityId = new IntegerField('entityId');
		static dateCreate = new DateField('dateCreate');
		static public = new ObjectField('public')
			.configureDefaultValue(FieldDefaultValue.emptyObject);
		static code = new StringField('code');
		static diskFolderId = new IntegerField('diskFolderId');
		static aiProvider = new StringField('aiProvider');
		static role = new StringField('role')
			.configureDefaultValue(FieldDefaultValue.noneText);
		static permissions = new ObjectField('permissions');
		static optionalParams = new ObjectField('optionalParams')
			.configureDefaultValue(FieldDefaultValue.emptyObject);
		static textFieldEnabled = new BooleanField('textFieldEnabled')
			.configureDefaultValue(FieldDefaultValue.trueBoolean);
		static backgroundId = new StringField('backgroundId')
			.configureDefaultValue(FieldDefaultValue.emptyText);
		static containsCollaber = new BooleanField('containsCollaber')
			.configureDefaultValue(FieldDefaultValue.falseBoolean);
		static entityLink = new ObjectField('entityLink')
			.configureDefaultValue(FieldDefaultValue.emptyObject);
		static parentChatId = new IntegerField('parentChatId')
			.configureDefaultValue(FieldDefaultValue.zeroInteger);
		static parentMessageId = new IntegerField('parentMessageId')
			.configureDefaultValue(FieldDefaultValue.zeroInteger);
		static guestCount = new IntegerField('guestCount')
			.configureDefaultValue(FieldDefaultValue.zeroInteger);

		static getTableName()
		{
			return 'b_im_dialog';
		}

		/** @protected */
		static getMap()
		{
			return [
				this.dialogId,
				this.chatId,
				this.type,
				this.name,
				this.description,
				this.avatar,
				this.color,
				this.extranet,
				this.counter,
				this.userCounter,
				this.lastReadId,
				this.markedId,
				this.lastMessageId,
				this.lastMessageViews,
				this.countOfViewers,
				this.managerList,
				this.readList,
				this.muteList,
				this.owner,
				this.entityType,
				this.entityId,
				this.dateCreate,
				this.public,
				this.code,
				this.diskFolderId,
				this.aiProvider,
				this.role,
				this.permissions,
				this.optionalParams,
				this.textFieldEnabled,
				this.backgroundId,
				this.containsCollaber,
				this.entityLink,
				this.parentChatId,
				this.parentMessageId,
				this.guestCount,
			];
		}
	}

	module.exports = { DialogSchema };
});
