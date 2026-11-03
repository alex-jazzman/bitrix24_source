/**
 * @module rest/run-action-executor/src/request-manager
 */
jn.define('rest/run-action-executor/src/request-manager', (require, exports, module) => {
	const { Type } = require('type');

	const REQUEST_STORAGE_NAME = 'requestExecutorStore';
	const isAndroid = Application.getPlatform() === 'android';

	// fix strange setInterval behavior on Android devices
	const REQUEST_TIMEOUT_MS = isAndroid ? 1500 : 1100;
	const REQUEST_INTERVAL_MS = 50;
	const PULSE_INTERVAL_MS = 1000;

	/**
	 * @class RequestManager
	 */
	class RequestManager
	{
		/**
		 * @param {string} action
		 * @param {Record<string, unknown>} options the payload of the action
		 * @param {Logger} logger
		 * @param {TransportNavigation} [navigation={}]
		 * @param {RequestStore} [storage=null]
		 */
		constructor(action, options, logger, navigation = {}, storage = null)
		{
			this.action = action;
			this.options = options || {};
			this.navigation = navigation || {};
			this.cacheId = null;
			this.baseRequestKey = this.#buildBaseRequestKey();
			this.requestKey = this.#buildRequestKey();
			this.pulseInterval = null;
			this.logger = logger;
			this.requestStore = storage || Application.sharedStorage(REQUEST_STORAGE_NAME);
		}

		static PROMISE_STATUS = {
			PENDING: 'pending',
			FULFILLED: 'fulfilled',
			REJECTED: 'rejected',
		};

		/**
		 * @returns {RequestRecord|null}
		 */
		getSameOngoingRequest()
		{
			if (this.requestKey)
			{
				const requestState = this.requestStore.get(this.requestKey);

				return requestState && requestState.status === RequestManager.PROMISE_STATUS.PENDING ? requestState : null;
			}

			return null;
		}

		/**
		 * @param {RequestStatus} [status=RequestManager.PROMISE_STATUS.PENDING]
		 * @param {unknown} [result=null] the answer of the request, or its error; never a function
		 * @returns {void}
		 */
		setRequestStatus(status, result = null)
		{
			const timestamp = Date.now();
			this.requestStore.set(this.requestKey, { status, result, timestamp });

			if (status === RequestManager.PROMISE_STATUS.FULFILLED || status === RequestManager.PROMISE_STATUS.REJECTED)
			{
				this.#clearStorage(timestamp);
				this.#stopPulseMechanism();
			}
		}

		/**
		 * @param {number} timestamp
		 * @returns {void}
		 */
		#clearStorage(timestamp)
		{
			setTimeout(() => {
				const currentState = this.requestStore.get(this.requestKey);

				if (currentState && currentState.timestamp === timestamp)
				{
					this.requestStore.set(this.requestKey, null);
				}
			}, REQUEST_TIMEOUT_MS);
		}

		/**
		 * @returns {void}
		 */
		startRequest()
		{
			this.#startPulseMechanism();
			this.setRequestStatus(RequestManager.PROMISE_STATUS.PENDING);
		}

		/**
		 * @returns {void}
		 */
		#startPulseMechanism()
		{
			// A manager that takes a request over may already be pulsing for its own: overwriting the
			// timer id would strand the old timer, and nobody can clear it afterwards - it would keep
			// reading the storage until the context dies, holding this manager with it.
			this.#stopPulseMechanism();

			this.pulseInterval = setInterval(() => {
				const requestState = this.requestStore.get(this.requestKey);
				if (requestState?.status === RequestManager.PROMISE_STATUS.PENDING)
				{
					this.#updateOngoingRequestTimestamp(requestState);
				}
				else
				{
					this.#stopPulseMechanism();
				}
			}, PULSE_INTERVAL_MS);
		}

		/**
		 * @param {RequestRecord} requestState
		 * @returns {void}
		 */
		#updateOngoingRequestTimestamp(requestState)
		{
			this.setRequestStatus(RequestManager.PROMISE_STATUS.PENDING, requestState.result);
		}

		/**
		 * @returns {void}
		 */
		#stopPulseMechanism()
		{
			if (this.pulseInterval)
			{
				clearInterval(this.pulseInterval);
				this.pulseInterval = null;
			}
		}

		/**
		 * @param {function(): Promise<ActionResponse>} executeRequestCallback
		 * @param {function(ActionResponse): void} internalHandlerCallback
		 * @returns {Promise<ActionResponse>} the answer of the request this duplicate waits for
		 */
		waitOngoingRequestResult(executeRequestCallback, internalHandlerCallback)
		{
			this.logger.info(`Action ${this.action} has a duplicate request that is queued`);

			return new Promise((resolve, reject) => {
				const interval = setInterval(() => {
					const request = this.requestStore.get(this.requestKey);

					if (this.#isRequestCompleted(request))
					{
						this.logger.info(`${this.action} duplicate request have received response`, request);

						clearInterval(interval);

						this.#resolveOngoingRequestResult(request, resolve, reject, internalHandlerCallback);
					}
					else
					{
						this.#tryAgain(executeRequestCallback, resolve, reject, interval);
					}
				}, REQUEST_INTERVAL_MS);
			});
		}

		/**
		 * @param {Record<string, unknown>} options merged into the current payload
		 * @returns {void}
		 */
		updateOptions(options)
		{
			if (Type.isObjectLike(options))
			{
				this.options = Object.assign(this.options, options);
				this.baseRequestKey = this.#buildBaseRequestKey();
				this.requestKey = this.#buildRequestKey();
			}
		}

		/**
		 * @param {String|null} [cacheId]
		 * @returns {void}
		 */
		updateCacheId(cacheId)
		{
			this.cacheId = cacheId;
			this.requestKey = this.#buildRequestKey();
		}

		#buildRequestKey()
		{
			return this.cacheId === null || this.cacheId === undefined
				? this.baseRequestKey
				: `${this.baseRequestKey}/${this.cacheId}`;
		}

		#buildBaseRequestKey()
		{
			const sortedOptions = this.#sortKeysRecursively(this.options);
			const sortedNavigation = this.#sortKeysRecursively(this.navigation);

			return [
				JSON.stringify(sortedOptions),
				JSON.stringify(sortedNavigation),
				this.action,
			].join('/');
		}

		/**
		 * The request key is a serialized value, so two equal payloads have to serialize identically
		 * whatever order their keys were built in.
		 *
		 * @param {unknown} obj
		 * @returns {unknown} the same value with the keys of every nested object sorted
		 */
		#sortKeysRecursively(obj)
		{
			if (typeof obj !== 'object' || obj === null)
			{
				return obj;
			}

			if (Array.isArray(obj))
			{
				return obj.map((item) => this.#sortKeysRecursively(item));
			}

			const sortedKeys = Object.keys(obj).sort();
			const sortedObj = {};
			sortedKeys.forEach((key) => {
				sortedObj[key] = this.#sortKeysRecursively(obj[key]);
			});

			return sortedObj;
		}

		/**
		 * @param {RequestRecord|null} request
		 * @returns {boolean}
		 */
		#isRequestCompleted(request)
		{
			// A record cleared while this duplicate was waiting reads as unfinished on purpose:
			// the liveness check below then finds nothing alive and the duplicate takes the
			// request over. Dereferencing the missing record instead would throw inside the
			// polling timer and leave the promise this method serves unsettled forever.
			return request?.status === RequestManager.PROMISE_STATUS.FULFILLED
				|| request?.status === RequestManager.PROMISE_STATUS.REJECTED;
		}

		/**
		 * @param {RequestRecord} request
		 * @param {function(*): void} resolve
		 * @param {function(*): void} reject
		 * @param {function(*): void} internalHandlerCallback
		 * @returns {void}
		 */
		#resolveOngoingRequestResult(request, resolve, reject, internalHandlerCallback)
		{
			if (request.status === RequestManager.PROMISE_STATUS.FULFILLED)
			{
				this.#handleFulfilledRequest(request, resolve, internalHandlerCallback);
			}
			else if (request.status === RequestManager.PROMISE_STATUS.REJECTED)
			{
				this.#handleRejectedRequest(request, reject);
			}
		}

		/**
		 * @param {RequestRecord} request
		 * @param {function(*): void} resolve
		 * @param {function(*): void} internalHandlerCallback
		 * @returns {void}
		 */
		#handleFulfilledRequest(request, resolve, internalHandlerCallback)
		{
			resolve(request.result);
			internalHandlerCallback(request.result);
		}

		/**
		 * @param {RequestRecord} request
		 * @param {function(*): void} reject
		 * @returns {void}
		 */
		#handleRejectedRequest(request, reject)
		{
			reject(request.result);
		}

		/**
		 * @param {function(): Promise<*>} executeRequestCallback
		 * @param {function(*): void} resolve
		 * @param {function(*): void} reject
		 * @param {number} interval - the polling timer of the duplicate that is waiting
		 * @returns {Promise<void>}
		 */
		async #tryAgain(executeRequestCallback, resolve, reject, interval)
		{
			const isAlive = this.#isRequestAlive();
			if (!isAlive)
			{
				clearInterval(interval);

				// Taking the request over means owning its heartbeat too: a status alone stops being
				// refreshed, and a request slower than the liveness window looks dead to the next
				// duplicate, which then sends the very request this branch exists to avoid.
				this.startRequest();

				this.logger.warn(`Main request of ${this.action} is dead. A queued duplicate request is now being sent to the server`);

				try
				{
					// The callback is asynchronous: without awaiting it the promise itself would be
					// stored as the result and the catch below could never fire.
					resolve(await executeRequestCallback());
				}
				catch (error)
				{
					// The request path closes the record for everything it recognises as an answer,
					// and only what it failed to close is left open here - the heartbeat and every
					// duplicate keep waiting on it otherwise. A record already closed belongs to the
					// server answer: overwriting it would hand the next duplicate the internal error
					// of a screen it knows nothing about instead of that answer.
					if (!this.#isRequestCompleted(this.requestStore.get(this.requestKey)))
					{
						this.setRequestStatus(RequestManager.PROMISE_STATUS.REJECTED, error);
					}

					reject(error);
				}
			}
		}

		/**
		 * @returns {boolean}
		 */
		#isRequestAlive()
		{
			const requestState = this.requestStore.get(this.requestKey);
			if (requestState)
			{
				const currentTime = Date.now();
				const differenceInMilliseconds = currentTime - requestState.timestamp;

				return differenceInMilliseconds < REQUEST_TIMEOUT_MS;
			}

			return false;
		}
	}

	module.exports = {
		RequestManager,
	};
});
