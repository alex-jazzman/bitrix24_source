/**
 * @module my-company/screen/src/api
 */
jn.define('my-company/screen/src/api', (require, exports, module) => {
	const { Type } = require('type');
	const { PerfPoint } = require('debug/prism');
	const { RunActionExecutor } = require('rest/run-action-executor');

	const GET_SECTION_ACTION = 'mobile.Menu.getMyCompany';

	// One day, the same as the record of the menu screen.
	const CACHE_TTL_SECONDS = 86400;
	// The record holds the answer of the action as it is, so its format is the format of the answer: the
	// cache of the app has no api to drop a record, and a changed format can only be left behind by a
	// key of its own.
	const CACHE_SCHEMA_VERSION = 'v3';

	/**
	 * Thin client over the action of the section: the only place that knows its name and its record in the
	 * cache. The answer carries the whole section - which cards there are and what every one of them
	 * shows - and is passed on as it comes.
	 *
	 * @class MyCompanyApi
	 */
	class MyCompanyApi
	{
		constructor()
		{
			// The request the screen is waiting for. The action takes no parameters, so every request of
			// it shares one uid and only the instance tells them apart.
			/** @type {?RunActionExecutor} */
			this.currentExecutor = null;
		}

		/**
		 * Asks the action for the section. With the cache allowed the saved answer is handed over first and
		 * synchronously, and the fresh one replaces it once it lands: the record is never the end of the
		 * load, so a switch of the feature flag arrives with the next answer of the server. A load started
		 * while another one is still on its way replaces it: the request before is aborted, and whatever
		 * still reaches its handlers is dropped.
		 *
		 * @param {object} params
		 * @param {boolean} [params.useCache=true] pass `false` to go past the record of the cache
		 * @param {function(MyCompanySectionData): void} params.onData every answer worth showing, cached or fresh
		 * @param {function(): void} [params.onFailedRefresh] the answer became no state of the screen
		 * @return {Promise<?ActionResponse>} the answer of the action, successful or not, and `null` when
		 *   a newer load has replaced this one
		 * @throws {Error} when the request never reached the server
		 */
		load({ useCache = true, onData, onFailedRefresh })
		{
			this.currentExecutor?.abortCurrentRequest();

			// The two sources of one load told apart: only this place knows which handler an answer came
			// through, so the split into the record of the cache and the round trip to the server is made
			// here rather than on the screen.
			const point = new PerfPoint('My Company Section Request', useCache ? 'cache allowed' : 'server only').start();

			const executor = new RunActionExecutor(GET_SECTION_ACTION)
				.setCacheId(MyCompanyApi.#getCacheId())
				.setCacheTtl(CACHE_TTL_SECONDS)
			;

			const apply = (response) => this.#apply(executor, response, onData, onFailedRefresh);
			const applyFailure = () => {
				if (this.#isAwaited(executor))
				{
					onFailedRefresh?.();
				}
			};

			executor
				.setHandler((response) => {
					point.endPoint('Server Fetch', {
						status: response?.status,
						hasData: Boolean(response?.data),
					});
					point.end();

					apply(response);
				})
				.setNetworkErrorHandler(applyFailure)
			;

			if (useCache)
			{
				executor.setCacheHandler((response) => {
					point.endPoint('Cache Read', { hit: true });

					apply(response);
				});
			}

			this.currentExecutor = executor;

			point.startPoint('Cache Read');
			point.startPoint('Server Fetch');

			const request = executor.call(useCache);

			// the record of the cache is read synchronously inside `call()`, before the request leaves:
			// by now the saved answer has either been handed over or there was none to hand over
			point.endPoint('Cache Read', { hit: false });

			return request.catch((error) => {
				point.endPoint('Server Fetch', { failed: true });
				point.end();

				if (this.#isAwaited(executor))
				{
					throw error;
				}

				return null;
			});
		}

		/**
		 * A failed answer is not a state of the section: the last successful one stays on the screen, and
		 * the mechanism of the cache leaves the record alone on the very same condition.
		 *
		 * @param {RunActionExecutor} executor the request the answer belongs to
		 * @param {ActionResponse} [response]
		 * @param {function(MyCompanySectionData): void} onData
		 * @param {function(): void} [onFailedRefresh]
		 */
		#apply(executor, response, onData, onFailedRefresh)
		{
			if (!this.#isAwaited(executor))
			{
				return;
			}

			if (Type.isArrayFilled(response?.errors) || !response?.data)
			{
				onFailedRefresh?.();

				return;
			}

			onData(response.data);
		}

		/**
		 * An aborted request still calls its handlers, and its answer tells nothing about the one that is
		 * still on its way: it is dropped without a word.
		 *
		 * @param {RunActionExecutor} executor
		 * @return {boolean}
		 */
		#isAwaited(executor)
		{
			return executor === this.currentExecutor;
		}

		/**
		 * The record lives in the storage the whole app shares, and that storage is split neither by portal
		 * nor by user: both belong in the key, or the record of one portal would be read on another as its
		 * own under the same identifier of the user.
		 *
		 * @return {string}
		 */
		static #getCacheId()
		{
			return `my-company_${CACHE_SCHEMA_VERSION}_${currentDomain}_${env.userId}`;
		}
	}

	module.exports = { MyCompanyApi };
});
