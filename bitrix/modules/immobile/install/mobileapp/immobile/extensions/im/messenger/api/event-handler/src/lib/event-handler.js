/**
 * @module im/messenger/api/event-handler/lib/event-handler
 */
jn.define('im/messenger/api/event-handler/lib/event-handler', (require, exports, module) => {
	/**
	 * @param {string} eventName
	 * @return {function(callback: Function): function(): void}
	 */
	const createEventHandler = (eventName) => {
		return (callback) => {
			BX.addCustomEvent(eventName, callback);

			return () => {
				BX.removeCustomEvent(eventName, callback);
			};
		};
	};

	module.exports = { createEventHandler };
});
