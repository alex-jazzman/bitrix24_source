/**
 * @module onboarding/limiter
 */
jn.define('onboarding/limiter', (require, exports, module) => {
	const { CacheKey, ServerKey, BadgeCode } = require('onboarding/const');
	const { CacheStorage } = require('onboarding/cache');
	const { Tourist } = require('tourist');

	const MAX_COUNT_PER_DAY = 3;
	const ONE_DAY_MS = 24 * 60 * 60 * 1000;

	class CaseLimiter
	{
		/**
		 * @param {string} appTab
		 * @param {string} caseTab
		 * @param {boolean} [shouldSkipLimitCheck=false]
		 * @param {boolean} [forceSkipActiveTabCheck=false]
		 * @returns {Promise<boolean>}
		 */
		static async canShowMore(appTab, caseTab, shouldSkipLimitCheck = false, forceSkipActiveTabCheck = false)
		{
			if (shouldSkipLimitCheck)
			{
				return true;
			}

			const limit = await CaseLimiter.#getLimitState();
			const now = Date.now();

			if (CaseLimiter.#isLimitExpired(limit.timestamp, now))
			{
				const newDay = {
					count: 0,
					timestamp: now,
					tabs: [],
				};
				await CaseLimiter.#save(newDay);

				return true;
			}

			if (CaseLimiter.#shouldSkipActiveTabCheck(caseTab, appTab, forceSkipActiveTabCheck))
			{
				return true;
			}

			if (CaseLimiter.#isQuantityLimitReached(limit.count))
			{
				return false;
			}

			return !limit.tabs.includes(appTab);
		}

		/**
		 * @param {string} tab
		 * @returns {void}
		 */
		static increment(tab)
		{
			const { count, timestamp, tabs } = CaseLimiter.getCache() || {};
			const now = Date.now();
			let newTabs = Array.isArray(tabs) ? [...tabs] : [];

			if (CaseLimiter.#isLimitExpired(timestamp, now))
			{
				newTabs = [tab];
				void CaseLimiter.#save({
					count: 1,
					timestamp: now,
					tabs: newTabs,
				});
			}
			else
			{
				if (!newTabs.includes(tab))
				{
					newTabs.push(tab);
				}

				void CaseLimiter.#save({ count: (count || 0) + 1, timestamp, tabs: newTabs });
			}
		}

		static async getFromServer()
		{
			await Tourist.ready();

			const data = Tourist.getContext(ServerKey.HINTS_COUNT) ?? {
				count: 0,
				timestamp: null,
				tabs: [],
			};

			if (!Array.isArray(data.tabs))
			{
				data.tabs = [];
			}

			return data;
		}

		static getCache()
		{
			const data = CacheStorage.get(CacheKey.HINTS_COUNT);
			if (!data)
			{
				return null;
			}

			if (!Array.isArray(data.tabs))
			{
				data.tabs = [];
			}

			return data;
		}

		static async #getLimitState()
		{
			const cache = CaseLimiter.getCache();

			if (cache)
			{
				cache.tabs = CaseLimiter.#normalizeTabs(cache.tabs);

				return cache;
			}

			const server = await CaseLimiter.getFromServer();
			server.tabs = CaseLimiter.#normalizeTabs(server.tabs);

			return server;
		}

		static #normalizeTabs(tabs)
		{
			return Array.isArray(tabs) ? tabs : [];
		}

		static #isLimitExpired(timestamp, now)
		{
			return !timestamp || (now - timestamp) > ONE_DAY_MS;
		}

		static #isQuantityLimitReached(count)
		{
			return count >= MAX_COUNT_PER_DAY;
		}

		static #shouldSkipActiveTabCheck(caseTab, appTab, forceSkipCheck = false)
		{
			const isCaseTabValid = caseTab && caseTab !== BadgeCode.ANY;
			const isDifferentTab = caseTab !== appTab;

			return (isCaseTabValid && isDifferentTab) || forceSkipCheck;
		}

		static async #save(result)
		{
			await Tourist.ready();

			await Tourist.remember(ServerKey.HINTS_COUNT, { context: result });
			CacheStorage.set(CacheKey.HINTS_COUNT, result);
		}
	}

	module.exports = {
		CaseLimiter,
	};
});
