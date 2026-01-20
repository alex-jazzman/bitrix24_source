/**
 * @module app-rating-manager/src/api
 */
jn.define('app-rating-manager/src/api', (require, exports, module) => {
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { MemoryStorage } = require('native/memorystore');
	const { Type } = require('type');
	const storage = new MemoryStorage('app-rating-manager');
	const cacheId = 'app-rating-manager-isAppRatingEnabled';
	const cacheTtl = 3600 * 24;

	const fetchAppRatingEnabledOptionIfNeeded = async () => {
		try
		{
			const isAppRatingEnabled = storage.getSync('isAppRatingEnabled');
			const isAppRatingEnabledLoading = storage.getSync('isAppRatingEnabledLoading') ?? false;

			if (Type.isNil(isAppRatingEnabled) && !isAppRatingEnabledLoading)
			{
				await storage.set('isAppRatingEnabledLoading', true);

				return new Promise((resolve) => {
					const handler = async (response) => {
						const result = response.data ?? true;
						await storage.set('isAppRatingEnabled', result);
						await storage.set('isAppRatingEnabledLoading', false);
						resolve();
					};

					(new RunActionExecutor('mobile.AppRating.isAppRatingEnabled'))
						.enableJson()
						.setSkipRequestIfCacheExists()
						.setCacheId(cacheId)
						.setCacheTtl(cacheTtl)
						.setCacheHandler(handler)
						.setHandler(handler)
						.call(true);
				});
			}
		}
		catch (error)
		{
			console.error(error);
		}

		return Promise.resolve();
	};

	const isAppRatingEnabled = () => {
		return storage.getSync('isAppRatingEnabled');
	};

	module.exports = {
		fetchAppRatingEnabledOptionIfNeeded,
		isAppRatingEnabled,
	};
});
