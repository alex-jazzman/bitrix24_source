/**
 * @module im/messenger/lib/element/dialog/message/image
 */
jn.define('im/messenger/lib/element/dialog/message/image', (require, exports, module) => {
	const { MessageType } = require('im/messenger/const');
	const { Message } = require('im/messenger/lib/element/dialog/message/base');
	const { Image } = require('im/messenger/lib/element/dialog/message/element/image/image');

	/**
	 * @class ImageMessage
	 */
	class ImageMessage extends Message
	{
		/**
		 * @param {MessagesModelState} modelMessage
		 * @param {CreateMessageOptions|{}} options
		 */
		constructor(modelMessage, options = {})
		{
			super(modelMessage, options);

			this.setShowUsername(modelMessage, false);

			if (modelMessage.text)
			{
				this.setMessage(modelMessage.text, { dialogId: options.dialogId });
			}

			this.setLoadText();
			const [firstFile = {}] = this.getModelFiles();
			this.image = Image.createByFileModel(firstFile).toMessageFormat();

			/* region deprecated properties */
			this.imageUrl = this.image.url;
			this.previewParams = this.image.previewParams;
			/* end region */
		}

		/**
		 * @return {ImageDialogWidgetItem}
		 */
		toDialogWidgetItem()
		{
			return {
				...super.toDialogWidgetItem(),
				image: this.image,
				imageUrl: this.imageUrl,
				previewParams: this.previewParams,
			};
		}

		getType()
		{
			return MessageType.image;
		}
	}

	module.exports = {
		ImageMessage,
	};
});
