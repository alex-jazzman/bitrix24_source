/**
 * @module rest/run-action-executor
 */
jn.define('rest/run-action-executor', (require, exports, module) => {
	const { RunActionCache } = require('rest/run-action-executor/cache');
	const { RequestManager } = require('rest/run-action-executor/src/request-manager');
	const { runAction } = require('rest/transport');
	const { Type } = require('type');
	const { Logger, LogType } = require('utils/logger');
	const { toMD5 } = require('utils/object');

	const logger = new Logger(
		[
			LogType.INFO,
			LogType.ERROR,
			LogType.WARN,
		],
		true,
	);

	/**
	 * @class RunActionExecutor
	 */
	class RunActionExecutor
	{
		/**
		 * @param {string} action
		 * @param {Record<string, unknown>} [options] the payload of the action
		 * @param {TransportNavigation} [navigation]
		 */
		constructor(action, options, navigation = {})
		{
			this.action = action;
			this.options = options || {};
			this.navigation = navigation || {};
			/** @type {function(ActionResponse, string): void|null} */
			this.handler = null;
			/** @type {function(ActionResponse, string): void|null} */
			this.onCacheFetched = null;
			/** @type {RunActionCache|null} */
			this.cache = null;
			/** @type {string|null} */
			this.cacheId = null;
			this.cacheTtl = 0;
			/** @type {string|null} */
			this.uid = null;
			this.jsonEnabled = false;
			this.skipRequestIfCacheExists = false;
			/** @type {number|null} */
			this.timeout = null;
			/** @type {function(): void|null} */
			this.onTimeout = null;
			/** @type {function(): void|null} */
			this.onNetworkError = null;
			this.skipDuplicateRequests = false;
			this.logger = logger;
			this.requestManager = new RequestManager(action, options, logger, navigation);
		}

		/**
		 * @returns {RunActionExecutor}
		 */
		enableJson()
		{
			this.jsonEnabled = true;

			return this;
		}

		/**
		 * @returns {RunActionCache}
		 */
		getCache()
		{
			if (this.cache === null)
			{
				if (this.cacheId === null)
				{
					this.cacheId = this.getUid();
				}

				this.cache = new RunActionCache({
					id: this.cacheId,
					ttl: this.cacheTtl,
				});
			}

			return this.cache;
		}

		/**
		 * @param {boolean} [useCache=false]
		 * @returns {Promise<ActionResponse>} the answer of the action, successful or not
		 * @throws {Error} when the request never reached the server
		 */
		async call(useCache = false)
		{
			this.abortCurrentRequest();

			if (useCache && this.onCacheFetched)
			{
				const cache = this.getCache().getData();
				if (cache)
				{
					this.onCacheFetched(cache, this.getUid());

					if (this.skipRequestIfCacheExists)
					{
						return Promise.resolve(cache);
					}
				}
			}

			if (this.skipDuplicateRequests)
			{
				const sameOngoingRequest = this.requestManager.getSameOngoingRequest();
				if (sameOngoingRequest)
				{
					return this.requestManager.waitOngoingRequestResult(
						this.#executeRequest.bind(this),
						this.#internalHandler.bind(this),
					);
				}

				this.requestManager.startRequest();
			}

			return this.#executeRequest();
		}

		/**
		 * @returns {Promise<ActionResponse>} the answer of the action, successful or not
		 * @throws {Error} when the request never reached the server
		 */
		async #executeRequest()
		{
			const dataKey = this.jsonEnabled ? 'json' : 'data';
			const timeout = this.#setupTimeout();

			this.logger.info(`Start request: ${this.action}`);

			let response = null;

			// Only the request itself is guarded here. Consumer code runs after the catch on purpose:
			// an exception from the handler is not a server answer, and reading it as one would call
			// that same handler a second time with the thrown value and hand it to the caller as the
			// result of the action.
			try
			{
				response = await runAction(this.action, {
					[dataKey]: this.options,
					navigation: this.navigation,
					onCreate: this.onRequestCreate.bind(this),
				});
			}
			catch (rejection)
			{
				// A thrown Error is not a server response: it means the request never happened.
				// Swallowing it here would replace the real cause with a fabricated one.
				if (rejection instanceof Error)
				{
					clearTimeout(timeout.timeoutId);

					// The caller gets a rejection instead of a handler call, but the deduplication
					// record still has to reach a terminal status: left pending it keeps the pulse
					// running and every later duplicate waits on it forever.
					this.#settleDeduplicatedRequest(RequestManager.PROMISE_STATUS.REJECTED, rejection);

					this.logger.error(`Request to ${this.action} failed`, rejection);

					throw rejection;
				}

				this.#handleErrorResponse({
					timeoutId: timeout.timeoutId,
					isTimeoutActionTriggered: timeout.isTimeoutActionTriggered,
					response: rejection,
				});

				this.logger.error(`Failure response received from ${this.action}`, rejection);

				return rejection;
			}

			this.#handleSuccessResponse({
				timeoutId: timeout.timeoutId,
				response,
			});

			this.logger.info(`Success response received from ${this.action}`, response);

			return response;
		}

		/**
		 * @param {{ timeoutId: ?number, response: ActionResponse }} handleParams
		 * @returns {void}
		 */
		#handleSuccessResponse(handleParams)
		{
			const { timeoutId, response } = handleParams;

			if (timeoutId)
			{
				clearTimeout(timeoutId);
			}

			if (!response?.errors || response.errors.length === 0)
			{
				this.getCache().saveData(response);
			}

			this.#invokeInternalHandler({
				response,
			});
		}

		/**
		 * @param {{ timeoutId: ?number, isTimeoutActionTriggered: boolean, response: ActionResponse }} handleParams
		 * @returns {void}
		 */
		#handleErrorResponse(handleParams)
		{
			const { timeoutId, isTimeoutActionTriggered, response } = handleParams;

			if (timeoutId)
			{
				clearTimeout(timeoutId);
			}

			const errors = Array.isArray(response?.errors) ? response.errors : [];

			if (
				errors.some((error) => error.code === 'NETWORK_ERROR')
				&& !isTimeoutActionTriggered
				&& this.onNetworkError
			)
			{
				try
				{
					this.onNetworkError();
				}
				catch (error)
				{
					// This branch runs inside the catch of the request path, so an exception raised
					// here leaves that path for good: the record would keep its pending status and
					// its heartbeat with nobody left to close them. The record still carries the
					// answer, not this exception - a duplicate reading it waits for the server
					// contract, and the exception belongs to one screen alone.
					this.#settleDeduplicatedRequest(RequestManager.PROMISE_STATUS.REJECTED, response);

					throw error;
				}
			}

			this.#invokeInternalHandler({
				response,
				isPromiseRejected: true,
			});
		}

		/**
		 * @param {{ response: ActionResponse, isPromiseRejected?: boolean }} handleParams
		 * @returns {void}
		 */
		#invokeInternalHandler(handleParams)
		{
			const { response, isPromiseRejected = false } = handleParams;

			try
			{
				this.#internalHandler(response);
			}
			finally
			{
				// The handler belongs to the screen and may throw - after a close, for instance.
				// On the error path that exception leaves the request path altogether, so closing
				// the record here is the only thing standing between a dead request and duplicates
				// waiting on its heartbeat.
				this.#settleDeduplicatedRequest(
					isPromiseRejected ? RequestManager.PROMISE_STATUS.REJECTED : RequestManager.PROMISE_STATUS.FULFILLED,
					response,
				);
			}
		}

		/**
		 * @param {RequestStatus} status
		 * @param {unknown} result the answer of the request, or its error
		 * @returns {void}
		 */
		#settleDeduplicatedRequest(status, result)
		{
			if (this.skipDuplicateRequests)
			{
				this.requestManager.setRequestStatus(status, result);
			}
		}

		/**
		 * @returns {{ timeoutId: ?number, isTimeoutActionTriggered: boolean }}
		 */
		#setupTimeout()
		{
			if (!this.timeout)
			{
				return {
					timeoutId: null,
					isTimeoutActionTriggered: false,
				};
			}

			let isTimeoutActionTriggered = false;
			const timeoutId = setTimeout(() => {
				this.abortCurrentRequest();
				this.onTimeout?.();
				isTimeoutActionTriggered = true;
			}, this.timeout);

			return {
				timeoutId,
				isTimeoutActionTriggered,
			};
		}

		/**
		 * @public
		 * @param {number} timeout milliseconds before the request is aborted
		 * @param {function(): void} onTimeout
		 * @returns {RunActionExecutor}
		 */
		setTimeoutHandler(timeout, onTimeout)
		{
			this.timeout = timeout;
			this.onTimeout = onTimeout;

			return this;
		}

		/**
		 * @param {function(): void} onNetworkError
		 * @returns {RunActionExecutor}
		 */
		setNetworkErrorHandler(onNetworkError)
		{
			this.onNetworkError = onNetworkError;

			return this;
		}

		/**
		 * @returns {void}
		 */
		abortCurrentRequest()
		{
			if (this.currentAjaxObject)
			{
				this.currentAjaxObject.abort();
			}
		}

		/**
		 * @param {{ abort: function(): void }} ajax
		 * @returns {void}
		 */
		onRequestCreate(ajax)
		{
			this.currentAjaxObject = ajax;
		}

		/**
		 * @param {ActionResponse} ajaxAnswer
		 * @returns {void}
		 */
		#internalHandler(ajaxAnswer)
		{
			if (Type.isFunction(this.handler))
			{
				this.handler(ajaxAnswer, this.getUid());
			}
		}

		/**
		 * @param {function(ActionResponse, string): void} func called with the answer and the uid
		 * @returns {RunActionExecutor}
		 */
		setHandler(func)
		{
			this.handler = func;

			return this;
		}

		/**
		 * @param {function(ActionResponse, string): void} func called with the cached answer
		 * @returns {RunActionExecutor}
		 */
		setCacheHandler(func)
		{
			this.onCacheFetched = func;

			return this;
		}

		/**
		 * @param {string} id
		 * @returns {RunActionExecutor}
		 */
		setCacheId(id)
		{
			this.cacheId = id;
			this.requestManager.updateCacheId(id);

			return this;
		}

		/**
		 * @param {number} seconds
		 * @returns {RunActionExecutor}
		 */
		setCacheTtl(seconds)
		{
			this.cacheTtl = seconds;

			return this;
		}

		/**
		 * @returns {string} identifies the request by its action, payload and navigation
		 */
		getUid()
		{
			if (this.uid === null)
			{
				this.uid = `${toMD5(this.options)}/${toMD5(this.navigation)}/${this.action}`;
			}

			return this.uid;
		}

		/**
		 * @param {Record<string, unknown>} [options] merged into the current payload
		 * @returns {RunActionExecutor}
		 */
		updateOptions(options = null)
		{
			if (Type.isObjectLike(options))
			{
				this.options = Object.assign(this.options, options);
				this.requestManager.updateOptions(this.options);
			}

			return this;
		}

		/**
		 * @returns {RunActionExecutor}
		 */
		setSkipRequestIfCacheExists()
		{
			this.skipRequestIfCacheExists = true;

			return this;
		}

		/**
		 * @returns {RunActionExecutor} deduplication stays off below api version 61
		 */
		setSkipDuplicateRequests()
		{
			if (Application.getApiVersion() < 61)
			{
				this.skipDuplicateRequests = false;

				return this;
			}

			this.skipDuplicateRequests = true;

			return this;
		}
	}

	// Note: RequestManager export is intended for testing purposes only.
	module.exports = { RunActionExecutor, RequestManager };
});
