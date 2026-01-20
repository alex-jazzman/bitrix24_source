/**
 * @module onboarding/visit-counter
 */
jn.define('onboarding/visit-counter', (require, exports, module) => {
	const { CacheStorage } = require('onboarding/cache');
	const { VisitPeriod } = require('onboarding/const');
	const { Tourist } = require('tourist');

	class VisitCounter
	{
		constructor(
			cacheStorage = CacheStorage,
			serverStorage = Tourist,
			defaultPeriod = VisitPeriod.ONE_DAY,
			{
				customPeriodResolvers = {},
			} = {},
		)
		{
			this.cacheStorage = cacheStorage;
			this.serverStorage = serverStorage;
			this.defaultPeriod = defaultPeriod;
			this.customPeriodResolvers = customPeriodResolvers;
		}

		async increaseByOne(period = this.defaultPeriod)
		{
			try
			{
				let localCounter = this.#getFromCache(period);

				if (!localCounter)
				{
					localCounter = await this.getFromServer(period);
					this.#updateCache(period, localCounter);
				}

				localCounter += 1;
				this.#updateCache(period, localCounter);

				await this.#updateOnServer(period);
			}
			catch (error)
			{
				console.error('Failed to update visit counter:', error);
			}
		}

		async getFromServer(period = this.defaultPeriod)
		{
			await this.serverStorage.ready();

			if (!this.#isServerSupportedPeriod(period))
			{
				return 0;
			}

			return this.serverStorage.numberOfTimes(period) || 0;
		}

		async #updateOnServer(period)
		{
			if (!this.#isServerSupportedPeriod(period))
			{
				return;
			}

			await this.serverStorage.remember(period);
		}

		#isServerSupportedPeriod(period)
		{
			return Object.values(VisitPeriod).includes(period);
		}

		#getFromCache(period)
		{
			return this.cacheStorage.get(this.#resolveCacheKey(period));
		}

		#updateCache(period, value)
		{
			this.cacheStorage.set(this.#resolveCacheKey(period), value);
		}

		#resolveCacheKey(period)
		{
			if (this.customPeriodResolvers[period])
			{
				const suffix = this.customPeriodResolvers[period]();

				return `${period}:${suffix}`;
			}

			return period;
		}
	}

	module.exports = {
		VisitCounter,
	};
});
