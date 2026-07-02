/* eslint-disable */
this.BX = this.BX || {};
this.BX.OpenLines = this.BX.OpenLines || {};
this.BX.OpenLines.v2 = this.BX.OpenLines.v2 || {};
(function (exports) {
	'use strict';

	const useDelay = delay => {
		let timeoutId = null;
		return {
			start(callback) {
				clearTimeout(timeoutId);
				timeoutId = setTimeout(() => {
					callback();
				}, delay);
			},
			stop() {
				clearTimeout(timeoutId);
				timeoutId = null;
			}
		};
	};

	/**
	 * Runs an async action while managing a loading flag on the given reactive context.
	 * Flag is set to true before the action starts and reset to false after completion,
	 * even if the action throws. Returns whatever the action resolves with.
	 *
	 * @param {JsonObject} context - reactive object (e.g. Vue component instance) that holds the flag
	 * @param {string} flag - property name on context to set to true/false
	 * @param {() => Promise<T>} action - async action to execute
	 * @returns {Promise<T>}
	 */
	async function runActionWithLoading(context, flag, action) {
		context[flag] = true;
		try {
			return await action();
		} finally {
			context[flag] = false;
		}
	}

	exports.runActionWithLoading = runActionWithLoading;
	exports.useDelay = useDelay;

})(this.BX.OpenLines.v2.Lib = this.BX.OpenLines.v2.Lib || {});
//# sourceMappingURL=utils.bundle.js.map
