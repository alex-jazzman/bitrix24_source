/**
 * @module im/messenger/application/lib/refresher/ready-state
 */
jn.define('im/messenger/application/lib/refresher/ready-state', (require, exports, module) => {
	/**
	 * @desc Two startup states of the messenger runtime kept apart.
	 * "Runtime ready" is what external consumers wait for: it only needs the bootstrap response
	 * laid out. "Startup complete" additionally needs a finished changelog pass, so the invariants
	 * that depend on consistent data stay tied to it.
	 * The object holds no subscriptions and no dependencies: it only keeps the flags and calls the
	 * callbacks it was given, so the transitions are verifiable without the runtime around them.
	 * @class ReadyState
	 */
	class ReadyState
	{
		#isRuntimeReady = false;
		#isStartupComplete = false;
		#onRuntimeReady;
		#onStartupComplete;

		/**
		 * @param {{ onRuntimeReady: () => void, onStartupComplete: () => Promise<void> }} callbacks
		 */
		constructor(callbacks)
		{
			this.#onRuntimeReady = callbacks.onRuntimeReady;
			this.#onStartupComplete = callbacks.onStartupComplete;
		}

		/**
		 * @return {boolean}
		 */
		get isRuntimeReady()
		{
			return this.#isRuntimeReady;
		}

		/**
		 * @return {boolean}
		 */
		get isStartupComplete()
		{
			return this.#isStartupComplete;
		}

		/**
		 * @desc Idempotent: the signal is published once per application lifecycle, every later
		 * refresh only re-enters an already reached state.
		 */
		markRuntimeReady()
		{
			if (this.#isRuntimeReady)
			{
				return;
			}

			this.#isRuntimeReady = true;
			this.#onRuntimeReady();
		}

		/**
		 * @return {Promise<void>}
		 */
		async markStartupComplete()
		{
			this.#isStartupComplete = true;

			return this.#onStartupComplete();
		}
	}

	module.exports = { ReadyState };
});
