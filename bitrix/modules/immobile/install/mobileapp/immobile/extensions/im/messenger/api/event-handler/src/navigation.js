/**
 * @module im/messenger/api/event-handler/navigation
 */
jn.define('im/messenger/api/event-handler/navigation', (require, exports, module) => {
	const { EventType } = require('im/messenger/const');
	const { createEventHandler } = require('im/messenger/api/event-handler/lib/event-handler');

	const navigationHandler = {
		/**
		 * @param {function({currentTabId: string, previousTabId: string}): void} callback
		 * @return {function(): void} unsubscribe
		 */
		onTabChanged: createEventHandler(EventType.navigation.tabChanged),
	};

	module.exports = { navigationHandler };
});
