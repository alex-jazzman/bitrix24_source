/**
 * @module im/messenger/db/query-builder/builder/src/query-factory
 */
jn.define('im/messenger/db/query-builder/builder/src/query-factory', (require, exports, module) => {
	const { DatabaseConnection } = require('im/messenger/db/connection');
	const { ConditionCompiler, OrderCompiler } = require('im/messenger/db/query-builder/compiler');
	const { SelectQueryBuilder } = require('im/messenger/db/query-builder/builder/src/select-query-builder');
	const { InsertQueryBuilder } = require('im/messenger/db/query-builder/builder/src/insert-query-builder');
	const { InsertOrReplaceQueryBuilder } = require('im/messenger/db/query-builder/builder/src/insert-or-replace-query-builder');
	const { InsertOrIgnoreQueryBuilder } = require('im/messenger/db/query-builder/builder/src/insert-or-ignore-query-builder');
	const { UpdateQueryBuilder } = require('im/messenger/db/query-builder/builder/src/update-query-builder');
	const { DeleteQueryBuilder } = require('im/messenger/db/query-builder/builder/src/delete-query-builder');

	/**
	 * @class QueryFactory
	 */
	class QueryFactory
	{
		#connection;
		#conditionCompiler;
		#orderCompiler;

		/**
		 * @param {object} [params]
		 * @param {DatabaseConnection} [params.connection] default: DatabaseConnection.getInstance()
		 * @param {ConditionCompiler} [params.conditionCompiler] default: new ConditionCompiler()
		 * @param {OrderCompiler} [params.orderCompiler] default: new OrderCompiler()
		 */
		constructor(params = {})
		{
			this.#connection = params.connection ?? DatabaseConnection.getInstance();
			this.#conditionCompiler = params.conditionCompiler ?? new ConditionCompiler();
			this.#orderCompiler = params.orderCompiler ?? new OrderCompiler();
		}

		select()
		{
			return new SelectQueryBuilder({
				connection: this.#connection,
				conditionCompiler: this.#conditionCompiler,
				orderCompiler: this.#orderCompiler,
			});
		}

		insert()
		{
			return new InsertQueryBuilder({ connection: this.#connection });
		}

		insertOrReplace()
		{
			return new InsertOrReplaceQueryBuilder({ connection: this.#connection });
		}

		insertOrIgnore()
		{
			return new InsertOrIgnoreQueryBuilder({ connection: this.#connection });
		}

		update()
		{
			return new UpdateQueryBuilder({
				connection: this.#connection,
				conditionCompiler: this.#conditionCompiler,
			});
		}

		delete()
		{
			return new DeleteQueryBuilder({
				connection: this.#connection,
				conditionCompiler: this.#conditionCompiler,
			});
		}
	}

	module.exports = { QueryFactory };
});
