/**
 * @module im/messenger/db/table/recent
 */
jn.define('im/messenger/db/table/recent', (require, exports, module) => {
	const {
		Table,
		FieldType,
		FieldDefaultValue,
	} = require('im/messenger/db/table/table');
	const { DialogTable } = require('im/messenger/db/table/dialog');
	const { Type } = require('type');

	/**
	 * @extends {Table<RecentStoredData>}
	 */
	class RecentTable extends Table
	{
		getName()
		{
			return 'b_im_recent';
		}

		getPrimaryKey()
		{
			return 'id';
		}

		getFields()
		{
			return [
				{ name: 'id', type: FieldType.text, unique: true, index: true },
				{ name: 'lastActivityDate', type: FieldType.date, index: true },
				{ name: 'message', type: FieldType.object },
				{ name: 'dateMessage', type: FieldType.date },
				{ name: 'unread', type: FieldType.boolean },
				{ name: 'pinned', type: FieldType.boolean },
				{ name: 'invitation', type: FieldType.json, defaultValue: FieldDefaultValue.emptyObject },
				{ name: 'options', type: FieldType.json },
			];
		}

		restoreDatabaseRow(row)
		{
			const fieldsRecentCollection = this.getFieldsCollection();
			const fieldsDialogCollection = new DialogTable().getFieldsCollection();
			const restoredRow = {};
			Object.keys(row).forEach((fieldName) => {
				let fieldValue = row[fieldName];

				let fieldType = fieldsRecentCollection[fieldName]?.type;
				if (fieldType)
				{
					const restoreHandler = this.getRestoreHandlerByFieldType(fieldType);
					if (Type.isFunction(restoreHandler))
					{
						fieldValue = restoreHandler(fieldName, fieldValue);
					}

					restoredRow[fieldName] = fieldValue;
				}
				else if (fieldsDialogCollection[fieldName]?.type)
				{
					fieldType = fieldsDialogCollection[fieldName]?.type;

					const restoreHandler = this.getRestoreHandlerByFieldType(fieldType);
					if (Type.isFunction(restoreHandler))
					{
						fieldValue = restoreHandler(fieldName, fieldValue);
					}

					// eslint-disable-next-line no-unused-expressions
					restoredRow.chat ?? (restoredRow.chat = {});
					restoredRow.chat[fieldName] = fieldValue;
				}
				else
				{
					console.error(`Table.restoreDatabaseRow error in ${this.getName()}: "${fieldName}" is in the database but not in the table model`);
				}
			});

			return restoredRow;
		}
	}

	module.exports = {
		RecentTable,
	};
});
