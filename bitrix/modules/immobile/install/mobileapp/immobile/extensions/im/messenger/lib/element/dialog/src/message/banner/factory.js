/**
 * @module im/messenger/lib/element/dialog/message/banner/factory
 */
jn.define('im/messenger/lib/element/dialog/message/banner/factory', (require, exports, module) => {
	const { MessageComponent } = require('im/messenger/const');
	const { Logger } = require('im/messenger/lib/logger');
	const { Feature } = require('im/messenger/lib/feature');

	const { CustomMessageFactory } = require('im/messenger/lib/element/dialog/message/custom/factory');
	const { SystemTextMessage } = require('im/messenger/lib/element/dialog/message/system-text');
	const { TextMessage } = require('im/messenger/lib/element/dialog/message/text');
	const { InviteUsersCopilotBanner } = require('im/messenger/lib/element/dialog/message/banner/banners/invite-users-copilot');
	const { NotesChatBanner } = require('im/messenger/lib/element/dialog/message/banner/banners/notes');
	const { CreateChatBanner } = require('im/messenger/lib/element/dialog/message/banner/banners/create-chat');
	const { CreateGeneralChatBanner } = require('im/messenger/lib/element/dialog/message/banner/banners/create-general-chat');
	const { CreateChannelBanner } = require('im/messenger/lib/element/dialog/message/banner/banners/create-channel');
	const { CreateGeneralChannelBanner } = require('im/messenger/lib/element/dialog/message/banner/banners/create-general-channel');
	const { CreateChatConferenceBanner } = require('im/messenger/lib/element/dialog/message/banner/banners/create-conference');
	const { PlanLimitsBanner } = require('im/messenger/lib/element/dialog/message/banner/banners/plan-limits');
	const { SignMessage } = require('im/messenger/lib/element/dialog/message/banner/banners/sign/banner');
	const { AdminMessage } = require('im/messenger/lib/element/dialog/src/message/banner/banners/admin/banner');

	/**
	 * @class CreateBannerFactory
	 */
	class CreateBannerFactory extends CustomMessageFactory
	{
		static create(modelMessage, options = {})
		{
			try
			{
				const optionsBanner = {
					...options,
					showReaction: false,
					showAvatarsInReaction: false,
					canBeQuoted: false,
					canBeChecked: false,
					showAvatar: false,
					showUsername: false,
				};

				switch (modelMessage.params?.componentId)
				{
					case MessageComponent.ownChatCreation:
						if (Feature.isNotesBannerAvailable)
						{
							return new NotesChatBanner(modelMessage, optionsBanner);
						}

						return new SystemTextMessage(modelMessage, optionsBanner);

					case MessageComponent.chatCreation:
						return new CreateChatBanner(modelMessage, optionsBanner);
					case MessageComponent.generalChatCreation:
						return new CreateGeneralChatBanner(modelMessage, optionsBanner);
					case MessageComponent.channelCreation:
					case MessageComponent.openChannelCreation:
						return new CreateChannelBanner(modelMessage, { ...optionsBanner, showCommentInfo: false });
					case MessageComponent.generalChannelCreation:
						return new CreateGeneralChannelBanner(modelMessage, { ...optionsBanner, showCommentInfo: false });
					case MessageComponent.conferenceCreation:
						return new CreateChatConferenceBanner(modelMessage, optionsBanner);
					case MessageComponent.copilotAddedUsers:
						return new InviteUsersCopilotBanner(modelMessage, optionsBanner);
					case MessageComponent.planLimits:
						return new PlanLimitsBanner(modelMessage, optionsBanner);
					case MessageComponent.sign:
						return new SignMessage(modelMessage, optionsBanner);
					case MessageComponent.admin:
						return new AdminMessage(modelMessage, optionsBanner);
					default: return new TextMessage(modelMessage, optionsBanner);
				}
			}
			catch (error)
			{
				Logger.error('CreateBannerFactory.create: error', error);

				return new TextMessage(modelMessage, options);
			}
		}

		static checkSuitableForDisplay(messageComponent)
		{
			const creationParams = [
				MessageComponent.chatCreation,
				MessageComponent.ownChatCreation,
				MessageComponent.generalChatCreation,
				MessageComponent.channelCreation,
				MessageComponent.openChannelCreation,
				MessageComponent.generalChannelCreation,
				MessageComponent.conferenceCreation,
				MessageComponent.copilotAddedUsers,
				MessageComponent.planLimits,
				MessageComponent.sign,
				MessageComponent.admin,
			];

			return creationParams.includes(messageComponent);
		}
	}

	module.exports = {
		CreateBannerFactory,
	};
});
