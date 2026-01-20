/**
 * @module onboarding/src/history
 */
jn.define('onboarding/src/history', (require, exports, module) => {
	const { CacheKey, ServerKey } = require('onboarding/const');
	const { CacheStorage } = require('onboarding/cache');
	const { Tourist } = require('tourist');
	const { Type } = require('type');

	class CaseHistory
	{
		async isAlreadyShown(id)
		{
			await Tourist.ready();
			const cases = Tourist.getContext(ServerKey.CASES) || {};

			return Object.prototype.hasOwnProperty.call(cases, id);
		}

		async markAsShown(id)
		{
			await Tourist.ready();
			const cases = Tourist.getContext(ServerKey.CASES) || {};

			cases[id] = { cnt: 1, timestamp: Date.now() };
			await Tourist.remember(ServerKey.CASES, { context: cases });

			const shownIds = await this.getIdsFromStorage();
			if (!shownIds.includes(id))
			{
				shownIds.push(id);
				CacheStorage.set(CacheKey.SHOWN_IDS, shownIds);
			}
		}

		async getIdsFromStorage()
		{
			const ids = CacheStorage.get(CacheKey.SHOWN_IDS);
			if (Type.isArrayFilled(ids))
			{
				return ids;
			}

			await Tourist.ready();

			const cases = Tourist.getContext(ServerKey.CASES) || {};
			const shownIds = [];

			for (const key of Object.keys(cases))
			{
				if (cases[key]?.cnt > 0)
				{
					shownIds.push(key);
				}
			}

			CacheStorage.set(CacheKey.SHOWN_IDS, shownIds);

			return shownIds;
		}
	}

	module.exports = {
		CaseHistory,
	};
});
