/**
 * @module layout/ui/reaction/service/storage/src/cache
 */
jn.define('layout/ui/reaction/service/storage/src/cache', (require, exports, module) => {
	const {
		sharedStorageKey,
		storedCurrentUserReactionList,
	} = require('layout/ui/reaction/service/storage/src/const');

	class CacheStorage
	{
		static get()
		{
			return JSON.parse(
				Application.sharedStorage(sharedStorageKey).get(storedCurrentUserReactionList) ?? '{}',
			);
		}

		static set(value)
		{
			Application.sharedStorage(sharedStorageKey).set(storedCurrentUserReactionList, JSON.stringify(value));
		}
	}

	module.exports = {
		CacheStorage,
	};
});
