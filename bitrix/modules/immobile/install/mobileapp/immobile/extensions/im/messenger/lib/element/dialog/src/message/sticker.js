/**
 * @module im/messenger/lib/element/dialog/message/sticker
 */
jn.define('im/messenger/lib/element/dialog/message/sticker', (require, exports, module) => {
	const { Message } = require('im/messenger/lib/element/dialog/message/base');
	const { MessageType } = require('im/messenger/const');
	const { StickerHelper } = require('im/messenger/lib/helper');
	const { Feature } = require('im/messenger/lib/feature');

	const nativeMessageSupported = Feature.isNativeStickerMessageSupported;

	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	/**
	 * @class StickerMessage
	 */
	class StickerMessage extends Message
	{
		/**
		 * @param {MessagesModelState} modelMessage
		 * @param {CreateMessageOptions} options
		 */
		constructor(modelMessage = {}, options = {})
		{
			super(modelMessage, options);

			this.commentInfo = null;
			this.sticker = null;
			const stickerData = serviceLocator.get('core').getStore().getters['stickerPackModel/getStickerData'](modelMessage.stickerParams);

			if (nativeMessageSupported)
			{
				this.#setSticker(stickerData);
			}
			else
			{
				const wrappedSticker = this.wrapStickerToBBCode(stickerData);
				this.setMessage(wrappedSticker);
			}
		}

		getType()
		{
			return nativeMessageSupported ? MessageType.sticker : MessageType.emojiOnly;
		}

		/**
		 * @param {MessagesModelState} stickerData
		 */
		wrapStickerToBBCode(stickerData)
		{
			return StickerHelper.createImgBBCode(stickerData);
		}

		toDialogWidgetItem()
		{
			return {
				...super.toDialogWidgetItem(),
				sticker: this.sticker,
			};
		}

		/**
		 * @param {StickerState} stickerData
		 */
		#setSticker(stickerData)
		{
			this.sticker = {
				id: String(stickerData.id),
				type: stickerData.type,
				url: stickerData.uri,
				previewParams: {
					height: stickerData.height,
					width: stickerData.width,
				},
			};

			return this;
		}
	}

	module.exports = { StickerMessage };
});
