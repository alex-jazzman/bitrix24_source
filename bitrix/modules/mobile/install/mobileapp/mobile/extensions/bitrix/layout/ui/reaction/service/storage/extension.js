/**
 * @module layout/ui/reaction/service/storage
 */
jn.define('layout/ui/reaction/service/storage', (require, exports, module) => {
	const { CacheStorage } = require('layout/ui/reaction/service/storage/src/cache');
	const { TouristStorage } = require('layout/ui/reaction/service/storage/src/server');
	const { Type } = require('type');

	class ReactionStorageManager
	{
		static isEmptyObject(value)
		{
			return value && Type.isObjectLike(value) && Object.keys(value).length === 0;
		}

		static async get()
		{
			let result = ReactionStorageManager.getFromCache();

			if (!ReactionStorageManager.isEmptyObject(result))
			{
				return result;
			}

			try
			{
				result = await TouristStorage.get();
			}
			catch (e)
			{
				console.warn('TouristStorage.get failed', e);
				result = null;
			}

			if (!ReactionStorageManager.isEmptyObject(result))
			{
				CacheStorage.set(result);
			}

			return result;
		}

		static set(value)
		{
			CacheStorage.set(value);
			void TouristStorage.set(value);
		}

		static getFromCache()
		{
			return CacheStorage.get();
		}

		static async syncCacheWithServer()
		{
			try
			{
				const result = await TouristStorage.get();
				if (!ReactionStorageManager.isEmptyObject(result))
				{
					CacheStorage.set(result);
				}

				return result;
			}
			catch (e)
			{
				console.warn('TouristStorage.get failed', e);

				return null;
			}
		}
	}

	module.exports = {
		ReactionStorageManager,
	};
});
