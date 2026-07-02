/**
 * @module im/messenger/db/query-builder/result/src/insert-result
 */
jn.define('im/messenger/db/query-builder/result/src/insert-result', (require, exports, module) => {
	/**
	 * @class InsertResult
	 */
	class InsertResult
	{
		#lastInsertId;
		#affected;

		/**
		 * @param {object} params
		 * @param {number|null} params.lastInsertId last row id assigned, or null
		 * @param {number} params.affected rows actually inserted/replaced
		 */
		constructor({ lastInsertId, affected })
		{
			this.#lastInsertId = lastInsertId ?? null;
			this.#affected = affected ?? 0;
		}

		get lastInsertId()
		{
			return this.#lastInsertId;
		}

		get affected()
		{
			return this.#affected;
		}

		/**
		 * @return {boolean}
		 */
		get wasInserted()
		{
			return this.#affected > 0;
		}

		toJSON()
		{
			return {
				lastInsertId: this.#lastInsertId,
				affected: this.#affected,
			};
		}
	}

	module.exports = { InsertResult };
});
