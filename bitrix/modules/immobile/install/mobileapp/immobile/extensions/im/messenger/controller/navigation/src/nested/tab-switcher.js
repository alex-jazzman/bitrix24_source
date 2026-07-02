/**
 * @module im/messenger/controller/navigation/src/nested/tab-switcher
 */
jn.define('im/messenger/controller/navigation/src/nested/tab-switcher', (require, exports, module) => {
	const { EventType } = require('im/messenger/const');

	/**
	 * Handles tab switching and lifecycle for a nested navigation widget opened
	 * via PageManager.openWidget('tabs', ...).
	 *
	 * Pure UI coordinator: listens to tab events on the widget, tracks which
	 * tabs have been visited, and fires callbacks. Has no external dependencies
	 * beyond the widget itself.
	 *
	 * @class NestedTabSwitcher
	 */
	class NestedTabSwitcher
	{
		#ui = null;
		#currentTabId = null;
		#initializedTabs = new Set();
		#onTabChanged = null;
		#onDestroy = null;

		/**
		 * @param {object}   params
		 * @param {object}   params.widget       — tabs widget returned by PageManager.openWidget
		 * @param {string}   params.initialTabId  — tab already initialized before switcher creation
		 * @param {function(string, boolean): void} params.onTabChanged — called on tab switch: (tabId, isFirstInit)
		 * @param {function(Set<string>): void} params.onDestroy — called when widget is closed, receives initializedTabs
		 */
		constructor({ widget, initialTabId, onTabChanged, onDestroy })
		{
			this.#ui = widget;
			this.#currentTabId = initialTabId;
			this.#onTabChanged = onTabChanged;
			this.#onDestroy = onDestroy;
			this.#initializedTabs.add(initialTabId);
			this.#subscribeEvents();
		}

		/**
		 * @return {string}
		 */
		getActiveTab()
		{
			return this.#currentTabId;
		}

		/**
		 * Programmatically switches the active tab.
		 * Triggers the same onTabSelected event flow as a user tap.
		 * @param {string} tabId
		 */
		setActiveTab(tabId)
		{
			this.#ui.setActiveItem(tabId);
		}

		#tabSelectedHandler = (item, changed) => {
			if (!changed || this.#currentTabId === item.id)
			{
				return;
			}

			this.#currentTabId = item.id;
			const isFirstInit = !this.#initializedTabs.has(item.id);
			if (isFirstInit)
			{
				this.#initializedTabs.add(item.id);
			}

			this.#onTabChanged(item.id, isFirstInit);
		};

		#viewRemovedHandler = () => {
			this.#unsubscribeEvents();
			this.#onDestroy(this.#initializedTabs);

			this.#ui = null;
			this.#onTabChanged = null;
			this.#onDestroy = null;
		};

		#subscribeEvents()
		{
			this.#ui.on('onTabSelected', this.#tabSelectedHandler);
			this.#ui.on(EventType.view.removed, this.#viewRemovedHandler);
		}

		#unsubscribeEvents()
		{
			this.#ui.off('onTabSelected', this.#tabSelectedHandler);
			this.#ui.off(EventType.view.removed, this.#viewRemovedHandler);
		}
	}

	module.exports = { NestedTabSwitcher };
});
