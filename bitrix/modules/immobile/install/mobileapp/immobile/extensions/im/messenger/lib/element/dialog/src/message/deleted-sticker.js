/**
 * @module im/messenger/lib/element/dialog/message/deleted-sticker
 */
jn.define('im/messenger/lib/element/dialog/message/deleted-sticker', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');

	const { DeletedMessage } = require('im/messenger/lib/element/dialog/message/deleted');

	/**
	 * @class DeletedStickerMessage
	 */
	class DeletedStickerMessage extends DeletedMessage
	{
		/**
		 * @param {MessagesModelState} modelMessage
		 * @param {CreateMessageOptions} options
		 */
		constructor(modelMessage = {}, options = {})
		{
			super(modelMessage, options);

			const message = Loc.getMessage('IMMOBILE_ELEMENT_DIALOG_MESSAGE_DELETED_STICKER');

			this.setMessage(message);
		}
	}

	module.exports = { DeletedStickerMessage };
});
