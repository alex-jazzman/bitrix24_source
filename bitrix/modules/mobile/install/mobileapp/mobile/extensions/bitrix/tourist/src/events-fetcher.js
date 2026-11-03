/**
 * @module tourist/src/events-fetcher
 */
jn.define('tourist/src/events-fetcher', (require, exports, module) => {
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { Type } = require('type');

	const WEEK_IN_SECONDS = 604_800;

	class TouristEventsFetcher
	{
		constructor(handler)
		{
			this.executor = new RunActionExecutor('mobile.tourist.getEvents', {})
				.enableJson()
				.setCacheId(`tourist${env.userId}`)
				.setHandler(handler)
				.setCacheHandler(handler)
				.setCacheTtl(WEEK_IN_SECONDS)
				.setSkipRequestIfCacheExists()
				.setSkipDuplicateRequests();
		}

		async call()
		{
			return this.executor.call(true);
		}

		getExecutor()
		{
			return this.executor;
		}

		getCache()
		{
			return this.getExecutor().getCache();
		}

		updateCache(event, response)
		{
			const cache = this.getCache();
			const cacheData = cache?.getData()?.data ?? null;

			if (cacheData)
			{
				// Nothing to remove is nothing to write: a rewrite starts the week the cache is kept for over
				// again, and forgetting an event the device never had is the ordinary case - the refusal in the
				// drawer takes back a consent most employees never gave.
				if (Type.isNil(response) && !Object.hasOwn(cacheData, event))
				{
					return;
				}

				const data = { ...cacheData };

				if (Type.isNil(response))
				{
					// The cache is read in place of the answer of the server, so it has to look like one: the
					// server drops a forgotten event together with its key, and a null left behind would be an
					// entry that is not an event.
					delete data[event];
				}
				else
				{
					data[event] = response;
				}

				const newCacheData = {
					status: 'success',
					data,
					errors: [],
				};

				cache?.saveData(newCacheData);
			}
		}
	}

	module.exports = {
		TouristEventsFetcher,
	};
});
