/**
 * @module im/messenger/lib/element/dialog/message/block/factory
 */
jn.define('im/messenger/lib/element/dialog/message/block/factory', (require, exports, module) => {
	const { Feature } = require('im/messenger/lib/feature');
	const { Logger } = require('im/messenger/lib/logger');

	const { CustomMessageFactory } = require('im/messenger/lib/element/dialog/message/custom/factory');
	const { BlockMessage } = require('im/messenger/lib/element/dialog/message/block/message');
	const { CopilotBlockMessage } = require('im/messenger/lib/element/dialog/message/block/copilot-message');
	const { UnsupportedMessage } = require('im/messenger/lib/element/dialog/message/unsupported');

	/**
	 * @class BlockMessageFactory
	 */
	class BlockMessageFactory extends CustomMessageFactory
	{
		/**
		 * @override
		 * @param {MessagesModelState} modelMessage
		 * @param {CreateMessageOptions|{}} options
		 * @return {Message}
		 */
		static create(modelMessage, options = {})
		{
			try
			{
				return new BlockMessage(modelMessage, options);
			}
			catch (error)
			{
				Logger.error('BlockMessageFactory.create error:', error);

				return new UnsupportedMessage(modelMessage, options);
			}
		}

		/**
		 * @param {MessagesModelState} modelMessage
		 * @param {CreateMessageOptions|{}} options
		 * @return {Message}
		 */
		static createCopilot(modelMessage, options = {})
		{
			try
			{
				return new CopilotBlockMessage(modelMessage, options);
			}
			catch (error)
			{
				Logger.error('BlockMessageFactory.createCopilot error:', error);

				return new UnsupportedMessage(modelMessage, options);
			}
		}

		/**
		 * @override
		 * @param {string} [messageComponent]
		 * @return {boolean}
		 */
		static checkSuitableForDisplay(messageComponent)
		{
			return Feature.isBlockMessageAvailable;
		}

		/**
		 * @override
		 * @return {string}
		 */
		static getComponentId()
		{
			return BlockMessage.getComponentId();
		}
	}

	module.exports = {
		BlockMessageFactory,
	};
});
