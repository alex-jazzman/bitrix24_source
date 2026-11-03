/**
 * @module im/messenger/lib/element/dialog/message/banner/message
 */
jn.define('im/messenger/lib/element/dialog/message/banner/message', (require, exports, module) => {
	const { CustomMessage } = require('im/messenger/lib/element/dialog/message/custom/message');
	const { MessageType } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { BannerMessageConfiguration } = require('im/messenger/lib/element/dialog/message/banner/configuration');
	const { parser } = require('im/messenger/lib/parser');

	/**
	 * @class BannerMessage
	 */
	class BannerMessage extends CustomMessage
	{
		constructor(modelMessage, options = {})
		{
			super(modelMessage, options);
			/** @type {BannerProps} */
			this.banner = {};

			this.setMessage(modelMessage.text);
			this.prepareTextMessage();
			this.setBannerProp();
			this.setAvatarUri(null);
		}

		/**
		 * @return {BannerDialogWidgetItem}
		 */
		toDialogWidgetItem()
		{
			return {
				...super.toDialogWidgetItem(),
				banner: this.banner,
			};
		}

		/**
		 * @return {CoreApplication}
		 */
		getCore()
		{
			return serviceLocator.get('core');
		}

		/**
		 * @abstract
		 * @void
		 */
		prepareTextMessage()
		{}

		/**
		 * Applies the decoration to every part of the text except the url tags: a link nested in a
		 * [color] tag is not rendered on Android, and a link carries its own styling anyway.
		 *
		 * @param {string} text
		 * @param {function(string): string} decorate
		 * @return {string}
		 */
		decorateOutsideUrlTags(text, decorate)
		{
			return parser
				.splitByUrlTag(text)
				.map((part) => {
					if (parser.isUrlTag(part))
					{
						return part;
					}

					return part ? decorate(part) : '';
				})
				.join('')
			;
		}

		get metaData()
		{
			const configuration = new BannerMessageConfiguration(this.id);

			return configuration.getMetaData();
		}

		setBannerProp()
		{
			this.banner = this.metaData?.banner;
		}

		/**
		 * @return {string}
		 */
		getType()
		{
			return MessageType.banner;
		}

		static getComponentId()
		{
			return 'banner';
		}
	}

	module.exports = {
		BannerMessage,
	};
});
