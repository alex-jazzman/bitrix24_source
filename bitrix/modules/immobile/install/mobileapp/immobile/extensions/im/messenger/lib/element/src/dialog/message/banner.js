/**
 * @module im/messenger/lib/element/dialog/message/banner
 */
jn.define('im/messenger/lib/element/dialog/message/banner', (require, exports, module) => {
	const { Message } = require('im/messenger/lib/element/dialog/message/base');
	const { MessageType, MessageParams } = require('im/messenger/const');
	const { Loc } = require('loc');
	const { transparent } = require('utils/color');
	const { Theme } = require('im/lib/theme');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	class Banner extends Message
	{
		constructor(modelMessage = {}, options = {})
		{
			super(modelMessage, options);
			this.title = '';
			/** @type {BannerViewProps} */
			this.banner = {};

			this.setCanBeQuoted(false);
			this.setTitle(modelMessage.params?.componentId);
			this.setMessage(modelMessage.text);
			this.prepareTextMessage(modelMessage.params?.componentId);
			this.setBannerProp();
			this.setShowAvatarForce(false);
			this.setAvatarUri(null);
		}

		getCore()
		{
			return serviceLocator.get('core');
		}
		/**
		 * @param {?string} componentId
		 */
		setTitle(componentId)
		{
			if (componentId === MessageParams.ComponentId.ChatCopilotAddedUsersMessage)
			{
				this.title = Loc.getMessage('IMMOBILE_ELEMENT_DIALOG_MESSAGE_COPILOT_BANNER_TITLE_ADD_USERS');
			}
		}

		/**
		 * @param {?string} componentId
		 */
		prepareTextMessage(componentId)
		{
			if (componentId === MessageParams.ComponentId.ChatCopilotAddedUsersMessage)
			{
				const matches = this.message[0].text.match(/\[user=\d+](.*?)\[\/user]/gim);
				if (matches && matches.length > 0)
				{
					const firstUser = matches[0].replaceAll('USER', 'COPILOT');
					this.message[0].text = firstUser;
					const otherCount = matches.length - 1;
					if (otherCount > 0)
					{
						this.message[0].text = Loc.getMessage(
							'IMMOBILE_ELEMENT_DIALOG_MESSAGE_COPILOT_BANNER_TEXT_ADD_USERS_MORE',
							{
								'#USERNAME_1#': firstUser,
								'#LINK_START#': '[COPILOT=sidebar]',
								'#USERS_COUNT#': otherCount,
								'#LINK_END#': '[/COPILOT]',
							},
						);
					}
				}
			}
		}

		setBannerProp()
		{
			this.banner = {
				title: this.title,
				description: Loc.getMessage('IMMOBILE_ELEMENT_DIALOG_MESSAGE_COPILOT_BANNER_DESC_ADD_USERS'),
				imageName: 'ic_chat_copilot_new_user',
				backgroundColor: Theme.colors.chatOtherCopilot1,
				picBackgroundColor: transparent(Theme.colors.accentMainCopilot, 0.2),
			};
		}

		/**
		 * @return {string}
		 */
		getType()
		{
			return MessageType.banner;
		}
	}

	module.exports = { Banner };
});