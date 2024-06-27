/**
 * @module im/messenger/lib/element/dialog/message/create-banner/banners/create-conference
 */
jn.define('im/messenger/lib/element/dialog/message/create-banner/banners/create-conference', (require, exports, module) => {
	const { Banner } = require('im/messenger/lib/element/dialog/message/banner');
	const { Loc } = require('loc');
	const { Theme } = require('im/lib/theme');
	const { transparent } = require('utils/color');

	class CreateChatConferenceBanner extends Banner
	{
		/**
		 * @param {?string} componentId
		 */
		setTitle(componentId)
		{
			this.title = Loc.getMessage('IMMOBILE_ELEMENT_DIALOG_MESSAGE_CHAT_CONFERENCE_CREATE_BANNER_TITLE');
		}

		/**
		 * @param {?string} componentId
		 */
		prepareTextMessage(componentId)
		{
			const desc = Loc.getMessage('IMMOBILE_ELEMENT_DIALOG_MESSAGE_CHAT_CONFERENCE_CREATE_BANNER_DESC');
			this.message[0].text = `[color=${Theme.colors.base3}]${desc}[/color]\n\n[USER=copy:id${this.id}]${Loc.getMessage(
				'IMMOBILE_ELEMENT_DIALOG_MESSAGE_CHAT_CONFERENCE_CREATE_BANNER_COPY_LINK')}[/USER]`;
		}

		setBannerProp()
		{
			this.banner = {
				title: this.title,
				imageName: 'ic_videoconf_chat_banner',
				backgroundColor: Theme.colors.chatOtherMessage1,
				picBackgroundColor: transparent(Theme.colors.accentMainPrimaryalt, 0.2),
			};
		}
	}

	module.exports = { CreateChatConferenceBanner };
});