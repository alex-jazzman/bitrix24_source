/**
 * @module im/messenger/db/table/src/internal/counter-pending-operation
 */
jn.define('im/messenger/db/table/src/internal/counter-pending-operation', (require, exports, module) => {
	const { Type } = require('type');
	const { Feature } = require('im/messenger/lib/feature');
	const {
		Table,
		FieldType,
	} = require('im/messenger/db/table/table');

	/**
	 * @class CounterPendingOperationInternalTable
	 */
	class CounterPendingOperationInternalTable extends Table
	{
		getFields()
		{
			return [
				{ name: 'actionUuid', type: FieldType.text, index: true, unique: true },
				{ name: 'chatId', type: FieldType.integer, index: true },
				{ name: 'type', type: FieldType.text },
				{ name: 'data', type: FieldType.json },
				{ name: 'timestamp', type: FieldType.integer },
			];
		}

		getName()
		{
			return 'b_im_counter_pending_operation_internal';
		}

		getPrimaryKey()
		{
			return 'actionUuid';
		}

		/**
		 * @param {Array<number>} chatIdList
		 * @return {Promise<void>}
		 */
		async deleteByChatIdList(chatIdList)
		{
			if (
				!this.isSupported
				|| this.readOnly
				|| !Feature.isLocalStorageEnabled
				|| !Type.isArrayFilled(chatIdList)
			)
			{
				return Promise.resolve({});
			}

			const column = 'chatId';
			const idsFormatted = this.createWhereInCondition(column, chatIdList);
			const result = await this.executeSql({
				query: `
					DELETE
					FROM ${this.getName()}
					WHERE ${column} IN (${idsFormatted})
				`,
			});

			this.logger.log(`${this.constructor.name}.deleteByChatIdList complete: ${this.getName()}`, chatIdList);

			return result;
		}
	}

	module.exports = { CounterPendingOperationInternalTable };
});
