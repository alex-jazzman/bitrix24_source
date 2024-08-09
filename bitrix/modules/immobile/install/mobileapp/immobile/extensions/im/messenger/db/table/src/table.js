/* eslint-disable es/no-optional-chaining */

/**
 * @module im/messenger/db/table/table
 */
jn.define('im/messenger/db/table/table', (require, exports, module) => {
	include('sqlite');

	const { Type } = require('type');

	const { Feature } = require('im/messenger/lib/feature');
	const { DateHelper } = require('im/messenger/lib/helper');
	const { LoggerManager } = require('im/messenger/lib/logger');
	const logger = LoggerManager.getInstance().getLogger('database-table--table');

	const FieldType = Object.freeze({
		integer: 'integer',
		text: 'text',
		date: 'date',
		boolean: 'boolean',
		json: 'json',
		map: 'map',
	});

	/**
	 * @abstract
	 * @implements ITable
	 */
	class Table
	{
		constructor()
		{
			this.fieldsCollection = this.getFieldsCollection();

			this.saveHandlerCollection = {
				[FieldType.date]: (key, value) => {
					return DateHelper.cast(value).toISOString();
				},
				[FieldType.boolean]: (key, value) => {
					if (value === true)
					{
						return '1';
					}

					if (value === false)
					{
						return '0';
					}

					return '';
				},
				[FieldType.json]: (key, value) => {
					return JSON.stringify(value);
				},
				[FieldType.map]: (key, value) => {
					if (value instanceof Map)
					{
						return JSON.stringify(Object.fromEntries(value));
					}

					return JSON.stringify(value);
				},
			};

			this.restoreHandlerCollection = {
				[FieldType.date]: (key, value) => {
					return DateHelper.cast(value, null);
				},
				[FieldType.boolean]: (key, value) => {
					return value === '1';
				},
				[FieldType.json]: (key, value) => {
					try
					{
						return JSON.parse(value);
					}
					catch (error)
					{
						logger.error(`Table.restoreDatabaseRow error in ${this.getName()}:`, key, value, error);

						return null;
					}
				},
				[FieldType.map]: (key, value) => {
					try
					{
						const obj = JSON.parse(value);

						return new Map(Object.entries(obj));
					}
					catch (error)
					{
						logger.error(`Table.restoreDatabaseRow error in ${this.getName()}:`, key, value, error);

						return null;
					}
				},
			};

			if (this.isSupported)
			{
				this.table = new DatabaseTable(this.getName(), this.getFields());
			}
		}

		get isSupported()
		{
			return Feature.isLocalStorageSupported;
		}

		get readOnly()
		{
			return Feature.isLocalStorageReadOnlyModeEnable;
		}

		/**
		 * @abstract
		 */
		getName()
		{
			throw new Error('Table: getName() must be override in subclass.');
		}

		/**
		 * @abstract
		 */
		getFields()
		{
			throw new Error('Table: getFields() must be override in subclass.');
		}

		getFieldsCollection()
		{
			if (!this.fieldsCollection)
			{
				const fieldsCollection = {};
				const fields = this.getFields();
				fields.forEach((field) => {
					fieldsCollection[field.name] = field;
				});

				this.fieldsCollection = fieldsCollection;
			}

			return this.fieldsCollection;
		}

		getDefaultValueByFieldName(fieldName)
		{
			const field = this.fieldsCollection[fieldName];

			return field.defaultValue;
		}

		getRestoreHandlerByFieldType(fieldType)
		{
			return this.restoreHandlerCollection[fieldType];
		}

		getSaveHandlerByFieldType(fieldType)
		{
			return this.saveHandlerCollection[fieldType];
		}

		getMap()
		{
			return this.table.getMap();
		}

		add(items, replace = true, ignoreErrors = false)
		{
			if (!this.isSupported || this.readOnly || !Feature.isLocalStorageEnabled)
			{
				return Promise.resolve();
			}

			if (!Type.isArrayFilled(items))
			{
				logger.log(`Table.add: ${this.getName()} nothing to add.`);

				return Promise.resolve({
					changes: 0,
					columns: [],
					rows: [],
					lastInsertId: -1,
					errors: [
						new Error('NOTHING_TO_ADD'),
					],
				});
			}

			return this.table.add(items, replace)
				.then(() => {
					logger.log(`Table.add complete: ${this.getName()}`, items, replace);
				})
				.catch((error) => {
					if (ignoreErrors)
					{
						logger.warn(`Table.add error: ${this.getName()}`, error, items, replace);
					}
					else
					{
						logger.error(`Table.add error: ${this.getName()}`, error, items, replace);
					}
				})
			;
		}

		async addIfNotExist(items)
		{
			try
			{
				await this.add(items, false, true);
			}
			catch
			{ /* empty */ }
		}

		/**
		 *
		 * @param {TableGetListOptions} options
		 * @return {Promise<{items: Array}>}
		 */
		async getList(options)
		{
			if (!this.isSupported || !Feature.isLocalStorageEnabled)
			{
				return Promise.resolve({
					items: [],
				});
			}

			const result = await this.table.getList(options);

			result.items = result.items.map((row) => this.restoreDatabaseRow(row));

			return result;
		}

		async getById(id)
		{
			if (!this.isSupported || !Feature.isLocalStorageEnabled)
			{
				return null;
			}

			const result = await this.getList({
				filter: {
					id,
				},
				limit: 1,
			});

			if (Type.isArrayFilled(result.items))
			{
				return result.items[0];
			}

			return null;
		}

		async getListByIds(idList, shouldRestoreRows = true)
		{
			if (!this.isSupported || !Feature.isLocalStorageEnabled || !Type.isArrayFilled(idList))
			{
				return {
					items: [],
				};
			}
			const idsFormatted = Type.isNumber(idList[0]) ? idList.toString() : idList.map((id) => `"${id}"`);
			const result = await this.executeSql({
				query: `
					SELECT * 
					FROM ${this.getName()} 
					WHERE id IN (${idsFormatted})
				`,
			});

			const {
				columns,
				rows,
			} = result;

			const list = {
				items: [],
			};

			rows.forEach((row) => {
				const listRow = {};
				row.forEach((value, index) => {
					const key = columns[index];
					listRow[key] = value;
				});

				if (shouldRestoreRows === true)
				{
					list.items.push(this.restoreDatabaseRow(listRow));
				}
				else
				{
					list.items.push(listRow);
				}
			});

			return list;
		}

		async deleteByIdList(idList)
		{
			if (
				!this.isSupported
				|| this.readOnly
				|| !Feature.isLocalStorageEnabled
				|| !Type.isArrayFilled(idList)
			)
			{
				return Promise.resolve({});
			}

			const idsFormatted = Type.isNumber(idList[0]) ? idList.toString() : idList.map((id) => `"${id}"`);
			const result = await this.executeSql({
				query: `
					DELETE
					FROM ${this.getName()}
					WHERE id IN (${idsFormatted})
				`,
			});

			logger.log(`Table.deleteByIdList complete: ${this.getName()}`, idList);

			return result;
		}

		update(options)
		{
			if (!this.isSupported || this.readOnly || !Feature.isLocalStorageEnabled)
			{
				return Promise.resolve({});
			}

			return this.table.update(options);
		}

		delete(filter)
		{
			if (!this.isSupported || this.readOnly || !Feature.isLocalStorageEnabled)
			{
				return Promise.resolve({});
			}

			return this.table.delete(filter)
				.then(() => {
					logger.log(`Table.delete complete: ${this.getName()}`, filter);
				})
				.catch((error) => {
					logger.error(`Table.delete error: ${this.getName()}`, error, filter);
				})
			;
		}

		create()
		{
			if (!this.isSupported || !Feature.isLocalStorageEnabled)
			{
				return Promise.resolve({});
			}

			return this.table.create();
		}

		drop()
		{
			if (this.isSupported)
			{
				return this.table.drop();
			}

			return Promise.resolve();
		}

		executeSql({ query, values })
		{
			if (!this.isSupported || !Feature.isLocalStorageEnabled)
			{
				return Promise.resolve({});
			}

			return this.table.executeSql({ query, values });
		}

		validate(item)
		{
			const fieldsCollection = this.getFieldsCollection();

			const row = {};

			const itemFieldsCollection = {};
			Object.keys(item).forEach((fieldName) => {
				itemFieldsCollection[fieldName] = true;
			});

			Object.keys(fieldsCollection).forEach((fieldName) => {
				const defaultValue = this.getDefaultValueByFieldName(fieldName);
				if (!itemFieldsCollection[fieldName] && Type.isUndefined(defaultValue))
				{
					return;
				}

				let fieldValue = item[fieldName];
				if (Type.isUndefined(fieldValue))
				{
					fieldValue = defaultValue;
				}

				const fieldType = fieldsCollection[fieldName].type;
				const saveHandler = this.getSaveHandlerByFieldType(fieldType);
				if (Type.isFunction(saveHandler))
				{
					fieldValue = saveHandler(fieldName, fieldValue);
				}

				row[fieldName] = fieldValue;
			});

			return row;
		}

		restoreDatabaseRow(row)
		{
			const fieldsCollection = this.getFieldsCollection();

			const restoredRow = {};
			Object.keys(row).forEach((fieldName) => {
				let fieldValue = row[fieldName];

				const fieldType = fieldsCollection[fieldName]?.type;
				if (!fieldType)
				{
					logger.error(`Table.restoreDatabaseRow error in ${this.getName()}: "${fieldName}" is in the database but not in the table model`);
				}

				const restoreHandler = this.getRestoreHandlerByFieldType(fieldType);
				if (Type.isFunction(restoreHandler))
				{
					fieldValue = restoreHandler(fieldName, fieldValue);
				}

				restoredRow[fieldName] = fieldValue;
			});

			return restoredRow;
		}

		convertSelectResultToGetListResult(selectResult, shouldRestoreRows)
		{
			const {
				columns,
				rows,
			} = selectResult;

			const getListResult = {
				items: [],
			};

			rows.forEach((row) => {
				const listRow = {};
				row.forEach((value, index) => {
					const key = columns[index];
					listRow[key] = value;
				});

				if (shouldRestoreRows === true)
				{
					getListResult.items.push(this.restoreDatabaseRow(listRow));
				}
				else
				{
					getListResult.items.push(listRow);
				}
			});

			return getListResult;
		}
	}

	module.exports = {
		Table,
		FieldType,
	};
});
