/**
 * @module im/messenger/lib/counters/tab-counters/src/base
 */
jn.define('im/messenger/lib/counters/tab-counters/src/base', (require, exports, module) => {
	const { Type } = require('type');
	const { COUNTER_OVERFLOW_LIMIT, EventType } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	/**
	 * @class BaseTabCounters
	 *
	 * Shared UI-update logic for tab counter badges.
	 * Subclasses provide the counter calculation via `update()`.
	 */
	class BaseTabCounters
	{
		#ui = null;
		#updateTimeout = null;
		#updateInterval = 300;
		#lastCounters = {};

		/**
		 * @param {object} widget — tabs widget to update badges on
		 */
		constructor(widget)
		{
			this.#ui = widget;
		}

		/**
		 * @protected
		 * @return {MessengerCoreStore|null}
		 */
		get store()
		{
			return serviceLocator.get('core')?.getStore();
		}

		/**
		 * Subclasses must implement this to calculate and apply counters.
		 */
		update()
		{
			throw new Error('BaseTabCounters.update() must be implemented by subclass');
		}

		/**
		 * Updates tab badges on the widget.
		 * Only touches tabs whose counter has actually changed.
		 *
		 * @protected
		 * @param {Record<string, number>} counters — { tabId: counterValue }
		 */
		updateUi(counters)
		{
			let isUpdated = false;
			const oldCounters = { ...this.#lastCounters };

			Object.entries(counters).forEach(([tabId, counter]) => {
				if (Type.isNumber(this.#lastCounters[tabId]) && this.#lastCounters[tabId] === counter)
				{
					return;
				}

				this.#lastCounters[tabId] = counter;
				const uiTabId = this.prepareTabId(tabId);
				const label = this.#getLabel(counter);

				this.#ui.updateItem(uiTabId, { counter, label });
				isUpdated = true;
			});

			if (isUpdated)
			{
				const newCounters = { ...this.#lastCounters };
				this.#emitUpdateUiEvent({ oldCounters, newCounters });
			}
		}

		/**
		 * Maps internal counter key to widget tab id.
		 * Override in subclasses if mapping is needed.
		 *
		 * @protected
		 * @param {string} tabId
		 * @return {string}
		 */
		prepareTabId(tabId)
		{
			return tabId;
		}

		/**
		 * Drops the cached counter for a tab so the next `update()` re-applies
		 * the value to the widget. Use after a tab is registered in the widget
		 * out-of-band (e.g. dynamic folder tab created after `folderModel/add`,
		 * which fired before the native tab was available — the original
		 * `updateItem` no-op'd but cached the value).
		 *
		 * @param {string} tabId
		 */
		invalidateTabCache(tabId)
		{
			delete this.#lastCounters[tabId];
		}

		updateDelayed()
		{
			if (!this.#updateTimeout)
			{
				this.#updateTimeout = setTimeout(() => this.update(), this.#updateInterval);
			}
		}

		clearUpdateTimeout()
		{
			clearTimeout(this.#updateTimeout);
			this.#updateTimeout = null;
		}

		/**
		 * @param {string} tabId - NavigationTabId value
		 * @returns {string}
		 */
		getCounterLabel(tabId)
		{
			const counterKey = Object.entries(this.#lastCounters)
				.find(([key]) => this.prepareTabId(key) === tabId)
				?.[0]
			;

			const counter = counterKey ? this.#lastCounters[counterKey] : 0;

			return this.#getLabel(counter);
		}

		#getLabel(counter)
		{
			if (!Type.isNumber(counter) || counter === 0)
			{
				return '';
			}

			return counter >= COUNTER_OVERFLOW_LIMIT ? '99+' : String(counter);
		}

		#emitUpdateUiEvent(event)
		{
			serviceLocator.get('emitter')?.emit(EventType.counters.updateUi, [event]);
		}
	}

	module.exports = { BaseTabCounters };
});
