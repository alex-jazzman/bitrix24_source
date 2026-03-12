/**
 * @module im/messenger/lib/element/dialog/src/message/banner/banners/admin/banner
 */
jn.define('im/messenger/lib/element/dialog/src/message/banner/banners/admin/banner', (require, exports, module) => {
	const { BannerMessage } = require('im/messenger/lib/element/dialog/message/banner/message');
	const { BannerMessageConfiguration } = require('im/messenger/lib/element/dialog/message/banner/configuration');
	const { MessageParams } = require('im/messenger/const');
	const { transparent } = require('utils/color');
	const { Color } = require('tokens');

	class AdminMessage extends BannerMessage
	{
		static getComponentId()
		{
			return MessageParams.ComponentId.AdminMessage;
		}

		get metaData()
		{
			const configuration = new BannerMessageConfiguration(this.id);
			const { stageId } = this.getComponentParams();
			const data = configuration?.getMetaData(AdminMessage.getComponentId());

			return data[stageId]?.banner;
		}

		prepareTextMessage()
		{
			const description = this.replacePhrase(this.metaData?.description);

			this.message[0].text = `[color=${Color.base3.toHex()}]${description}[/color]`;
		}

		setBannerProp()
		{
			const { title, buttons, imageName, picBackgroundColor } = this.metaData || {};

			this.banner = {
				title,
				imageName,
				backgroundColor: Color.chatOtherMessage1.toHex(),
				picBackgroundColor: transparent(picBackgroundColor, 0.08),
				shouldDisplayTime: true,
				buttons,
			};
		}

		/**
		 * @param {string} phrase
		 * @return {string}
		 */
		replacePhrase(phrase)
		{
			let text = phrase ?? '';
			const { initiator = null } = this.getComponentParams();

			const phrases = {
				'#LINK#': `${currentDomain}/company/personal/user/${initiator ? initiator.id : ''}/`,
				'#INITIATOR_NAME#': initiator ? initiator.name : '',
			};

			Object.keys(phrases).forEach((code) => {
				text = text.replaceAll(code, phrases[code]);
			});

			return text;
		}
	}

	module.exports = {
		AdminMessage,
	};
});
