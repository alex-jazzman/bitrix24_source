/**
 * @module rest
 */
jn.define('rest', (require, exports, module) => {
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { Type } = require('type');
	const { toMD5 } = require('utils/object');

	// Module factories are lazy, so the BX.ajax.* globals appear only for whoever actually
	// requires the transport. Consumers of rest rely on them being there after it loads.
	require('rest/transport');

	/**
	 * @class RequestExecutor
	 */
	class RequestExecutor
	{
		/**
		 * @param {string} method
		 * @param {RestMethodParams} [options]
		 */
		constructor(method, options)
		{
			this.method = method;
			this.options = options || {};
			/** @type {RestMethodAnswer|null} */
			this.currentAnswer = null;
			/** @type {function(unknown, boolean, RestMethodError=): void|null} */
			this.handler = null;
			/** @type {function(unknown): void|null} */
			this.onCacheFetched = null;
			/** @type {function(boolean): void|null} */
			this.onRequestStart = null;
			/** @type {string|null} */
			this.cacheId = null;
		}

		/**
		 * @param {boolean} [useCache=false]
		 * @returns {Promise<RestRequestResult>}
		 */
		call(useCache = false)
		{
			return new Promise((resolve, reject) => {
				this.abortCurrentRequest();
				this.currentAnswer = null;

				let cacheExists = false;

				if (this.onCacheFetched && useCache)
				{
					if (!this.cacheId)
					{
						this.cacheId = `${toMD5(this.options)}/${this.method}`;
					}

					const cache = Application.storage.getObject(this.cacheId, null);
					if (cache !== null)
					{
						cacheExists = true;
						this.onCacheFetched(cache);
					}
				}

				if (this.onRequestStart)
				{
					this.onRequestStart(cacheExists);
				}

				BX.rest.callMethod(this.method, this.options, null, this.onRequestCreate.bind(this))
					.then((res) => {
						const result = res.answer.result;

						if (this.cacheId && !res.answer.error)
						{
							Application.storage.setObject(this.cacheId, result);
						}

						return this.__internalHandler(res, false, resolve);
					})
					.catch((res) => {
						this.__internalHandler(res, false, reject);
					});
			});
		}

		/**
		 * @returns {Promise<RestRequestResult>} stays unsettled when there is no next page
		 */
		callNext()
		{
			return new Promise((resolve, reject) => {
				if (this.hasNext())
				{
					this.abortCurrentRequest();
					this.currentAnswer.next()
						.then((res) => {
							this.__internalHandler(res, true, resolve);
						})
						.catch((res) => {
							this.__internalHandler(res, true, reject);
						});
				}
			});
		}

		/**
		 * @returns {void}
		 */
		abortCurrentRequest()
		{
			if (!Type.isNil(this.currentAjaxObject))
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
		 * @returns {boolean}
		 */
		hasNext()
		{
			return !Type.isNil(this.currentAnswer) && !Type.isUndefined(this.currentAnswer.answer.next);
		}

		/**
		 * @returns {number|null} how many items the next page brings, at most 50
		 */
		getNextCount()
		{
			if (this.hasNext())
			{
				const countLeft = this.currentAnswer.answer.total - this.currentAnswer.answer.next;

				return countLeft > 50 ? 50 : countLeft;
			}

			return null;
		}

		/**
		 * @returns {number|null} the offset of the next page
		 */
		getNext()
		{
			if (this.hasNext())
			{
				return this.currentAnswer.answer.next;
			}

			return null;
		}

		/**
		 * @private
		 * @param {RestMethodAnswer} ajaxAnswer
		 * @param {boolean} loadMore
		 * @param {function(RestRequestResult): void} promiseCallback
		 * @returns {void}
		 */
		__internalHandler(ajaxAnswer, loadMore, promiseCallback)
		{
			const result = ajaxAnswer.answer.result;
			let error;
			if (Object.hasOwn(ajaxAnswer.answer, 'error'))
			{
				error = { code: ajaxAnswer.answer.error, description: ajaxAnswer.answer.error_description };
			}
			this.currentAnswer = ajaxAnswer;

			if (Type.isFunction(this.handler))
			{
				this.handler(result, loadMore, error);
			}

			if (promiseCallback)
			{
				promiseCallback({ result, loadMore, error });
			}
		}

		/**
		 * @param {function(unknown, boolean, RestMethodError=): void} func
		 * @returns {RequestExecutor}
		 */
		setHandler(func)
		{
			this.handler = func;

			return this;
		}

		/**
		 * @param {function(unknown): void} func
		 * @returns {RequestExecutor}
		 */
		setCacheHandler(func)
		{
			this.onCacheFetched = func;

			return this;
		}

		/**
		 * @param {function(boolean): void} func called with whether the cache answered first
		 * @returns {RequestExecutor}
		 */
		setStartRequestHandler(func)
		{
			this.onRequestStart = func;

			return this;
		}

		/**
		 * @param {string} id
		 * @returns {RequestExecutor}
		 */
		setCacheId(id)
		{
			this.cacheId = id;

			return this;
		}

		/**
		 * @param {RestMethodParams} [options]
		 * @returns {RequestExecutor}
		 */
		setOptions(options = {})
		{
			this.options = options;

			return this;
		}
	}

	/**
	 * Class for delayed rest request
	 * @class DelayedRestRequest
	 */
	class DelayedRestRequest extends RequestExecutor
	{
		/**
		 * @param {string} method
		 * @param {RestMethodParams} [options]
		 */
		constructor(method, options = {})
		{
			super(method, options);
			this.timeoutId = 0;
			this.delay = 500;
		}

		/**
		 * @param {number} delay milliseconds to wait before the request leaves
		 * @returns {DelayedRestRequest}
		 */
		setDelay(delay)
		{
			if (!Type.isUndefined(delay))
			{
				this.delay = Number(delay);
			}

			return this;
		}

		/**
		 * @returns {void}
		 */
		abortCurrentRequest()
		{
			clearTimeout(this.timeoutId);
			super.abortCurrentRequest();
		}

		/**
		 * @returns {Promise<RestRequestResult>}
		 */
		call()
		{
			this.abortCurrentRequest();

			return new Promise((resolve, reject) => {
				// Passing resolve on: an empty then() left the promise of every successful delayed
				// request unsettled, so a caller awaiting it waited for nothing.
				this.timeoutId = setTimeout(() => super.call().then(resolve).catch(reject), this.delay);
			});
		}
	}

	module.exports = {
		RequestExecutor,
		DelayedRestRequest,
		RunActionExecutor,
	};
});

// todo remove after all global usages of the executors in other modules will be cleaned
(function() {
	const require = (ext) => jn.require(ext);
	const { RequestExecutor, RunActionExecutor } = require('rest');

	jnexport(RunActionExecutor);
	jnexport(RequestExecutor);
})();
