/**
 * @module im/messenger/lib/element/dialog/message/block/button/request
 */
jn.define('im/messenger/lib/element/dialog/message/block/button/request', (require, exports, module) => {
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const logger = getLoggerWithContext('dialog-element--custom-message', 'RequestButton');

	/**
	 * @class RequestButton
	 */
	class RequestButton
	{
		/**
		 * @param {string} messageId
		 * @param {string} actionId
		 * @param {object} actionParams
		 * @return {RequestButtonMetaData|null}
		 */
		static getMeta(messageId, actionId, actionParams)
		{
			return {
				callback: () => {
					logger.log('RequestButton callback', messageId, actionId, actionParams)
				},
			};
		}
	}

	module.exports = {
		RequestButton,
	};
});
