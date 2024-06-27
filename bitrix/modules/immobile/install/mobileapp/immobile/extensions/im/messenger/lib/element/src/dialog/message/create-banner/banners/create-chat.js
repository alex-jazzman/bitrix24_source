/**
 * @module im/messenger/lib/element/dialog/message/create-banner/banners/create-chat
 */
jn.define('im/messenger/lib/element/dialog/message/create-banner/banners/create-chat', (require, exports, module) => {
	const { Banner } = require('im/messenger/lib/element/dialog/message/banner');
	const { Loc } = require('loc');
	const { Theme } = require('im/lib/theme');
	const { transparent } = require('utils/color');

	class CreateChatBanner extends Banner
	{
		/**
		 * @param {?string} componentId
		 */
		setTitle(componentId)
		{
			this.title = Loc.getMessage('IMMOBILE_ELEMENT_CHAT_TITLE_GROUP');
		}

		/**
		 * @param {?string} componentId
		 */
		prepareTextMessage(componentId)
		{
			const desc = Loc.getMessage('IMMOBILE_ELEMENT_DIALOG_MESSAGE_CHAT_CREATE_BANNER_DESC');
			this.message[0].text = `[color=${Theme.colors.base3}]${desc}[/color]\n\n[USER=sidebar]${Loc.getMessage(
				'IMMOBILE_ELEMENT_DIALOG_MESSAGE_CHAT_CREATE_BANNER_ADD_USERS')}[/USER]`;
		}

		setBannerProp()
		{
			this.banner = {
				title: this.title,
				imageName: 'ic_group_chat_banner',
				backgroundColor: Theme.colors.chatOtherMessage1,
				picBackgroundColor: transparent(Theme.colors.accentMainPrimaryalt, 0.2),
			};
		}
	}

	module.exports = { CreateChatBanner };
});