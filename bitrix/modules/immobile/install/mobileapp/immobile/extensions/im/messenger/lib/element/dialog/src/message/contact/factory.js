/**
 * @module im/messenger/lib/element/dialog/message/contact/factory
 */
jn.define('im/messenger/lib/element/dialog/message/contact/factory', (require, exports, module) => {
	const { CustomMessageFactory } = require('im/messenger/lib/element/dialog/message/custom/factory');
	const { ContactMessage } = require('im/messenger/lib/element/dialog/message/contact/message');
	const { TextMessage } = require('im/messenger/lib/element/dialog/message/text');
	const { Feature } = require('im/messenger/lib/feature');
	const { Logger } = require('im/messenger/lib/logger');

	class ContactMessageFactory extends CustomMessageFactory
	{
		static create(modelMessage, options = {})
		{
			if (!Feature.isContactCardSupported)
			{
				return new TextMessage(modelMessage, options);
			}

			try
			{
				return new ContactMessage(modelMessage, options);
			}
			catch (error)
			{
				Logger.error('ContactMessageFactory.create: error', error);

				return new TextMessage(modelMessage, options);
			}
		}

		static checkSuitableForDisplay(messageComponent)
		{
			return messageComponent === ContactMessage.getComponentId();
		}
	}

	module.exports = { ContactMessageFactory };
});
