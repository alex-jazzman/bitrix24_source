/**
 * @module im/messenger/lib/element/dialog/message/create-banner/banners/create-general-channel
 */
jn.define('im/messenger/lib/element/dialog/message/create-banner/banners/create-general-channel', (require, exports, module) => {
	const { Banner } = require('im/messenger/lib/element/dialog/message/banner');
	const { Loc } = require('loc');
	const { Theme } = require('im/lib/theme');
	const { transparent } = require('utils/color');

	class CreateGeneralChannelBanner extends Banner
	{
		/**
		 * @param {?string} componentId
		 */
		setTitle(componentId)
		{
			this.title = Loc.getMessage('IMMOBILE_ELEMENT_DIALOG_MESSAGE_CHANNEL_GENERAL_CREATE_BANNER_TITLE');
		}

		/**
		 * @param {?string} componentId
		 */
		prepareTextMessage(componentId)
		{
			const desc1 = Loc.getMessage('IMMOBILE_ELEMENT_DIALOG_MESSAGE_CHANNEL_GENERAL_CREATE_BANNER_DESC_1');
			const desc2 = Loc.getMessage('IMMOBILE_ELEMENT_DIALOG_MESSAGE_CHANNEL_GENERAL_CREATE_BANNER_DESC_2');
			const desc3 = Loc.getMessage('IMMOBILE_ELEMENT_DIALOG_MESSAGE_CHANNEL_GENERAL_CREATE_BANNER_DESC_3');
			this.message[0].text = `${desc1}\n\n${desc2}\n\n${desc3}`;
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

	module.exports = { CreateGeneralChannelBanner };
});