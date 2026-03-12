/**
 * @module im/messenger/lib/src/native-feature
 */
jn.define('im/messenger/lib/src/native-feature', (require, exports, module) => {
	const { feature } = require('native/feature') ?? {};

	/**
	 * @class NativeFeatureWrapper
	 */
	class NativeFeatureWrapper
	{
		static #instance = null;
		#cache = {};

		/**
		 * @return {NativeFeatureWrapper}
		 */
		static getInstance()
		{
			if (!this.#instance)
			{
				this.#instance = new this();
			}

			return this.#instance;
		}

		/**
		 * @param {string} flagName
		 * @returns {boolean}
		 */
		isFeatureEnabled(flagName)
		{
			if (flagName in this.#cache)
			{
				return this.#cache[flagName];
			}

			const result = feature?.isFeatureEnabled?.(flagName) ?? false;
			this.#cache[flagName] = result;

			return result;
		}

		/**
		 * @returns {Object}
		 */
		getCache()
		{
			return { ...this.#cache };
		}
	}

	module.exports = {
		NativeFeatureWrapper,
	};
});
