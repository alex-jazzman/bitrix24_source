/**
 * @module app-rating-manager/manual-testing-tool
 */
jn.define('app-rating-manager/manual-testing-tool', (require, exports, module) => {
	const { TestUserEvent } = require('app-rating-manager/manual-testing-tool/src/event');
	const { TestUserEventLimit } = require('app-rating-manager/manual-testing-tool/src/limit');
	const { TestTouristEventStorageProvider } = require('app-rating-manager/manual-testing-tool/src/test-tourist-storage-provider');
	const { createTestIdGenerator } = require('utils/test');
	const { BaseManualTestingTool, FieldType } = require('manual-testing-tools');

	const { AppRatingManagerClass, RateEvent } = require('app-rating-manager');

	const provider = new TestTouristEventStorageProvider();
	const AppRatingManager = new AppRatingManagerClass({
		eventStorageProvider: provider,
	});

	const maxRateValue = 5;

	/**
	 * @class AppRatingManagerManualTestingTool
	 */
	class AppRatingManagerManualTestingTool extends BaseManualTestingTool
	{
		constructor(props)
		{
			super(props);
			this.getTestId = createTestIdGenerator({
				prefix: 'app-rating-manual-testing-tool',
				context: this,
			});
			this.#initState();
		}

		getSettings()
		{
			const {
				isRated,
				rateLastTime,
				rateLastValue,
				isUserWentToStore,
				limits,
				counters,
				rateBoxLastDisplayTime,
				rateBoxDisplayCount,
				isAnyLimitReached,
				anyLimitReachedTime,
			} = this.state;

			return [
				{
					title: 'Оценка приложения',
					testId: this.getTestId('is-rate-switcher'),
					type: FieldType.BOOLEAN,
					value: isRated,
					label: 'Оценил приложение',
					onChange: this.#isRatedOnChange,
				},
				{
					testId: this.getTestId('last-rated-time'),
					type: FieldType.DATETIME,
					value: rateLastTime ?? null,
					label: 'Дата последней оценки',
					onChange: this.#rateLastTimeOnChange,
				},
				{
					testId: this.getTestId('last-rated-value'),
					type: FieldType.NUMBER,
					value: rateLastValue ?? 0,
					label: `Значение последней оценки (от 1 до ${maxRateValue})`,
					onChange: this.#rateLastValueOnChange,
				},
				{
					title: 'Клиент ушел в стор после оценки',
					testId: this.getTestId('is-user-went-to-store-switcher'),
					type: FieldType.BOOLEAN,
					value: isUserWentToStore,
					label: 'Ушел в стор',
					onChange: this.#userWentToStoreBooleanOnChange,
				},
				{
					title: 'Значения лимитов событий',
					type: FieldType.GROUP,
					fields: Object.values(TestUserEvent).map((event) => ({
						testId: this.getTestId(`event-limit-input-${event}`),
						value: limits[event],
						label: event,
						onChange: this.#eventCounterLimitOnChange,
					})),
				},
				{
					title: 'Значения счетчиков событий',
					type: FieldType.GROUP,
					fields: Object.values(TestUserEvent).map((event) => ({
						testId: this.getTestId(`event-counter-input-${event}`),
						value: counters[event] ?? 0,
						label: event,
						onChange: this.#eventCounterOnChange,
					})),
				},
				{
					title: 'Открытие ящика оценки',
					type: FieldType.GROUP,
					fields: [
						{
							testId: this.getTestId('event-counter-input-last-display-time'),
							type: FieldType.DATETIME,
							value: rateBoxLastDisplayTime ?? null,
							label: 'Дата последнего открытия',
							onChange: this.#rateBoxLastDisplayTimeOnChange,
						},
						{
							testId: this.getTestId('event-counter-input-last-display-time'),
							value: rateBoxDisplayCount,
							label: 'Кол-во открытий',
							onChange: this.#rateBoxDisplayCountOnChange,
						},
					],
				},
				{
					title: 'Лимит какого-то счетчика достигнут',
					type: FieldType.GROUP,
					fields: [
						{
							testId: this.getTestId('input-any-limit-reached-time'),
							type: FieldType.DATETIME,
							value: anyLimitReachedTime ?? null,
							label: 'Дата достижения лимита',
							onChange: this.#anyLimitReachedTimeOnChange,
						},
						{
							testId: this.getTestId('switcher-any-limit-reached'),
							type: FieldType.BOOLEAN,
							value: isAnyLimitReached,
							label: 'Лимит достигнут',
							onChange: this.#anyLimitReachedBooleanOnChange,
						},
					],
				},
			];
		}

		#registerInitialLimits = () => {
			if (this.#hasLimitsInStore())
			{
				return;
			}
			const limitsFromStore = this.#getLimitsFromStore();

			AppRatingManager.registerLimits({
				...TestUserEventLimit,
				...limitsFromStore,
			});
		};

		#getLimitsFromStore = () => {
			return AppRatingManager.getLimits();
		};

		#hasLimitsInStore = () => {
			const limitsFromStore = this.#getLimitsFromStore();

			return Object.keys(limitsFromStore).length >= Object.keys(TestUserEventLimit).length;
		};

		#initState = () => {
			const limitsFromStore = AppRatingManager.getLimits();
			const countersFromStore = AppRatingManager.getCounters();
			const rateBoxLastDisplayTime = this.#convertDateToTimeStamp(
				provider.getLastTime(RateEvent.RATE_BOX_OPENED),
			);
			const rateBoxDisplayCount = provider.getNumberOfTimes(RateEvent.RATE_BOX_OPENED);
			const anyLimitReachedTime = this.#convertDateToTimeStamp(
				provider.getLastTime(RateEvent.ANY_EVENT_COUNTER_REACHED_LIMIT),
			);
			const isAnyLimitReached = provider.getNumberOfTimes(RateEvent.ANY_EVENT_COUNTER_REACHED_LIMIT) > 0;
			const isUserWentToStore = provider.getNumberOfTimes(RateEvent.USER_WENT_TO_STORE) > 0;
			const rateLastValue = provider.getContext(RateEvent.APP_RATED)?.value;
			const rateLastTime = this.#convertDateToTimeStamp(
				provider.getLastTime(RateEvent.APP_RATED),
			);
			const isRated = provider.getNumberOfTimes(RateEvent.APP_RATED) > 0;

			this.state = {
				limits: limitsFromStore,
				counters: countersFromStore,
				rateBoxLastDisplayTime,
				rateBoxDisplayCount,
				anyLimitReachedTime,
				isAnyLimitReached,
				isUserWentToStore,
				rateLastValue,
				rateLastTime,
				isRated,
			};
		};

		async componentDidMount()
		{
			await provider.init();
			this.#registerInitialLimits();
			const limitsFromStore = AppRatingManager.getLimits();
			const countersFromStore = AppRatingManager.getCounters();
			const rateBoxLastDisplayTime = this.#convertDateToTimeStamp(
				provider.getLastTime(RateEvent.RATE_BOX_OPENED),
			);
			const rateBoxDisplayCount = provider.getNumberOfTimes(RateEvent.RATE_BOX_OPENED);
			const anyLimitReachedTime = this.#convertDateToTimeStamp(
				provider.getLastTime(RateEvent.ANY_EVENT_COUNTER_REACHED_LIMIT),
			);
			const isAnyLimitReached = provider.getNumberOfTimes(RateEvent.ANY_EVENT_COUNTER_REACHED_LIMIT) > 0;
			const isUserWentToStore = provider.getNumberOfTimes(RateEvent.USER_WENT_TO_STORE) > 0;
			const rateLastValue = provider.getContext(RateEvent.APP_RATED)?.value;
			const rateLastTime = this.#convertDateToTimeStamp(
				provider.getLastTime(RateEvent.APP_RATED),
			);
			const isRated = provider.getNumberOfTimes(RateEvent.APP_RATED) > 0;

			this.setState({
				limits: limitsFromStore,
				counters: countersFromStore,
				rateBoxLastDisplayTime,
				rateBoxDisplayCount,
				anyLimitReachedTime,
				isAnyLimitReached,
				isUserWentToStore,
				rateLastValue,
				rateLastTime,
				isRated,
			});
		}

		#rateLastValueOnChange = ({ value }) => {
			const { rateLastTime } = this.state;
			const newTime = this.#convertTimeStampToDate(rateLastTime);
			const newRateLastValue = value === '' ? 0 : Number(value);
			if (newRateLastValue === 0)
			{
				this.setState({
					rateLastValue: null,
					isRated: false,
					rateLastTime: null,
				}, () => {
					void provider.forget(RateEvent.APP_RATED);
				});

				return;
			}

			this.setState({
				rateLastValue: newRateLastValue,
				isRated: true,
				rateLastTime: this.#convertDateToTimeStamp(newTime),
			}, () => {
				void provider.save(RateEvent.APP_RATED, {
					context: {
						value: newRateLastValue,
					},
					time: newTime,
					count: 1,
				});
			});
		};

		#rateLastTimeOnChange = ({ value }) => {
			const { rateLastValue } = this.state;
			const newTime = this.#convertTimeStampToDate(value);
			const newRateLastValue = rateLastValue ?? maxRateValue;
			this.setState({
				rateLastTime: value,
				isRated: true,
				rateLastValue: newRateLastValue,
			}, () => {
				void provider.save(RateEvent.APP_RATED, {
					context: {
						value: newRateLastValue,
					},
					time: newTime,
					count: 1,
				});
			});
		};

		#isRatedOnChange = async ({ value }) => {
			if (!value)
			{
				await provider.forget(RateEvent.APP_RATED);
				this.setState({
					isRated: false,
					rateLastValue: null,
					rateLastTime: null,
				});

				return;
			}

			const newTime = new Date();
			await provider.save(RateEvent.APP_RATED, {
				context: {
					value: maxRateValue,
				},
				time: newTime,
				count: 1,
			});
			this.setState({
				isRated: true,
				rateLastValue: maxRateValue,
				rateLastTime: this.#convertDateToTimeStamp(newTime),
			});
		};

		#userWentToStoreBooleanOnChange = async ({ value }) => {
			if (!value)
			{
				await provider.forget(RateEvent.USER_WENT_TO_STORE);
				this.setState({
					isUserWentToStore: false,
				});

				return;
			}

			const newTime = new Date();
			await provider.save(RateEvent.USER_WENT_TO_STORE, {
				context: null,
				time: newTime,
				count: 1,
			});

			this.setState({
				isUserWentToStore: true,
			});
		};

		#eventCounterLimitOnChange = ({ value, label }) => {
			AppRatingManager.registerLimit(label, value);
			this.setState({
				limits: {
					...this.state.limits,
					[label]: value,
				},
			});
		};

		#eventCounterOnChange = ({ value, label }) => {
			AppRatingManager.setCounterValue(label, value);
			this.setState({
				counters: {
					...this.state.counters,
					[label]: value,
				},
			});
		};

		#rateBoxDisplayCountOnChange = async ({ value }) => {
			const { rateBoxLastDisplayTime } = this.state;
			const preparedValue = value === '' ? 0 : Number(value);

			if (preparedValue <= 0)
			{
				this.setState({
					rateBoxDisplayCount: 0,
					rateBoxLastDisplayTime: null,
				}, () => {
					void provider.forget(RateEvent.RATE_BOX_OPENED);
				});

				return;
			}

			const newTime = rateBoxLastDisplayTime ? this.#convertTimeStampToDate(rateBoxLastDisplayTime) : new Date();
			this.setState({
				rateBoxDisplayCount: preparedValue,
				rateBoxLastDisplayTime: this.#convertDateToTimeStamp(newTime),
			}, () => {
				void provider.save(RateEvent.RATE_BOX_OPENED, {
					context: null,
					time: newTime,
					count: preparedValue,
				});
			});
		};

		#rateBoxLastDisplayTimeOnChange = async ({ value }) => {
			const { rateBoxDisplayCount } = this.state;
			const newRateBoxDisplayCount = rateBoxDisplayCount > 0 ? rateBoxDisplayCount : 1;
			await provider.save(RateEvent.RATE_BOX_OPENED, {
				context: null,
				time: this.#convertTimeStampToDate(value),
				count: newRateBoxDisplayCount,
			});

			this.setState({
				rateBoxDisplayCount: newRateBoxDisplayCount,
				rateBoxLastDisplayTime: value,
			});
		};

		#anyLimitReachedBooleanOnChange = async ({ value }) => {
			if (!value)
			{
				await provider.forget(RateEvent.ANY_EVENT_COUNTER_REACHED_LIMIT);
				this.setState({
					isAnyLimitReached: false,
					anyLimitReachedTime: null,
				});

				return;
			}

			const newTime = new Date();
			await provider.save(RateEvent.ANY_EVENT_COUNTER_REACHED_LIMIT, {
				context: null,
				time: newTime,
				count: value,
			});

			this.setState({
				isAnyLimitReached: true,
				anyLimitReachedTime: this.#convertDateToTimeStamp(newTime),
			});
		};

		#anyLimitReachedTimeOnChange = async ({ value }) => {
			await provider.save(RateEvent.ANY_EVENT_COUNTER_REACHED_LIMIT, {
				context: null,
				time: this.#convertTimeStampToDate(value),
				count: 1,
			});

			this.setState({
				isAnyLimitReached: true,
				anyLimitReachedTime: value,
			});
		};

		/**
		 * @param {number|null} timeStamp
		 * returns {Date|null}
		 */
		#convertTimeStampToDate(timeStamp)
		{
			return timeStamp ? new Date(timeStamp * 1000) : new Date();
		}

		/**
		 * @param {Date} date
		 * @returns {number|null}
		 */
		#convertDateToTimeStamp(date)
		{
			return date ? Math.floor(date.getTime() / 1000) : null;
		}
	}

	module.exports = {
		AppRatingManagerManualTestingTool: (props) => new AppRatingManagerManualTestingTool(props),
		TestUserEvent,
		TestUserEventLimit,
	};
});
