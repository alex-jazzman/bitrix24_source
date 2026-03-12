/**
 * @module im/messenger/lib/emitter
 */
jn.define('im/messenger/lib/emitter', (require, exports, module) => {
	const { Type } = require('type');
	const { ComponentCode } = require('im/messenger/const');

	class MessengerEmitter
	{
		/**
		 * Send event to messenger component
		 *
		 * @param {string} eventName
		 * @param {Object} [eventData]
		 */
		static emit(eventName, eventData)
		{
			if (!Type.isStringFilled(eventName))
			{
				throw new Error(`MessengerEvent: ${eventName}is not a filled string`);
			}

			BX.postComponentEvent(eventName, [eventData], ComponentCode.imMessenger);
		}

		/**
		 * @desc Send event to all contexts
		 *
		 * @param {string} eventName
		 * @param {Object} [eventData]
		 */
		static broadcast(eventName, eventData)
		{
			if (!Type.isStringFilled(eventName))
			{
				throw new Error(`MessengerEvent: ${eventName}is not a filled string`);
			}

			BX.postComponentEvent(eventName, [eventData]);
		}
	}

	module.exports = {
		MessengerEmitter,
	};
});
