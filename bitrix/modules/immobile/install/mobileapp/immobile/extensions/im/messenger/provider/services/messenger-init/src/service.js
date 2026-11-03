/**
 * @module im/messenger/provider/services/messenger-init/service
 */
jn.define('im/messenger/provider/services/messenger-init/service', (require, exports, module) => {
	const { MemoryStorage } = require('native/memorystore');
	const { EntityReady } = require('entity-ready');
	const {
		EventType,
		MessengerInitRestMethod,
	} = require('im/messenger/const');
	const { runAction } = require('im/messenger/lib/rest');
	const { getLogger } = require('im/messenger/lib/logger');

	const logger = getLogger('provider--services--messenger-init');

	/**
	 * Upper bound of waiting for the onceOnInit handlers. The server wave handler waits for the tab
	 * widget, and that promise neither rejects nor has a timeout of its own.
	 */
	const INIT_HANDLERS_WAIT_TIMEOUT_MS = 5000;

	/**
	 * @implements {Unsubscribable}
	 * @class MessengerInitService
	 */
	class MessengerInitService
	{
		/** @type {Array<Promise<void>>} */
		#onceInitHandlerPromises = [];
		/**
		 * @desc Subscriptions of `onceOnInit` that have not received their result yet. A subscription
		 * belongs to the run that started after it was made, and is served by the response of that very
		 * run: a subscriber asked about the request its own options were built for.
		 * @type {Set<OnceInitSubscription>}
		 */
		#onceInitSubscriptions = new Set();
		#runCounter = 0;
		/** @type {number|null} id of the run whose result is being dispatched right now */
		#emittingRunId = null;

		actionCommonMethodList = [
			MessengerInitRestMethod.mobileRevision,
			MessengerInitRestMethod.portalCounters,
			MessengerInitRestMethod.serverTime,
			MessengerInitRestMethod.userData,
		];

		commonActionResultStoreId = 'chatCommonActionResult';
		commonActionResultEntityId = 'chat-common-action-result';

		/**
		 * @constructor
		 * @param {string} options.actionName
		 */
		constructor(options)
		{
			this.actionName = options.actionName;
			this.eventEmitter = new JNEventEmitter();
			this.commonActionResultStore = new MemoryStorage(this.commonActionResultStoreId);
			EntityReady.addCondition(this.commonActionResultEntityId, () => this.isReadyCommonActionResult);
		}

		/**
		 * @param {string[]} methodList
		 * @param {object} options
		 * @description Sends a request to initialize messenger component.
		 * If some common data for different contexts has not been received before, it also requests it.
		 * Other contexts may be waiting for the request to be ready from the massager context
		 * if the common data is not saved in the storage.
		 */
		async runAction(methodList, options = {})
		{
			const runId = this.#claimPendingSubscriptions();

			try
			{
				const result = await this.fetchInitResult(methodList, options);

				// only the handlers of the current run are collected: a previous run whose promises were
				// never awaited must not hold the startup
				this.#onceInitHandlerPromises = [];
				this.#dispatchResult(runId, result);
			}
			catch (error)
			{
				// the run brought no result, so its subscribers get none: left subscribed they would take
				// the result of the next run for their own, and a handler that keys off the options of its
				// own request - the recent filter, for one - would read a page it never asked for
				this.#dropSubscriptionsOfRun(runId);

				throw error;
			}
		}

		/**
		 * @desc The request of one run and the merge of the data shared between contexts: everything the
		 * result is made of, and nothing of the dispatch. Kept a separate method so that the dispatch can
		 * be exercised without the network step.
		 * @param {string[]} methodList
		 * @param {object} options
		 * @return {Promise<object>}
		 */
		async fetchInitResult(methodList, options)
		{
			const data = this.#prepareActionData(methodList);
			let result = await runAction(this.actionName, {
				data: {
					...data,
					options,
				},
			});

			if (this.#hasCommonActionResultStore())
			{
				const commonActionResultFromStore = await this.#getCommonActionResultStore();
				result = { ...commonActionResultFromStore, ...result };
			}
			else
			{
				await this.#setCommonActionResultStore(result);
			}

			return result;
		}

		/**
		 * @desc Runs the handler once, on the result of the run that started after this call, and never
		 * on the result of another run: the subscriber builds the options of that request and reads its
		 * response by them. A run that failed serves nobody, and its subscribers leave with it.
		 * Additionally remembers the promise returned by the handler, so the startup orchestrator can
		 * wait for it before starting the synchronization.
		 * @param {Function} eventHandler
		 */
		onceOnInit(eventHandler)
		{
			/** @type {OnceInitSubscription} */
			const subscription = { runId: null, listener: null };

			subscription.listener = (...args) => {
				if (subscription.runId !== this.#emittingRunId)
				{
					// the result of a run this subscriber did not ask for; it keeps waiting for its own
					return;
				}

				this.#dropSubscription(subscription);
				this.#onceInitHandlerPromises.push(
					this.#runInitHandler(eventHandler, args)
						.catch((error) => logger.error('onceOnInit handler error', error)),
				);
			};

			this.#onceInitSubscriptions.add(subscription);
			this.#on(EventType.messenger.init, subscription.listener);
		}

		/**
		 * @desc A permanent subscription of a third-party consumer: its promise is NOT remembered,
		 * the startup must not be tied to subsystems unrelated to the order of the recent data.
		 * @param {Function} eventHandler
		 */
		onInit(eventHandler)
		{
			this.#on(EventType.messenger.init, eventHandler);
		}

		/**
		 * @desc Waits for the onceOnInit handlers of the current run to finish - by the fact of
		 * finishing, not by success. After the return the promise collection is emptied.
		 * @param {{ timeoutMs?: number }} [options]
		 * @return {Promise<void>}
		 */
		async waitOnceInitHandlers({ timeoutMs = INIT_HANDLERS_WAIT_TIMEOUT_MS } = {})
		{
			const promiseList = this.#onceInitHandlerPromises;
			this.#onceInitHandlerPromises = [];

			if (promiseList.length === 0)
			{
				return;
			}

			// the stored promises never reject: the failure of a handler is caught on subscription
			const settled = Promise.all(promiseList).then(() => false);

			let timeoutId = null;
			const expired = new Promise((resolve) => {
				timeoutId = setTimeout(() => resolve(true), timeoutMs);
			});

			const isExpired = await Promise.race([settled, expired]);
			clearTimeout(timeoutId);

			if (isExpired)
			{
				logger.warn(`waitOnceInitHandlers: ${promiseList.length} handler(s) did not finish in ${timeoutMs}ms`);
			}
		}

		unsubscribeEvents()
		{
			this.#onceInitSubscriptions.clear();
			this.eventEmitter.removeAll();
		}

		/**
		 * @desc Hands the subscriptions made so far to the run that starts now. A subscription already
		 * bound to an earlier run keeps waiting for it: two runs overlap as soon as a refresh fails and
		 * the next one goes out, and then each response has to reach the subscriber of its own request.
		 * @return {number} id of the starting run
		 */
		#claimPendingSubscriptions()
		{
			this.#runCounter += 1;

			this.#onceInitSubscriptions.forEach((subscription) => {
				subscription.runId ??= this.#runCounter;
			});

			return this.#runCounter;
		}

		/**
		 * @param {number} runId
		 * @param {object} result
		 */
		#dispatchResult(runId, result)
		{
			this.#emittingRunId = runId;
			try
			{
				this.eventEmitter.emit(EventType.messenger.init, [result]);
			}
			finally
			{
				this.#emittingRunId = null;
			}
		}

		/**
		 * @param {number} runId
		 */
		#dropSubscriptionsOfRun(runId)
		{
			this.#onceInitSubscriptions.forEach((subscription) => {
				if (subscription.runId === runId)
				{
					this.#dropSubscription(subscription);
				}
			});
		}

		/**
		 * @param {OnceInitSubscription} subscription
		 */
		#dropSubscription(subscription)
		{
			this.#onceInitSubscriptions.delete(subscription);
			this.eventEmitter.off(EventType.messenger.init, subscription.listener);
		}

		/**
		 * @param {Function} eventHandler
		 * @param {string} eventName
		 */
		#on(eventName, eventHandler)
		{
			this.eventEmitter.on(eventName, eventHandler);
		}

		/**
		 * @desc Turns a synchronous throw of the handler into a rejection, so a failing handler does
		 * not break the dispatch of the result to the rest of the subscribers.
		 * @param {Function} eventHandler
		 * @param {Array} args
		 * @return {Promise<void>}
		 */
		async #runInitHandler(eventHandler, args)
		{
			return eventHandler(...args);
		}

		/**
		 * @param {string[]} methodList
		 * @return {MessengerInitActionData}
		 */
		#prepareActionData(methodList)
		{
			const hasCommonActionResultStore = this.#hasCommonActionResultStore();
			const data = { methodList: [] };

			if (hasCommonActionResultStore)
			{
				data.methodList = this.#filterOutCommonMethods(methodList);
			}
			else
			{
				data.methodList = this.#mergeUniqueMethods(methodList);
			}

			return this.#prepareOptions(data);
		}

		/**
		 * @param {object} data
		 * @param {Array<string>} data.methodList
		 * @return {MessengerInitActionData}
		 */
		#prepareOptions(data)
		{
			const preparedData = { ...data };
			if (preparedData.methodList.includes('portalCounters'))
			{
				preparedData.options ??= {};
				preparedData.options.siteId = env.siteId;
			}

			if (preparedData.methodList.includes('chatsList'))
			{
				preparedData.options ??= {};
				preparedData.options.withCounters = 'N';
			}

			return preparedData;
		}

		/**
		 * @param {immobileTabChatLoadResult | immobileTabChannelLoadResult | immobileTabCopilotLoadResult} actionResult
		 */
		async #setCommonActionResultStore(actionResult)
		{
			/** @type {immobileTabsLoadCommonResult} */
			const commonActionResult = this.actionCommonMethodList.reduce((result, key) => {
				if (key in actionResult)
				{
					// eslint-disable-next-line no-param-reassign
					result[key] = actionResult[key];
				}

				return result;
			}, {});
			await this.commonActionResultStore.set('commonActionResult', commonActionResult);

			this.isReadyCommonActionResult = true;
			EntityReady.ready(this.commonActionResultEntityId);
		}

		/**
		 * @return {immobileTabsLoadCommonResult}
		 */
		#getCommonActionResultStore()
		{
			return this.commonActionResultStore.getSync('commonActionResult');
		}

		#hasCommonActionResultStore()
		{
			const data = this.#getCommonActionResultStore();

			return Boolean(data);
		}

		/**
		 * @param {string[]} methodList
		 */
		#mergeUniqueMethods(methodList)
		{
			const combinedSet = new Set([...methodList, ...this.actionCommonMethodList]);

			return [...combinedSet];
		}

		/**
		 * @param {string[]} methodList
		 */
		#filterOutCommonMethods(methodList)
		{
			return methodList.filter((method) => !this.actionCommonMethodList.includes(method));
		}
	}

	module.exports = {
		MessengerInitService,
	};
});
