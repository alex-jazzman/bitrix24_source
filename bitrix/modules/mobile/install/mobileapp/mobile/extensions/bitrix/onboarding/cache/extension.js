/**
 * @module onboarding/cache
 */
jn.define('onboarding/cache', (require, exports, module) => {
	const SHARED_STORAGE_KEY = `onboarding-shared-storage_${env.userId}`;

	class CacheStorage
	{
		static #deps = { getStorage: () => Application.sharedStorage(SHARED_STORAGE_KEY) };

		/**
		 * for tests: allows to replace the storage
		 * @param {{ getStorage: Function } | null} deps
		 * @protected
		 */
		static setStorage(deps)
		{
			if (!deps)
			{
				CacheStorage.#deps = { getStorage: () => Application.sharedStorage(SHARED_STORAGE_KEY) };

				return;
			}

			CacheStorage.#deps = { ...CacheStorage.#deps, ...deps };
		}

		static #getStorage()
		{
			return CacheStorage.#deps.getStorage();
		}

		static get(key)
		{
			const storage = CacheStorage.#getStorage();

			if (!storage)
			{
				return null;
			}

			return storage.get(key) ?? null;
		}

		static set(key, value)
		{
			const storage = CacheStorage.#getStorage();

			storage?.set(key, value);
		}
	}

	module.exports = {
		CacheStorage,
	};
});
