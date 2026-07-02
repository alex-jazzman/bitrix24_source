/**
 * @module im/messenger/lib/element/dialog/message/video
 */
jn.define('im/messenger/lib/element/dialog/message/video', (require, exports, module) => {
	const { MessageType } = require('im/messenger/const');
	const { Message } = require('im/messenger/lib/element/dialog/message/base');
	const { Video } = require('im/messenger/lib/element/dialog/message/element/video/video');

	/**
	 * @class VideoMessage
	 */
	class VideoMessage extends Message
	{
		/**
		 * @param {MessagesModelState} modelMessage
		 * @param {CreateMessageOptions|{}} options
		 */
		constructor(modelMessage, options = {})
		{
			super(modelMessage, options);

			this.setShowUsername(modelMessage, false);

			if (modelMessage.text !== '')
			{
				this.setMessage(modelMessage.text, { dialogId: options.dialogId });
			}

			this.setLoadText();
			const [firstFile = {}] = this.getModelFiles();
			this.video = Video.createByFileModel(firstFile).toMessageFormat();

			/* region deprecated properties */
			this.videoUrl = this.video.url;
			this.localVideoUrl = this.video.localUrl;
			this.previewImage = this.video.previewImage;
			this.previewParams = this.video.previewParams;
			/* end region */
		}

		/**
		 * @return {VideoDialogWidgetItem}
		 */
		toDialogWidgetItem()
		{
			return {
				...super.toDialogWidgetItem(),
				video: this.video,
				videoUrl: this.videoUrl,
				localVideoUrl: this.localVideoUrl,
				previewImage: this.previewImage,
				previewParams: this.previewParams,
			};
		}

		getType()
		{
			return MessageType.video;
		}
	}

	module.exports = {
		VideoMessage,
	};
});
