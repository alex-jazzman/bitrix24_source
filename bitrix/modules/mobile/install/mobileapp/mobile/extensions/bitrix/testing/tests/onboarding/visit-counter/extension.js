(() => {
	const require = (ext) => jn.require(ext);

	const { describe, it, expect, beforeEach } = require('testing');
	const { VisitPeriod } = require('onboarding/const');
	const { VisitCounter } = require('onboarding/visit-counter');

	describe('Onboarding: VisitCounter', () => {
		let cacheStorageMock = null;
		let serverStorageMock = null;

		beforeEach(() => {
			cacheStorageMock = {
				get(key)
				{
					return this[key];
				},
				set(key, value)
				{
					this[key] = value;
				},
			};
			serverStorageMock = {
				readyCalled: false,
				rememberCalled: false,
				rememberKey: null,
				numberOfTimesValue: undefined,
				async ready()
				{
					this.readyCalled = true;
				},
				numberOfTimes()
				{
					return this.numberOfTimesValue;
				},
				async remember(key)
				{
					this.rememberCalled = true;
					this.rememberKey = key;
				},
			};
		});

		it('should increase counter by one when cache is empty', async () => {
			cacheStorageMock[VisitPeriod.ONE_DAY] = undefined;
			serverStorageMock.numberOfTimesValue = 5;

			const counter = new VisitCounter(cacheStorageMock, serverStorageMock);
			await counter.increaseByOne();

			expect(cacheStorageMock[VisitPeriod.ONE_DAY]).toBe(6);
			expect(serverStorageMock.rememberCalled).toBe(true);
			expect(serverStorageMock.rememberKey).toBe(VisitPeriod.ONE_DAY);
		});

		it('should increase counter by one when cache has value', async () => {
			cacheStorageMock[VisitPeriod.ONE_DAY] = 10;

			const counter = new VisitCounter(cacheStorageMock, serverStorageMock);
			await counter.increaseByOne();

			expect(cacheStorageMock[VisitPeriod.ONE_DAY]).toBe(11);
			expect(serverStorageMock.rememberCalled).toBe(true);
			expect(serverStorageMock.readyCalled).toBe(false);
		});

		it('should handle serverStorage.numberOfTimes returning undefined', async () => {
			cacheStorageMock[VisitPeriod.ONE_DAY] = undefined;
			serverStorageMock.numberOfTimesValue = undefined;

			const counter = new VisitCounter(cacheStorageMock, serverStorageMock);
			await counter.increaseByOne();

			expect(cacheStorageMock[VisitPeriod.ONE_DAY]).toBe(1);
		});

		it('should handle default period (one day)', async () => {
			cacheStorageMock[VisitPeriod.ONE_DAY] = undefined;

			const counter = new VisitCounter(cacheStorageMock, serverStorageMock);
			await counter.increaseByOne();

			expect(cacheStorageMock[VisitPeriod.ONE_DAY]).toBe(1);
		});

		it('should handle custom period (three days) with dynamic window', async () => {
			cacheStorageMock['THREE_DAYS:current_window'] = undefined;

			const counter = new VisitCounter(
				cacheStorageMock,
				serverStorageMock,
				'THREE_DAYS',
				{
					customPeriodResolvers: {
						THREE_DAYS: () => 'current_window',
					},
				},
			);

			await counter.increaseByOne('THREE_DAYS');

			expect(cacheStorageMock['THREE_DAYS:current_window']).toBe(1);
			expect(serverStorageMock.rememberCalled).toBe(false);
		});
	});
})();
