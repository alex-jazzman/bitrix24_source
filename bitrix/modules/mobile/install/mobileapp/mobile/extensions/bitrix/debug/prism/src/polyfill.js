/**
 * @module debug/prism/src/polyfill
 */
jn.define('debug/prism/src/polyfill', (require, exports, module) => {

	const noop = () => {};

	/**
	 * @typedef {Object} PerfPointOptions
	 * @property {string} [label] - description of the specific operation
	 * @property {string} [multiId] - explicit parent multi-perfpoint id
	 */

	/**
	 * @typedef {Object} PerfPointSpec
	 * @property {string} id - normalized badge
	 * @property {string} label - display name in the legend
	 * @property {string} color - hex color (e.g. '#e74c3c')
	 */

	/**
	 * @typedef {Object} Prism
	 * @property {(name: string, message: Object, category: string) => void} sendEvent
	 * @property {(id: string, badge: string, options?: PerfPointOptions) => void} startPerfPoint
	 * @property {(id: string, extra?: Object) => void} endPerfPoint
	 * @property {(multiId: string, badge: string, options?: PerfPointOptions) => void} startMultiPerfPoint
	 * @property {(multiId: string) => void} endMultiPerfPoint
	 * @property {(specs: PerfPointSpec[]) => void} registerPerfPointSpecs
	 */

	const resolveNativePrism = () => {
		try
		{
			// eslint-disable-next-line no-undef
			const native = nativeRequire('debug');
			if (native && native.prism)
			{
				return native.prism;
			}
		}
		catch
		{
			// native module is not available
		}

		return null;
	};

	/** @type {Prism} */
	const prism = resolveNativePrism() || {
		sendEvent: noop,
		startPerfPoint: noop,
		endPerfPoint: noop,
		startMultiPerfPoint: noop,
		endMultiPerfPoint: noop,
		registerPerfPointSpecs: noop,
	};

	module.exports = { prism };
});
