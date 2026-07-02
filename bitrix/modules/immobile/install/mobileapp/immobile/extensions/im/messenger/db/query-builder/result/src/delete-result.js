/**
 * @module im/messenger/db/query-builder/result/src/delete-result
 */
jn.define('im/messenger/db/query-builder/result/src/delete-result', (require, exports, module) => {
	/**
	 * @class DeleteResult
	 */
	class DeleteResult
	{
		#affected;

		/**
		 * @param {object} params
		 * @param {number} params.affected rows removed by the DELETE
		 */
		constructor({ affected })
		{
			this.#affected = affected ?? 0;
		}

		get affected()
		{
			return this.#affected;
		}

		/**
		 * @return {boolean} true if any row was removed
		 */
		get hasChanges()
		{
			return this.#affected > 0;
		}

		toJSON()
		{
			return { affected: this.#affected };
		}
	}

	module.exports = { DeleteResult };
});
