/**
 * @module im/messenger/db/table-schema/src/user
 */
jn.define('im/messenger/db/table-schema/src/user', (require, exports, module) => {
	const {
		IntegerField,
		StringField,
		DateField,
		BooleanField,
		ObjectField,
		ArrayField,
	} = require('im/messenger/db/schema/field');
	const { FieldDefaultValue } = require('im/messenger/db/const');
	const { Index } = require('im/messenger/db/schema/index');
	const { BaseSchema } = require('im/messenger/db/schema/base-schema');
	const { Type } = require('type');
	const { DateHelper } = require('im/messenger/lib/helper');

	/**
	 * @class UserSchema
	 */
	class UserSchema extends BaseSchema
	{
		static id = new IntegerField('id');
		static name = new StringField('name');
		static firstName = new StringField('firstName');
		static lastName = new StringField('lastName');
		static gender = new StringField('gender');
		static avatar = new StringField('avatar');
		static color = new StringField('color');
		static type = new StringField('type');
		static departments = new ArrayField('departments')
			.configureDefaultValue(FieldDefaultValue.emptyArray);
		static workPosition = new StringField('workPosition');
		static phones = new ObjectField('phones');
		static externalAuthId = new StringField('externalAuthId');
		static extranet = new BooleanField('extranet');
		static network = new BooleanField('network');
		static bot = new BooleanField('bot');
		static botData = new ObjectField('botData');
		static connector = new BooleanField('connector');
		static lastActivityDate = new DateField('lastActivityDate')
			.configureDefaultValue(FieldDefaultValue.null)
			.configureSaveCallback(saveNullableDateOrFalse)
			.configureRestoreCallback(restoreNullableDateOrFalse);

		static mobileLastDate = new DateField('mobileLastDate');
		static isCompleteInfo = new BooleanField('isCompleteInfo');
		static birthday = new StringField('birthday')
			.configureSaveCallback(saveDateOrFalse)
			.configureRestoreCallback(restoreDateOrFalse);

		static absent = new StringField('absent')
			.configureSaveCallback(saveDateOrFalse)
			.configureRestoreCallback(restoreDateOrFalse);

		static getTableName()
		{
			return 'b_im_user';
		}

		/** @protected */
		static getMap()
		{
			return [
				this.id,
				this.name,
				this.firstName,
				this.lastName,
				this.gender,
				this.avatar,
				this.color,
				this.type,
				this.departments,
				this.workPosition,
				this.phones,
				this.externalAuthId,
				this.extranet,
				this.network,
				this.bot,
				this.botData,
				this.connector,
				this.lastActivityDate,
				this.mobileLastDate,
				this.isCompleteInfo,
				this.birthday,
				this.absent,
			];
		}

		static getIndexes()
		{
			return [
				new Index([this.id]).configureUnique(),
			];
		}
	}

	/**
	 * Serializes a nullable date-or-false field: false → null; date → ISO string.
	 *
	 * @param {false | Date | string} value
	 * @return {string | null}
	 */
	function saveNullableDateOrFalse(value)
	{
		if (Type.isBoolean(value))
		{
			return null;
		}

		return DateHelper.cast(value).toISOString();
	}

	/**
	 * Restores a nullable date-or-false field: null → false; otherwise → Date.
	 *
	 * @param {string | null} raw
	 * @return {Date | false}
	 */
	function restoreNullableDateOrFalse(raw)
	{
		if (Type.isNull(raw))
		{
			return false;
		}

		return DateHelper.cast(raw, null);
	}

	/**
	 * Serializes a field whose runtime value is either a date or false.
	 * false → empty string; Date → ISO string; string passes through as-is.
	 *
	 * @param {false | Date | string} value
	 * @return {string}
	 */
	function saveDateOrFalse(value)
	{
		if (Type.isBoolean(value))
		{
			return '';
		}

		if (Type.isDate(value))
		{
			return DateHelper.cast(value, '').toISOString();
		}

		return value;
	}

	/**
	 * Restores a field whose runtime value is either a date string or false.
	 * Empty / absent raw value → false; filled string passes through as-is.
	 *
	 * @param {string | null} raw
	 * @return {string | false}
	 */
	function restoreDateOrFalse(raw)
	{
		if (!Type.isStringFilled(raw))
		{
			return false;
		}

		return raw;
	}

	module.exports = { UserSchema };
});
