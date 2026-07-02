/**
 * @module im/messenger/db/query-builder/result/src/update-result
 */
jn.define('im/messenger/db/query-builder/result/src/update-result', (require, exports, module) => {
	/**
	 * @class UpdateResult
	 */
	class UpdateResult
	{
		#affected;

		/**
		 * @param {object} params
		 * @param {number} params.affected rows changed by the UPDATE
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
		 * @return {boolean} true if any row was changed
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

	module.exports = { UpdateResult };
});
