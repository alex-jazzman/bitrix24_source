/**
 * @module im/messenger/lib/element/dialog/message/block/configuration
 */
jn.define('im/messenger/lib/element/dialog/message/block/configuration', (require, exports, module) => {
	const { EventButton } = require('im/messenger/lib/element/dialog/message/block/button/event');
	const { RequestButton } = require('im/messenger/lib/element/dialog/message/block/button/request');
	const { UrlButton } = require('im/messenger/lib/element/dialog/message/block/button/url');
	const { BlockButtonType } = require('im/messenger/const');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const logger = getLoggerWithContext('dialog-element--customMessage', 'BlockConfiguration');

	/**
	 * @class BlockConfiguration
	 */
	class BlockConfiguration
	{
		/**
		 * @param {string} messageId
		 * @param {BlockButtonTypeData} button
		 * @return {EventButtonMetaData|RequestButtonMetaData|UrlButtonMetaData|null}
		 */
		static getButtonMetaData(messageId, button)
		{
			switch (button.type)
			{
				case BlockButtonType.eventButton:
					return EventButton.getMeta(button.actionId, button.actionParams);

				case BlockButtonType.requestButton:
					return RequestButton.getMeta(messageId, button.actionId, button.actionParams);

				case BlockButtonType.linkButton:
					return UrlButton.getMeta(button.url);

				default:
					logger.error('BlockConfiguration.getButtonMetaData: unknown button type', button.type);

					return null;
			}
		}
	}

	module.exports = {
		BlockConfiguration,
	};
});
