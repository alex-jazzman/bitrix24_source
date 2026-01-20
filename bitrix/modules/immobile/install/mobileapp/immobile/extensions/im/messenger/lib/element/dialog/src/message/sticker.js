/**
 * @module im/messenger/lib/element/dialog/message/sticker
 */
jn.define('im/messenger/lib/element/dialog/message/sticker', (require, exports, module) => {
	const { Message } = require('im/messenger/lib/element/dialog/message/base');
	const { MessageType } = require('im/messenger/const');
	const { StickerHelper } = require('im/messenger/lib/helper');

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

			const wrappedSticker = this.wrapStickerToBBCode(modelMessage);
			this.setMessage(wrappedSticker);
			this.commentInfo = null;
		}

		getType()
		{
			return MessageType.emojiOnly;
		}

		/**
		 * @param {MessagesModelState} modelMessage
		 */
		wrapStickerToBBCode(modelMessage)
		{
			return StickerHelper.createImgBBCode(modelMessage.stickerParams);
		}
	}

	module.exports = { StickerMessage };
});
