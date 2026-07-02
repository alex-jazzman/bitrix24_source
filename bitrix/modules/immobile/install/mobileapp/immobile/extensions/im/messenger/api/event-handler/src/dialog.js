/**
 * @module im/messenger/api/event-handler/dialog
 */
jn.define('im/messenger/api/event-handler/dialog', (require, exports, module) => {
	const { EventType } = require('im/messenger/const');
	const { createEventHandler } = require('im/messenger/api/event-handler/lib/event-handler');

	const dialogHandler = {
		/**
		 * @param {function({dialogId: string}): void} callback
		 * @return {function(): void} unsubscribe
		 */
		onClosed: createEventHandler(EventType.messenger.dialogClosed),
	};

	module.exports = { dialogHandler };
});
