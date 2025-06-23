/**
 * @module app-rating-manager
 */
jn.define('app-rating-manager', (require, exports, module) => {
	const { Tourist } = require('tourist');
	const { AppRating, HighestRate, AppRatingAnalytics } = require('layout/ui/app-rating');
	const { isModuleInstalled } = require('module');
	const { Feature } = require('feature');

	const UserEvent = {
		MESSAGES_SENT: 'messages_sent',
		LIVE_FEED_POST_CREATED: 'feed_post_created',
		LIVE_FEED_COMMENTS_LEFT: 'feed_post_commented',
		LIVE_FEED_POSTS_VIEWED: 'feed_post_detail_viewed',
		DEALS_VIEWED: 'crm_deal_viewed',
		CALENDAR_EVENT_VIEWED: 'calendar_event_viewed',
		COPILOT_REQUESTS: 'copilot_query',
		TASKS_CREATED: 'task_created',
		TASKS_VIEWED: 'task_viewed',
		TASKS_COMPLETED: 'task_completed',
		TASKS_IN_FLOW_CREATED: 'flow_task_created',
		BUSINESS_PROCESSES_COMPLETED: 'business_process_executed',
		CHECKINS: 'checkin',
	};

	const UserEventCounterLimit = {
		[UserEvent.MESSAGES_SENT]: 150,
		[UserEvent.LIVE_FEED_POST_CREATED]: 2,
		[UserEvent.LIVE_FEED_COMMENTS_LEFT]: 3,
		[UserEvent.LIVE_FEED_POSTS_VIEWED]: 10,
		[UserEvent.DEALS_VIEWED]: 15,
		[UserEvent.CALENDAR_EVENT_VIEWED]: 15,
		[UserEvent.COPILOT_REQUESTS]: 5,
		[UserEvent.TASKS_CREATED]: 5,
		[UserEvent.TASKS_VIEWED]: 25,
		[UserEvent.TASKS_COMPLETED]: 5,
		[UserEvent.TASKS_IN_FLOW_CREATED]: 3,
		[UserEvent.BUSINESS_PROCESSES_COMPLETED]: 2,
		[UserEvent.CHECKINS]: 10,
	};

	const RateEvent = {
		ANY_EVENT_COUNTER_REACHED_LIMIT: 'anyEventCounterReachedLimit',
		RATE_BOX_OPENED: 'rateBoxOpened',
		APP_RATED: 'appRated',
		USER_WENT_TO_STORE: 'userWentToStore',
	};

	const RateBoxDisplayIntervals = {
		SECOND_DISPLAY_NOT_RATED: 30,
		THIRD_DISPLAY_NOT_RATED: 60,
		SUBSEQUENT_DISPLAYS_NOT_RATED: 365,
		DISPLAY_FOR_RATED: 180,
	};

	const millisecondsInDay = 86_400_000; // 1000 * 60 * 60 * 24;
	const sharedStorageKey = 'app-rating-manager';
	const storedDataKey = `appRatingCounters_user_${env.userId}`;
	const triggerEventDataKey = `lastTriggeredEvent_${env.userId}`;

	class AppRatingManager
	{
		constructor()
		{
			this.onInitialized = Tourist.ready();
		}

		/**
		 * @public
		 * Opens the app rating dialog. Use only when you want to force the dialog
		 * to be shown without any conditions. In other cases, use tryOpenAppRating.
		 * Think twice if you need to use this method.
		 * @param {AppRatingProps} [props = {}]
		 * @param {boolean} [props.openInComponent = false]
		 */
		openAppRating(props = {})
		{
			const openInComponent = props.openInComponent ?? false;
			const triggerEvent = this.#getLastTriggerEvent();

			this.#ready()
				.then(async () => {
					if (openInComponent)
					{
						PageManager.openComponent('JSStackComponent', {
							name: 'JSStackComponent',
							componentCode: 'apprating.box',
							// eslint-disable-next-line no-undef
							scriptPath: availableComponents['apprating.box'].publicUrl,
							canOpenInDefault: true,
							rootWidget: {
								name: 'layout',
								settings: {
									objectName: 'layout',
									modal: true,
									enableNavigationBarBorder: false,
									backdrop: {
										mediumPositionHeight: 450,
										hideNavigationBar: true,
										swipeAllowed: true,
										swipeContentAllowed: true,
										adoptHeightByKeyboard: true,
										horizontalSwipeAllowed: false,
									},
								},
							},
							params: {
								triggerEvent,
							},
						});
						await this.#rememberRateBoxOpened();

						return;
					}

					await AppRating.open({
						...props,
						triggerEvent,
						onGoToStoreButtonClick: async () => {
							await this.#rememberUserWentToStore();
							props.onGoToStoreButtonClick?.();
						},
						onRateAppButtonClick: async (value) => {
							await this.#rememberAppRated(value);
							props.onRateAppButtonClick?.(value);
						},
					});
					await this.#rememberRateBoxOpened();
				})
				.catch(console.error);
		}

		/**
		 * @public
		 * Attempts to open the app rating dialog based on certain conditions.
		 * @param {AppRatingProps} [props]
		 * @param {boolean} [props.openInComponent = false]
		 */
		tryOpenAppRating(props = {})
		{
			this.#ready()
				.then(() => {
					if (this.canOpenAppRating())
					{
						this.openAppRating(props);
					}
				})
				.catch(console.error);
		}

		/**
		 * @public
		 * Use only for 'apprating.box' component.
		 * @param {AppRatingProps} props
		 * @returns {LayoutComponent}
		 */
		renderAppRatingContent(props)
		{
			const triggerEvent = props?.triggerEvent ?? null;

			AppRatingAnalytics.sendDrawerOpen({
				section: triggerEvent,
			});

			return new AppRating({
				...props,
				onGoToStoreButtonClick: async () => {
					await this.#rememberUserWentToStore();
					props.onGoToStoreButtonClick?.();
				},
				onRateAppButtonClick: async (value) => {
					await this.#rememberAppRated(value);
					props.onRateAppButtonClick?.(value);
				},
			});
		}

		/**
		 * @public
		 * @param {UserEvent} event
		 * @returns {Promise<void>}
		 */
		async increaseCounter(event)
		{
			await this.#ready();
			this.#saveLastTriggerEvent(event);

			const counters = this.#getCountersFromSharedStorage();
			if (
				Number.isNaN(counters[event])
				|| this.#isLimitReached(event, counters))
			{
				return;
			}
			counters[event]++;
			this.#saveCountersToSharedStorage(counters);
			if (!this.#hasAnyLimitReachedInPast() && this.#hasAnyLimitReached(counters))
			{
				await Tourist.remember(RateEvent.ANY_EVENT_COUNTER_REACHED_LIMIT);
				this.#saveLastTriggerEvent(event);
			}
		}

		#saveLastTriggerEvent(event)
		{
			Application.sharedStorage(sharedStorageKey).set(triggerEventDataKey, event);
		}

		#getLastTriggerEvent()
		{
			return Application.sharedStorage(sharedStorageKey).get(triggerEventDataKey);
		}

		/**
		 * @public
		 * Should use only for internal tasks and testing purposes.
		 * @returns {boolean}
		 */
		canOpenAppRating()
		{
			if (!Feature.isNativeStoreSupported())
			{
				return false;
			}

			if (!this.#hasAnyLimitReachedInPast())
			{
				return false;
			}

			if (this.#isRateBoxNeverShown())
			{
				return true;
			}

			if (this.#isRateBoxShownOnce() && this.#isTimeForSecondDisplay())
			{
				return true;
			}

			if (this.#isRateBoxShownTwice() && this.#isTimeForThirdDisplay())
			{
				return true;
			}

			if (this.#isRateBoxShownMoreThanTwice() && this.#isTimeForSubsequentDisplays())
			{
				return true;
			}

			if (this.#isAppRated() && !this.#isAppTopRated() && this.#isTimeForRatedDisplay())
			{
				return true;
			}

			return this.#isAppTopRated() && !this.#isUserWentToStore() && this.#isTimeForRatedDisplay();
		}

		/**
		 * @public
		 * Should use for subscribing to user events which appears in isolated js-context.
		 */
		subscribeToUserEvents()
		{
			BX.addCustomEvent('livefeed.postform::onClose', async () => {
				await this.increaseCounter(UserEvent.LIVE_FEED_POST_CREATED);
				this.tryOpenAppRating({
					openInComponent: true,
				});
			});

			BX.addCustomEvent('CheckInPage::startWorkingDayFinished', async () => {
				await this.increaseCounter(UserEvent.CHECKINS);
				this.tryOpenAppRating({
					openInComponent: true,
				});
			});

			BX.addCustomEvent('DetailCard::onClose_Global', async (params) => {
				const isDealDetailPageClosed = params?.entityTypeId === 2;
				if (isDealDetailPageClosed)
				{
					await this.increaseCounter(UserEvent.DEALS_VIEWED);
					this.tryOpenAppRating({
						openInComponent: true,
					});
				}
			});

			BX.addCustomEvent('Comments.UploadQueue::setItem', async (data) => {
				const isLiveFeedPostCommentAdded = data.formId === 'bitrix:socialnetwork.blog.post.comment';
				if (isLiveFeedPostCommentAdded)
				{
					await this.increaseCounter(UserEvent.LIVE_FEED_COMMENTS_LEFT);
				}
			});

			BX.addCustomEvent('app-feedback:onFeedbackSend', async (data) => {
				AppRatingAnalytics.sendSubmitFeedback({
					section: this.#getLastTriggerEvent(),
				});
			});

			BX.addCustomEvent('AppRatingManager.onBizProcTaskCompleted', async (taskRequest) => {
				if (isModuleInstalled('bizproc'))
				{
					const { TaskUserStatus } = require('bizproc/task/task-constants');
					if (taskRequest?.INLINE_USER_STATUS === TaskUserStatus.YES
						|| taskRequest?.INLINE_USER_STATUS === TaskUserStatus.OK)
					{
						await this.increaseCounter(UserEvent.BUSINESS_PROCESSES_COMPLETED);
						this.tryOpenAppRating({
							openInComponent: true,
						});
					}
				}
			});
		}

		async #ready()
		{
			return this.onInitialized;
		}

		#getRateBoxLastDisplayTime()
		{
			return Tourist.lastTime(RateEvent.RATE_BOX_OPENED) ?? null;
		}

		#getRateBoxDisplayCount()
		{
			return Tourist.numberOfTimes(RateEvent.RATE_BOX_OPENED);
		}

		#getRateLastTime()
		{
			return Tourist.lastTime(RateEvent.APP_RATED) ?? null;
		}

		#getUserWentToStoreCount()
		{
			return Tourist.numberOfTimes(RateEvent.USER_WENT_TO_STORE);
		}

		#getAnyLimitReachedTime()
		{
			return Tourist.lastTime(RateEvent.ANY_EVENT_COUNTER_REACHED_LIMIT) ?? null;
		}

		#getRateLastValue()
		{
			return Tourist.getContext(RateEvent.APP_RATED)?.value ?? null;
		}

		#getCountersFromSharedStorage()
		{
			const counters = {};
			Object.values(UserEvent).forEach((event) => {
				counters[event] = 0;
			});
			const countersFromStorage = Application.sharedStorage(sharedStorageKey).get(storedDataKey) ?? '{}';

			return {
				...counters,
				...JSON.parse(countersFromStorage),
			};
		}

		#saveCountersToSharedStorage(counters)
		{
			Application.sharedStorage(sharedStorageKey).set(storedDataKey, JSON.stringify(counters));
		}

		/**
		 * @returns {Promise<void>}
		 */
		async #rememberRateBoxOpened()
		{
			await Tourist.remember(RateEvent.RATE_BOX_OPENED);
		}

		/**
		 * @param {number} value
		 * @returns {Promise<void>}
		 */
		async #rememberAppRated(value)
		{
			await Tourist.remember(RateEvent.APP_RATED, { context: { value } });
		}

		/**
		 * @returns {Promise<void>}
		 */
		async #rememberUserWentToStore()
		{
			if (this.#getUserWentToStoreCount() === 0)
			{
				await Tourist.remember(RateEvent.USER_WENT_TO_STORE);
			}
		}

		#isRateBoxNeverShown()
		{
			return this.#getRateBoxDisplayCount() === 0;
		}

		#isRateBoxShownOnce()
		{
			return this.#getRateBoxDisplayCount() === 1;
		}

		#isRateBoxShownTwice()
		{
			return this.#getRateBoxDisplayCount() === 2;
		}

		#isRateBoxShownMoreThanTwice()
		{
			return this.#getRateBoxDisplayCount() > 2;
		}

		#isUserWentToStore()
		{
			return this.#getUserWentToStoreCount() > 0;
		}

		#isTimeForSecondDisplay()
		{
			return !this.#isAppRated()
				&& this.#getDaysCountSinceRateBoxWasShown() >= RateBoxDisplayIntervals.SECOND_DISPLAY_NOT_RATED;
		}

		#isTimeForThirdDisplay()
		{
			return !this.#isAppRated()
				&& this.#getDaysCountSinceRateBoxWasShown() >= RateBoxDisplayIntervals.THIRD_DISPLAY_NOT_RATED;
		}

		#isTimeForSubsequentDisplays()
		{
			return !this.#isAppRated()
				&& this.#getDaysCountSinceRateBoxWasShown() >= RateBoxDisplayIntervals.SUBSEQUENT_DISPLAYS_NOT_RATED;
		}

		#isTimeForRatedDisplay()
		{
			return this.#getDaysCountSinceRateBoxWasShown() >= RateBoxDisplayIntervals.DISPLAY_FOR_RATED;
		}

		#hasAnyLimitReachedInPast()
		{
			return this.#getAnyLimitReachedTime() !== null;
		}

		#hasAnyLimitReached(counters)
		{
			return Object.values(UserEvent).some((event) => this.#isLimitReached(event, counters));
		}

		#isLimitReached(event, counters)
		{
			return counters[event] >= UserEventCounterLimit[event];
		}

		#isAppRated()
		{
			return this.#getRateLastTime() !== null;
		}

		#isAppTopRated()
		{
			return this.#getRateLastValue() >= HighestRate;
		}

		#getDaysCountSinceRateBoxWasShown()
		{
			const rateBoxLastDisplayTime = this.#getRateBoxLastDisplayTime();
			if (rateBoxLastDisplayTime === null)
			{
				return 0;
			}

			return Math.floor(
				(Date.now() - rateBoxLastDisplayTime) / millisecondsInDay,
			);
		}
	}

	module.exports = {
		AppRatingManager: new AppRatingManager(),
		UserEvent,
		RateEvent,
		UserEventCounterLimit,
		RateBoxDisplayIntervals,
		millisecondsInDay,
		sharedStorageKey,
		storedDataKey,
	};
});
