/**
 * @module layout/ui/field-filter/feature
 */
jn.define('layout/ui/field-filter/feature', (require, exports, module) => {
	const { Type } = require('type');
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { StorageCache } = require('storage-cache');

	/** One mirrored value per module; the name of the cache tells the modules apart. */
	const CACHE_ID = 'unifiedFiltersFeature';

	/**
	 * Client of \Bitrix\Mobile\Public\Feature\UnifiedFiltersModuleFlag: legacy presets against the
	 * unified filter. The server answers by the own value of the flag of the module, falling back to
	 * the portal-wide flag of the mobile module, so one value covers both switches.
	 *
	 * The action lives in the module that owns the lists, so the namespace comes with the
	 * config; every consumer keeps its own mirrored value.
	 *
	 * The value is mirrored into device storage, so a warm start picks the mode without waiting
	 * for the network. A start with nothing mirrored waits for the answer once, otherwise the
	 * first opening of the list would always run in legacy mode.
	 */
	class UnifiedFiltersFeature
	{
		/**
		 * @param {UnifiedFiltersFeatureParams} params
		 */
		constructor(params)
		{
			this.action = params.action;
			this.cache = new StorageCache(params.cacheName, CACHE_ID);
			/** @type {Promise<boolean>|null} */
			this.request = null;
		}

		/**
		 * @return {boolean|null} null when the value has never been received
		 */
		getCachedState()
		{
			const { enabled } = this.cache.get() || {};

			return Type.isBoolean(enabled) ? enabled : null;
		}

		/**
		 * The mode of a screen that cannot wait for the network: the mirrored value answers at
		 * once and the request only refreshes it for the next start. Every list of a module asks
		 * the same question, hence one place to ask it instead of the same two lines per screen.
		 *
		 * @return {boolean}
		 */
		isEnabled()
		{
			const cached = this.getCachedState();

			this.fetch().catch(console.error);

			return cached === true;
		}

		/**
		 * @return {Promise<boolean>}
		 */
		async resolve()
		{
			const cached = this.getCachedState();
			if (cached === null)
			{
				return this.fetch();
			}

			this.fetch().catch(console.error);

			return cached;
		}

		/**
		 * @return {Promise<boolean>}
		 */
		fetch()
		{
			// one answer per run of the application: every list asks on mount, six tabs of a CRM
			// screen are six identical questions, and a flag of a module does not change under a
			// running application - a failed request is dropped, so the next asker retries
			this.request ??= this.requestState().catch((error) => {
				this.request = null;

				throw error;
			});

			return this.request;
		}

		/**
		 * @private
		 * @return {Promise<boolean>}
		 */
		async requestState()
		{
			const response = await new RunActionExecutor(this.action).call(false);
			if (response?.status !== 'success' || !Type.isBoolean(response.data))
			{
				return this.getCachedState() ?? false;
			}

			this.cache.set({ enabled: response.data });

			return response.data;
		}
	}

	/**
	 * Whether the module of the screen is served by the unified filter at all. A list screen asks this
	 * before it decides which filter to build, so the question has to be answerable without loading
	 * anything the filter itself is made of - neither the drawer nor the serialized vocabulary.
	 */
	module.exports = { UnifiedFiltersFeature };
});
