/**
 * @module im/messenger/db/table/user
 */
jn.define('im/messenger/db/table/user', (require, exports, module) => {
	const {
		Table,
		FieldType,
		FieldDefaultValue,
	} = require('im/messenger/db/table/table');
	const { Type } = require('type');
	const { DateHelper } = require('im/messenger/lib/helper');
	const { Feature } = require('im/messenger/lib/feature');
	const { getStartWordsSearchVariants } = require('im/messenger/db/helper/start-words');

	/**
	 * @extends {Table<UserStoredData>}
	 */
	class UserTable extends Table
	{
		getName()
		{
			return 'b_im_user';
		}

		getPrimaryKey()
		{
			return 'id';
		}

		getFields()
		{
			return [
				{ name: 'id', type: FieldType.integer, unique: true, index: true },
				{ name: 'name', type: FieldType.text },
				{ name: 'firstName', type: FieldType.text },
				{ name: 'lastName', type: FieldType.text },
				{ name: 'gender', type: FieldType.text },
				{ name: 'avatar', type: FieldType.text },
				{ name: 'color', type: FieldType.text },
				{ name: 'type', type: FieldType.text },
				{ name: 'departments', type: FieldType.json, defaultValue: FieldDefaultValue.emptyArray },
				{ name: 'workPosition', type: FieldType.text },
				{ name: 'phones', type: FieldType.json },
				{ name: 'externalAuthId', type: FieldType.text },
				{ name: 'extranet', type: FieldType.boolean },
				{ name: 'network', type: FieldType.boolean },
				{ name: 'bot', type: FieldType.boolean },
				{ name: 'botData', type: FieldType.json },
				{ name: 'connector', type: FieldType.boolean },
				{ name: 'lastActivityDate', type: FieldType.date, defaultValue: FieldDefaultValue.null },
				{ name: 'mobileLastDate', type: FieldType.date },
				{ name: 'isCompleteInfo', type: FieldType.boolean },
				{ name: 'birthday', type: FieldType.text },
				{ name: 'absent', type: FieldType.text },
			];
		}

		saveDateFieldHandler(key, value)
		{
			if (key === 'lastActivityDate' && Type.isBoolean(value))
			{
				return null;
			}

			return DateHelper.cast(value).toISOString();
		}

		restoreDateFieldHandler(key, value)
		{
			if (key === 'lastActivityDate' && Type.isNull(value))
			{
				return false;
			}

			return DateHelper.cast(value, null);
		}

		saveTextFieldHandler(key, value)
		{
			if (['birthday', 'absent'].includes(key))
			{
				if (Type.isBoolean(value))
				{
					return '';
				}

				if (Type.isDate(value))
				{
					return DateHelper.cast(value, '').toISOString();
				}
			}

			return value;
		}

		restoreTextFieldHandler(key, value)
		{
			if (['birthday', 'absent'].includes(key) && !Type.isStringFilled(value))
			{
				return false;
			}

			return value;
		}

		/**
		 * @param {string} searchText
		 * @param {'asc'|'desc'} order='asc'
		 * @param {number} limit=25
		 * @param {boolean} shouldRestoreRows
		 *
		 * @returns {Promise<{items: *[]}>}
		 */
		async searchByText(
			searchText,
			order = 'desc',
			limit = 25,
			shouldRestoreRows = true,
		)
		{
			if (!this.isSupported || !Feature.isLocalStorageEnabled)
			{
				return {
					items: [],
				};
			}

			const { sqlCondition, values } = getStartWordsSearchVariants(['name', 'workPosition'], searchText);
			const result = await this.executeSql({
				query: `
					SELECT ${this.getName()}.*
					FROM ${this.getName()}
					WHERE ${sqlCondition}  
					ORDER BY id ${order}
					LIMIT ${limit}
				`,
				values: [
					...values,
				],
			});

			return this.prepareListResult(result, shouldRestoreRows);
		}
	}

	module.exports = {
		UserTable,
	};
});
