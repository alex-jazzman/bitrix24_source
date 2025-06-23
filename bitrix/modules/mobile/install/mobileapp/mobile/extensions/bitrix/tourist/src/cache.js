/**
 * @module tourist/src/cache
 */
jn.define('tourist/src/cache', (require, exports, module) => {
	const { RunActionExecutor } = require('rest/run-action-executor');

	class TouristCacheExecutor
	{
		static getRunActionExecutor()
		{
			return new RunActionExecutor('mobile.tourist.getEvents', {})
				.enableJson()
				.setCacheId(`tourist${env.userId}`)
			;
		}

		static updateRunActionCache(event, response)
		{
			const cache = TouristCacheExecutor.getRunActionExecutor().getCache();
			const cacheData = cache.getData()?.data ?? null;

			if (cacheData)
			{
				const newCacheData = {
					status: 'success',
					data: {
						...cacheData,
						[event]: response ?? null,
					},
					errors: [],
				};

				cache?.saveData(newCacheData);
			}
		}
	}

	module.exports = {
		TouristCacheExecutor,
	};
});
