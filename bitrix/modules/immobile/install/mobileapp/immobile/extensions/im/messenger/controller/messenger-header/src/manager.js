/**
 * @module im/messenger/controller/messenger-header/src/manager
 */
jn.define('im/messenger/controller/messenger-header/src/manager', (require, exports, module) => {
	const { HeaderConfigurator } = require('im/messenger/controller/messenger-header/src/configurator');

	/**
	 * @class MessengerHeaderManager
	 *
	 * Manages all MessengerHeaderController instances (global + nested navigations).
	 * Provides a single entry point for broadcasting title redraws (e.g. on connection
	 * status change) and routing button redraws to the correct navigation context.
	 */
	class MessengerHeaderManager
	{
		/** @type {MessengerHeaderController} */
		#globalController = null;
		/** @type {Set<MessengerHeaderController>} */
		#nestedControllers = new Set();

		/**
		 * Initializes the global header controller for the main tabs widget.
		 * Called once during app startup.
		 * @param {object} widget — window.tabs
		 * @returns {MessengerHeaderController}
		 */
		initGlobalController(widget)
		{
			this.#globalController = HeaderConfigurator.createGlobalController(widget);

			return this.#globalController;
		}

		/**
		 * Returns the global header controller.
		 * @returns {MessengerHeaderController|null}
		 */
		getGlobalController()
		{
			return this.#globalController;
		}

		/**
		 * Creates and registers a nested header controller for a nested navigation widget.
		 * @param {object} widget — tabs widget from PageManager.openWidget
		 * @param {string} dialogId — dialogId of the parent collab chat
		 * @returns {MessengerHeaderController}
		 */
		registerNestedController(widget, dialogId)
		{
			const controller = HeaderConfigurator.createNestedController(widget, dialogId);
			this.#nestedControllers.add(controller);
			controller.redrawTitleIfNeeded();

			return controller;
		}

		/**
		 * Unregisters a nested controller when its navigation is closed.
		 * @param {MessengerHeaderController} controller
		 */
		unregisterController(controller)
		{
			this.#nestedControllers.delete(controller);
		}

		/**
		 * Redraws the global header title.
		 * Typically called when returning from nested navigation.
		 */
		redrawGlobalTitle()
		{
			this.#globalController?.redrawTitleIfNeeded();
		}

		/**
		 * Redraws the title on all controllers (global + nested).
		 * Typically called when app connection status changes.
		 */
		redrawAllTitles()
		{
			this.#globalController?.redrawTitleIfNeeded();
			for (const controller of this.#nestedControllers)
			{
				controller.redrawTitleIfNeeded();
			}
		}

		/**
		 * Redraws right buttons on the global controller for the given tab.
		 * @param {string} tabId
		 */
		redrawRightButtonsIfNeeded(tabId)
		{
			this.#globalController?.redrawRightButtonsIfNeeded(tabId);
		}

		/**
		 * Redraws right buttons on every registered nested controller for the given tab.
		 * @param {string} tabId
		 */
		redrawNestedRightButtonsIfNeeded(tabId)
		{
			for (const controller of this.#nestedControllers)
			{
				controller.redrawRightButtonsIfNeeded(tabId);
			}
		}
	}

	module.exports = { MessengerHeaderManager };
});
