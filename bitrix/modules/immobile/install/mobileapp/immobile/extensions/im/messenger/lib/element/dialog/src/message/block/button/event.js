/**
 * @module im/messenger/lib/element/dialog/message/block/button/event
 */
jn.define('im/messenger/lib/element/dialog/message/block/button/event', (require, exports, module) => {
	const { Type } = require('type');
	const { handlerRegistry } = require('im/messenger/lib/element/dialog/message/block/button/handler-registry');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const logger = getLoggerWithContext('dialog-element--custom-message', 'EventButton');

	/**
	 * @class EventButton
	 */
	class EventButton
	{
		/**
		 * @param {string} actionId
		 * @param {object} actionParams
		 * @return {EventButtonMetaData}
		 */
		static getMeta(actionId, actionParams)
		{
			return {
				callback: ({ messageId, dialogLocator }) => {
					try
					{
						const handler = handlerRegistry[actionId];
						if (Type.isFunction(handler))
						{
							handler({ actionId, actionParams, messageId, dialogLocator });

							return;
						}

						logger.log('EventButton: unhandled actionId', actionId, actionParams);
					}
					catch (error)
					{
						logger.error('EventButton callback error:', error);
					}
				},
			};
		}
	}

	module.exports = {
		EventButton,
	};
});
