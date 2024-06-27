/**
 * @module im/messenger/lib/element/dialog/message/create-banner/banners/create-channel
 */
jn.define('im/messenger/lib/element/dialog/message/create-banner/banners/create-channel', (require, exports, module) => {
	const { Banner } = require('im/messenger/lib/element/dialog/message/banner');
	const { Loc } = require('loc');
	const { Theme } = require('im/lib/theme');
	const { transparent } = require('utils/color');

	class CreateChannelBanner extends Banner
	{
		/**
		 * @param {?string} componentId
		 */
		setTitle(componentId)
		{
			this.title = Loc.getMessage('IMMOBILE_ELEMENT_DIALOG_MESSAGE_CHANNEL_CREATE_BANNER_TITLE');
		}

		/**
		 * @param {?string} componentId
		 */
		prepareTextMessage(componentId)
		{
			const desc1 = Loc.getMessage('IMMOBILE_ELEMENT_DIALOG_MESSAGE_CHANNEL_CREATE_BANNER_DESC_1');
			const desc2 = Loc.getMessage('IMMOBILE_ELEMENT_DIALOG_MESSAGE_CHANNEL_CREATE_BANNER_DESC_2');;
			const userData = this.getOwnerChannel();
			this.message[0].text = `${desc1}\n\n${desc2}`;
			if (userData?.id && userData?.name)
			{
				this.message[0].text = `${desc1}\n\n${desc2} [USER=${userData.id}]${userData.name}[/USER]`;
			}
		}

		/**
		 * @return {?UsersModelState}
		 */
		getOwnerChannel()
		{
			const messageData = this.getModelMessage();
			if (messageData)
			{
				const dialogData = this.getCore().getStore().getters['dialoguesModel/getByChatId'](messageData.chatId);

				return this.getCore().getStore().getters['usersModel/getById'](dialogData.owner);
			}

			return {};
		}

		setBannerProp()
		{
			this.banner = {
				title: this.title,
				imageName: 'ic_channel_banner',
				backgroundColor: Theme.colors.chatOtherMessage1,
				picBackgroundColor: transparent(Theme.colors.accentMainSuccess, 0.2),
			};
		}
	}

	module.exports = { CreateChannelBanner };
});