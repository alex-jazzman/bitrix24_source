/**
 * @module im/messenger/lib/element/dialog/message/builder/factory
 */
jn.define('im/messenger/lib/element/dialog/message/builder/factory', (require, exports, module) => {
	const { Feature } = require('im/messenger/lib/feature');
	const { Logger } = require('im/messenger/lib/logger');

	const { CustomMessageFactory } = require('im/messenger/lib/element/dialog/message/custom/factory');
	const { BuilderMessage } = require('im/messenger/lib/element/dialog/message/builder/message');
	const { UnsupportedMessage } = require('im/messenger/lib/element/dialog/message/unsupported');

	/**
	 * @class BuilderMessageFactory
	 */
	class BuilderMessageFactory extends CustomMessageFactory
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
				return new BuilderMessage(modelMessage, options);
			}
			catch (error)
			{
				Logger.error('BuilderMessageFactory.create error:', error);

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
			return Feature.isBuilderMessageAvailable;
		}

		/**
		 * @override
		 * @return {string}
		 */
		static getComponentId()
		{
			return BuilderMessage.getComponentId();
		}
	}

	module.exports = {
		BuilderMessageFactory,
	};
});
