/**
 * @module debug/prism/src/perf-point
 */
jn.define('debug/prism/src/perf-point', (require, exports, module) => {
	const { prism } = require('debug/prism/src/polyfill');

	/**
	 * @class PerfPoint
	 *
	 * Unified performance measurement point.
	 * Always backed by a multi-perfpoint — a "single" point is just a multi with zero sub-points.
	 *
	 * @example Single usage:
	 * const point = new PerfPoint('Server Load', 'dialog 123').start();
	 * // ... work ...
	 * point.end();
	 *
	 * @example Multi usage:
	 * const point = new PerfPoint('Chat Open', 'dialog 123').start();
	 * point.startPoint('DB Load');
	 * // ... work ...
	 * point.endPoint('DB Load');
	 * point.end();
	 */
	class PerfPoint
	{
		#id;
		#badge;
		#label;
		/** @type {Map<string, string>} key → perfId */
		#points = new Map();

		/**
		 * @param {string} badge
		 * @param {string} [label]
		 */
		constructor(badge, label = '')
		{
			this.#badge = badge;
			this.#label = label;
			this.#id = this.#generateId(this.#badge);
		}

		/**
		 * @return {PerfPoint}
		 */
		start()
		{
			prism.startMultiPerfPoint(this.#id, this.#badge, { label: this.#label });

			return this;
		}

		/**
		 * @param {string} key - unique identifier, also used as badge
		 * @param {string} [label]
		 */
		startPoint(key, label = '')
		{
			const perfId = this.#generateId(key);
			this.#points.set(key, perfId);
			prism.startPerfPoint(perfId, key, { label, multiId: this.#id });
		}

		/**
		 * @param {string} key
		 * @param {object} [extra]
		 */
		endPoint(key, extra = {})
		{
			const perfId = this.#points.get(key);
			if (perfId)
			{
				prism.endPerfPoint(perfId, extra);
				this.#points.delete(key);
			}
		}

		end()
		{
			if (this.#id)
			{
				prism.endMultiPerfPoint(this.#id);
				this.#id = null;
			}
		}

		/**
		 * @param {string} name
		 * @return {string}
		 */
		#generateId(name)
		{
			return `${name.toLowerCase().replaceAll(/\s+/g, '-')}-${Date.now()}`;
		}
	}

	module.exports = { PerfPoint };
});
