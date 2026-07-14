/**
 * @module im/messenger/lib/chat-search/src/strategy/local/composite-local-search-strategy
 */
jn.define('im/messenger/lib/chat-search/src/strategy/local/composite-local-search-strategy', (require, exports, module) => {
	const { Type } = require('type');

	/**
	 * @class CompositeLocalSearchStrategy
	 * @implements {LocalSearchStrategy}
	 * @description Aggregates several LocalSearchStrategy instances. Runs them sequentially,
	 * merges results preserving order, dedupes by id and applies optional limit.
	 */
	class CompositeLocalSearchStrategy
	{
		/**
		 * @param {{ strategies: Array<LocalSearchStrategy> }} params
		 */
		constructor({ strategies })
		{
			this.strategies = strategies;
		}

		/**
		 * @param {Partial<SearchOptions>} searchOptions
		 * @return {Promise<Array<string>>}
		 */
		async search(searchOptions)
		{
			const result = [];
			for (const strategy of this.strategies)
			{
				const ids = await strategy.search(searchOptions);
				result.push(...ids);
			}

			const deduped = [...new Set(result)];

			return Type.isNumber(searchOptions.limit) ? deduped.slice(0, searchOptions.limit) : deduped;
		}

		/**
		 * @param {object} payload
		 * @return {Promise<Array<string>>}
		 */
		async preload(payload)
		{
			const result = [];
			for (const strategy of this.strategies)
			{
				if (!Type.isFunction(strategy.preload))
				{
					continue;
				}

				const ids = await strategy.preload(payload);
				result.push(...ids);
			}

			return [...new Set(result)];
		}
	}

	module.exports = { CompositeLocalSearchStrategy };
});
