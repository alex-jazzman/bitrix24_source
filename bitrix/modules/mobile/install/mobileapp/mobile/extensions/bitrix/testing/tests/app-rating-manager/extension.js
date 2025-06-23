(() => {
	const require = (ext) => jn.require(ext);
	const {
		AppRatingManager,
		UserEvent,
		RateEvent,
		UserEventCounterLimit,
		sharedStorageKey,
		storedDataKey,
		millisecondsInDay,
		RateBoxDisplayIntervals: Intervals,
	} = require('app-rating-manager');
	const { HighestRate } = require('layout/ui/app-rating');
	const { describe, test, expect, beforeEach, afterAll } = require('testing');
	const { Tourist } = require('tourist');

	const increaseEventCounterToLimit = (event) => {
		const limit = UserEventCounterLimit[event];
		const increaseCountersPromises = [];
		for (let i = 0; i < limit; i++)
		{
			increaseCountersPromises.push(AppRatingManager.increaseCounter(event));
		}

		return Promise.allSettled(increaseCountersPromises);
	};

	const clearAppRatingData = async () => {
		await Tourist.ready();
		await Tourist.forget(RateEvent.RATE_BOX_OPENED);
		await Tourist.forget(RateEvent.APP_RATED);
		await Tourist.forget(RateEvent.USER_WENT_TO_STORE);
		await Tourist.forget(RateEvent.ANY_EVENT_COUNTER_REACHED_LIMIT);
		Application.sharedStorage(sharedStorageKey).set(storedDataKey, '{}');
	};

	const rememberEventWithTime = async (event, options) => {
		await Tourist.ready();
		await Tourist.remember(event, options);
	};

	const getTimeDaysAgo = (days) => Date.now() - days * millisecondsInDay;

	describe('AppRatingManager canOpenAppRating', () => {
		beforeEach(clearAppRatingData);
		afterAll(clearAppRatingData);

		test('should return false if no limits reached', async () => {
			const result = AppRatingManager.canOpenAppRating();
			expect(result).toBe(false);
		});

		Object.values(UserEvent).forEach((event) => {
			test(`should return true if ${event} limit reached and box was not shown yet`, async () => {
				await increaseEventCounterToLimit(event);
				const result = AppRatingManager.canOpenAppRating();
				expect(result).toBe(true);
			});
		});

		test('should return false if rate box shown once and time for second display not come', async () => {
			await increaseEventCounterToLimit(UserEvent.TASKS_COMPLETED);
			await Tourist.remember(RateEvent.RATE_BOX_OPENED);
			const result = AppRatingManager.canOpenAppRating();
			expect(result).toBe(false);
		});

		test('should return true if rate box shown once, not rated and time for second display come', async () => {
			const limitReachedTime = getTimeDaysAgo(Intervals.SECOND_DISPLAY_NOT_RATED + 1);
			await rememberEventWithTime(RateEvent.ANY_EVENT_COUNTER_REACHED_LIMIT, { time: limitReachedTime });
			const rateBoxOpenedTime = getTimeDaysAgo(Intervals.SECOND_DISPLAY_NOT_RATED + 1);
			await rememberEventWithTime(RateEvent.RATE_BOX_OPENED, { time: rateBoxOpenedTime });
			const result = AppRatingManager.canOpenAppRating();
			expect(result).toBe(true);
		});

		test('should return false if rate box shown twice, not rated, and time for third display not come', async () => {
			const secondAndThirdIntervalsSum = Intervals.SECOND_DISPLAY_NOT_RATED + Intervals.THIRD_DISPLAY_NOT_RATED;
			const limitReachedTime = getTimeDaysAgo(secondAndThirdIntervalsSum);
			await rememberEventWithTime(RateEvent.ANY_EVENT_COUNTER_REACHED_LIMIT, { time: limitReachedTime });
			const firstRateBoxOpenTime = getTimeDaysAgo(secondAndThirdIntervalsSum);
			await rememberEventWithTime(RateEvent.RATE_BOX_OPENED, { time: firstRateBoxOpenTime });
			const secondRateBoxOpenTime = getTimeDaysAgo(Intervals.THIRD_DISPLAY_NOT_RATED - 1);
			await rememberEventWithTime(RateEvent.RATE_BOX_OPENED, { time: secondRateBoxOpenTime });

			const result = AppRatingManager.canOpenAppRating();
			expect(result).toBe(false);
		});

		test('should return false if rate box shown twice, not rated, and time for third display come', async () => {
			const secondAndThirdIntervalsSum = Intervals.SECOND_DISPLAY_NOT_RATED + Intervals.THIRD_DISPLAY_NOT_RATED;
			const limitReachedTime = getTimeDaysAgo(secondAndThirdIntervalsSum + 1);
			await rememberEventWithTime(RateEvent.ANY_EVENT_COUNTER_REACHED_LIMIT, { time: limitReachedTime });
			const firstRateBoxOpenTime = getTimeDaysAgo(secondAndThirdIntervalsSum + 1);
			await rememberEventWithTime(RateEvent.RATE_BOX_OPENED, { time: firstRateBoxOpenTime });
			const secondRateBoxOpenTime = getTimeDaysAgo(Intervals.THIRD_DISPLAY_NOT_RATED + 1);
			await rememberEventWithTime(RateEvent.RATE_BOX_OPENED, { time: secondRateBoxOpenTime });

			const result = AppRatingManager.canOpenAppRating();
			expect(result).toBe(true);
		});

		test('should return false if rate box shown third, not rated, and time for subsequent display not come', async () => {
			const allNotRatedIntervalsSum = Intervals.SECOND_DISPLAY_NOT_RATED
				+ Intervals.THIRD_DISPLAY_NOT_RATED + Intervals.SUBSEQUENT_DISPLAYS_NOT_RATED;
			const secondAndThirdIntervalsSum = Intervals.SECOND_DISPLAY_NOT_RATED + Intervals.THIRD_DISPLAY_NOT_RATED;
			const limitReachedTime = getTimeDaysAgo(allNotRatedIntervalsSum + 1);
			await rememberEventWithTime(RateEvent.ANY_EVENT_COUNTER_REACHED_LIMIT, { time: limitReachedTime });
			const firstRateBoxOpenTime = getTimeDaysAgo(allNotRatedIntervalsSum + 1);
			await rememberEventWithTime(RateEvent.RATE_BOX_OPENED, { time: firstRateBoxOpenTime });
			const secondRateBoxOpenTime = getTimeDaysAgo(secondAndThirdIntervalsSum + 1);
			await rememberEventWithTime(RateEvent.RATE_BOX_OPENED, { time: secondRateBoxOpenTime });
			const thirdRateBoxOpenTime = getTimeDaysAgo(Intervals.SUBSEQUENT_DISPLAYS_NOT_RATED - 1);
			await rememberEventWithTime(RateEvent.RATE_BOX_OPENED, { time: thirdRateBoxOpenTime });

			const result = AppRatingManager.canOpenAppRating();
			expect(result).toBe(false);
		});

		test('should return false if rate box shown third, not rated, and time for subsequent display come', async () => {
			const allNotRatedIntervalsSum = Intervals.SECOND_DISPLAY_NOT_RATED
				+ Intervals.THIRD_DISPLAY_NOT_RATED + Intervals.SUBSEQUENT_DISPLAYS_NOT_RATED;
			const secondAndThirdIntervalsSum = Intervals.SECOND_DISPLAY_NOT_RATED + Intervals.THIRD_DISPLAY_NOT_RATED;
			const limitReachedTime = getTimeDaysAgo(allNotRatedIntervalsSum + 1);
			await rememberEventWithTime(RateEvent.ANY_EVENT_COUNTER_REACHED_LIMIT, { time: limitReachedTime });
			const firstRateBoxOpenTime = getTimeDaysAgo(allNotRatedIntervalsSum + 1);
			await rememberEventWithTime(RateEvent.RATE_BOX_OPENED, { time: firstRateBoxOpenTime });
			const secondRateBoxOpenTime = getTimeDaysAgo(secondAndThirdIntervalsSum + 1);
			await rememberEventWithTime(RateEvent.RATE_BOX_OPENED, { time: secondRateBoxOpenTime });
			const thirdRateBoxOpenTime = getTimeDaysAgo(Intervals.SUBSEQUENT_DISPLAYS_NOT_RATED + 1);
			await rememberEventWithTime(RateEvent.RATE_BOX_OPENED, { time: thirdRateBoxOpenTime });

			const result = AppRatingManager.canOpenAppRating();
			expect(result).toBe(true);
		});

		test('should return false if app rated with not top value, and time for next display not come', async () => {
			const limitReachedTime = getTimeDaysAgo(Intervals.DISPLAY_FOR_RATED - 1);
			await rememberEventWithTime(RateEvent.ANY_EVENT_COUNTER_REACHED_LIMIT, { time: limitReachedTime });
			const firstRateBoxOpenTime = getTimeDaysAgo(Intervals.DISPLAY_FOR_RATED - 1);
			await rememberEventWithTime(RateEvent.RATE_BOX_OPENED, { time: firstRateBoxOpenTime });
			const appRateTime = getTimeDaysAgo(Intervals.DISPLAY_FOR_RATED - 1);
			await rememberEventWithTime(RateEvent.APP_RATED, { time: appRateTime, context: { value: HighestRate - 1 } });

			const result = AppRatingManager.canOpenAppRating();
			expect(result).toBe(false);
		});

		test('should return true if app rated with not top value, and time for next display come', async () => {
			const limitReachedTime = getTimeDaysAgo(Intervals.DISPLAY_FOR_RATED + 1);
			await rememberEventWithTime(RateEvent.ANY_EVENT_COUNTER_REACHED_LIMIT, { time: limitReachedTime });
			const firstRateBoxOpenTime = getTimeDaysAgo(Intervals.DISPLAY_FOR_RATED + 1);
			await rememberEventWithTime(RateEvent.RATE_BOX_OPENED, { time: firstRateBoxOpenTime });
			const appRateTime = getTimeDaysAgo(Intervals.DISPLAY_FOR_RATED + 1);
			await rememberEventWithTime(RateEvent.APP_RATED, { time: appRateTime, context: { value: HighestRate - 1 } });

			const result = AppRatingManager.canOpenAppRating();
			expect(result).toBe(true);
		});

		test('should return true if app rated top value, but user not went to store', async () => {
			const limitReachedTime = getTimeDaysAgo(Intervals.DISPLAY_FOR_RATED * 2);
			await rememberEventWithTime(RateEvent.ANY_EVENT_COUNTER_REACHED_LIMIT, { time: limitReachedTime });
			const firstRateBoxOpenTime = getTimeDaysAgo(Intervals.DISPLAY_FOR_RATED * 2);
			await rememberEventWithTime(RateEvent.RATE_BOX_OPENED, { time: firstRateBoxOpenTime });
			const appRateTime = getTimeDaysAgo(Intervals.DISPLAY_FOR_RATED * 2);
			await rememberEventWithTime(RateEvent.APP_RATED, { time: appRateTime, context: { value: HighestRate } });

			const result = AppRatingManager.canOpenAppRating();
			expect(result).toBe(true);
		});

		test('should return false if app rated top value and user went to store', async () => {
			const limitReachedTime = getTimeDaysAgo(Intervals.DISPLAY_FOR_RATED * 2);
			await rememberEventWithTime(RateEvent.ANY_EVENT_COUNTER_REACHED_LIMIT, { time: limitReachedTime });
			const firstRateBoxOpenTime = getTimeDaysAgo(Intervals.DISPLAY_FOR_RATED * 2);
			await rememberEventWithTime(RateEvent.RATE_BOX_OPENED, { time: firstRateBoxOpenTime });
			const appRateTime = getTimeDaysAgo(Intervals.DISPLAY_FOR_RATED * 2);
			await rememberEventWithTime(RateEvent.APP_RATED, { time: appRateTime, context: { value: HighestRate } });
			const userWentToStoreTime = getTimeDaysAgo(Intervals.DISPLAY_FOR_RATED * 2);
			await rememberEventWithTime(RateEvent.USER_WENT_TO_STORE, { time: userWentToStoreTime });

			const result = AppRatingManager.canOpenAppRating();
			expect(result).toBe(false);
		});
	});
})();
