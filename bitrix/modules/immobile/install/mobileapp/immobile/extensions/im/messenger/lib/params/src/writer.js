/**
 * @module im/messenger/lib/params/src/writer
 */
jn.define('im/messenger/lib/params/src/writer', (require, exports, module) => {
	const { EntityReady } = require('entity-ready');
	const {
		sharedParamsStorage,
		isMessengerContext,
		SHARED_PARAMS_STORAGE_KEY,
		SHARED_PARAMS_READY_ENTITY_ID,
	} = require('im/messenger/lib/params/src/shared-storage');

	let loggerInstance = null;
	// Lazy logger lookup avoids a require-graph cycle: params -> writer -> logger -> feature -> params.
	const getLogger = () => {
		if (!loggerInstance)
		{
			const { LoggerManager } = require('im/messenger/lib/logger');
			loggerInstance = LoggerManager.getInstance().getLogger('params-writer');
		}

		return loggerInstance;
	};

	/**
	 * @class MessengerParamsWriter
	 * @description Snapshots the entire window.__componentParameters bag of the messenger
	 * context into MemoryStorage so embedded contexts (DialogSelector etc.) can mirror it.
	 *
	 * Activation is implicit: dump() runs only when invoked inside the messenger context
	 * (COMPONENT_CODE === 'im.messenger'). Outside it, dump() is a no-op — that protects
	 * the shared snapshot from accidental writes triggered in embedded contexts (e.g. by
	 * MessengerParams.updateExistingImFeatures dispatched from a pull event).
	 */
	class MessengerParamsWriter
	{
		#isReady = false;
		/** @type {import('./params').MessengerParams} */
		#params;

		/**
		 * @param {import('./params').MessengerParams} params
		 */
		constructor(params)
		{
			this.#params = params;
			EntityReady.addCondition(SHARED_PARAMS_READY_ENTITY_ID, () => this.#isReady);
		}

		async dump()
		{
			if (!isMessengerContext())
			{
				return;
			}

			const snapshot = { ...(window.__componentParameters ?? {}) };

			try
			{
				await sharedParamsStorage.set(SHARED_PARAMS_STORAGE_KEY, snapshot);
			}
			catch (error)
			{
				// Do not flip #isReady on a failed write — readers should fall through to
				// their timeout fallback instead of resolving on an empty snapshot.
				getLogger().warn('MessengerParamsWriter.dump: storage write failed', error);

				return;
			}

			this.#params.invalidateImFeaturesCache();

			if (!this.#isReady)
			{
				this.#isReady = true;
				EntityReady.ready(SHARED_PARAMS_READY_ENTITY_ID);
			}
		}
	}

	module.exports = { MessengerParamsWriter };
});
