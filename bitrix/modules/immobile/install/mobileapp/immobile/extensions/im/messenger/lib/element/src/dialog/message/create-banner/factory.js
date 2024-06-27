/**
 * @module im/messenger/lib/element/dialog/message/create-banner/factory
 */
jn.define('im/messenger/lib/element/dialog/message/create-banner/factory', (require, exports, module) => {
	const { CustomMessageFactory } = require('im/messenger/lib/element/dialog/message/custom/factory');
	const { TextMessage } = require('im/messenger/lib/element/dialog/message/text');
	const { CreateChatBanner } = require('im/messenger/lib/element/dialog/message/create-banner/banners/create-chat');
	const { CreateGeneralChatBanner } = require('im/messenger/lib/element/dialog/message/create-banner/banners/create-general-chat');
	const { CreateChannelBanner } = require('im/messenger/lib/element/dialog/message/create-banner/banners/create-channel');
	const { CreateGeneralChannelBanner } = require('im/messenger/lib/element/dialog/message/create-banner/banners/create-general-channel');
	const { CreateChatConferenceBanner } = require('im/messenger/lib/element/dialog/message/create-banner/banners/create-conference');
	const { MessageParams } = require('im/messenger/const');
	const { Feature } = require('im/messenger/lib/feature');
	const { Logger } = require('im/messenger/lib/logger');

	/**
	 * @class CreateBannerFactory
	 */
	class CreateBannerFactory extends CustomMessageFactory
	{
		static create(modelMessage, options = {})
		{
			if (!Feature.isCreateBannerMessageSupported)
			{
				return new TextMessage(modelMessage, options);
			}

			try
			{
				switch (modelMessage.params?.componentId)
				{
					case MessageParams.ComponentId.ChatCreationMessage:
						return new CreateChatBanner(modelMessage, options);
					case MessageParams.ComponentId.GeneralChatCreationMessage:
						return new CreateGeneralChatBanner(modelMessage, options);
					case MessageParams.ComponentId.ChannelCreationMessage:
					case MessageParams.ComponentId.OpenChannelCreationMessage:
						return new CreateChannelBanner(modelMessage, { ...options, showCommentInfo: false });
					case MessageParams.ComponentId.GeneralChannelCreationMessage:
						return new CreateGeneralChannelBanner(modelMessage, { ...options, showCommentInfo: false });
					case MessageParams.ComponentId.ConferenceCreationMessage:
						return new CreateChatConferenceBanner(modelMessage, options);
					default: return new TextMessage(modelMessage, options);
				}
			}
			catch (error)
			{
				Logger.error('CreateBannerFactory.create: error', error);

				return new TextMessage(modelMessage, options);
			}
		}

		static checkSuitableForDisplay(modelMessage)
		{
			const creationParams = [
				MessageParams.ComponentId.ChatCreationMessage,
				MessageParams.ComponentId.GeneralChatCreationMessage,
				MessageParams.ComponentId.ChannelCreationMessage,
				MessageParams.ComponentId.OpenChannelCreationMessage,
				MessageParams.ComponentId.GeneralChannelCreationMessage,
				MessageParams.ComponentId.ConferenceCreationMessage,
			];

			return creationParams.includes(modelMessage.params?.componentId);
		}
	}

	module.exports = {
		CreateBannerFactory,
	};
});
