/**
 * @module im/messenger/lib/params/src/reader
 */
jn.define('im/messenger/lib/params/src/reader', (require, exports, module) => {
	const { Type } = require('type');
	const { EntityReady } = require('entity-ready');
	const {
		sharedParamsStorage,
		isMessengerContext,
		SHARED_PARAMS_STORAGE_KEY,
		SHARED_PARAMS_READY_ENTITY_ID,
		SHARED_PARAMS_DEFAULT_TIMEOUT_MS,
	} = require('im/messenger/lib/params/src/shared-storage');

	/**
	 * Local copy of withTimeout. We cannot require it from im/messenger/lib/utils
	 * because the utils bundle pulls in extensions that already depend on params,
	 * which would create a load-time cycle.
	 * @param {Promise} promise
	 * @param {number} ms
	 * @return {Promise}
	 */
	const raceWithTimeout = (promise, ms) => {
		let timeoutId = null;
		const timeoutPromise = new Promise((_, reject) => {
			timeoutId = setTimeout(() => reject(new Error(`Promise timed out after ${ms}ms`)), ms);
		});

		return Promise.race([promise, timeoutPromise])
			.finally(() => clearTimeout(timeoutId));
	};

	let loggerInstance = null;
	// Lazy logger lookup avoids a require-graph cycle: params -> reader -> logger -> feature -> params.
	const getLogger = () => {
		if (!loggerInstance)
		{
			const { LoggerManager } = require('im/messenger/lib/logger');
			loggerInstance = LoggerManager.getInstance().getLogger('params-reader');
		}

		return loggerInstance;
	};

	/**
	 * @class MessengerParamsReader
	 * @description Used only inside embedded contexts (im/messenger/core/embedded).
	 * Waits for the writer to publish a snapshot, hands it to MessengerParams as a local
	 * read-only source, and subscribes to subsequent updates so runtime changes
	 * (e.g. updateExistingImFeatures) propagate without re-bootstrap. The snapshot is NOT
	 * written into BX.componentParameters — that would collide with the host context's own
	 * params (mailmobile, etc.).
	 */
	class MessengerParamsReader
	{
		#isSubscribed = false;
		/** @type {import('./params').MessengerParams} */
		#params;

		#handleStorageChange = ({ key, newValue }) => {
			if (key !== SHARED_PARAMS_STORAGE_KEY)
			{
				return;
			}

			this.#applySnapshot(newValue);
		};

		/**
		 * @param {import('./params').MessengerParams} params
		 */
		constructor(params)
		{
			this.#params = params;
		}

		/**
		 * @param {{ timeout?: number }} [options]
		 */
		async hydrate({ timeout = SHARED_PARAMS_DEFAULT_TIMEOUT_MS } = {})
		{
			if (isMessengerContext())
			{
				return;
			}

			try
			{
				await raceWithTimeout(EntityReady.wait(SHARED_PARAMS_READY_ENTITY_ID), timeout);
			}
			catch (error)
			{
				getLogger().warn('MessengerParamsReader.hydrate: shared params not ready, falling back to defaults', error);

				return;
			}

			this.#applySnapshot(sharedParamsStorage.getSync(SHARED_PARAMS_STORAGE_KEY));
		}

		subscribeForUpdates()
		{
			if (isMessengerContext())
			{
				return;
			}

			if (this.#isSubscribed)
			{
				return;
			}

			sharedParamsStorage.on('changed', this.#handleStorageChange);
			this.#isSubscribed = true;
		}

		/**
		 * @param {object | null | undefined} snapshot
		 */
		#applySnapshot(snapshot)
		{
			if (!Type.isPlainObject(snapshot))
			{
				return;
			}

			this.#params.setLocalParams(snapshot);
		}
	}

	module.exports = { MessengerParamsReader };
});
