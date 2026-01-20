/**
 * @module im/messenger/lib/element/dialog/message/video-note-text
 */
jn.define('im/messenger/lib/element/dialog/message/video-note-text', (require, exports, module) => {
	const { MessageType } = require('im/messenger/const');
	const { AudioMessage } = require('im/messenger/lib/element/dialog/message/audio');
	const { Video } = require('im/messenger/lib/element/dialog/message/element/video/video');

	class VideoNoteTextMessage extends AudioMessage
	{
		/**
		 * @param {MessagesModelState} modelMessage
		 * @param {CreateMessageOptions} options
		 * @param {FilesModelState} file
		 */
		constructor(messageModel = {}, options = {}, file = {})
		{
			super(messageModel, options, file);

			this.file = file;
			this.audio = this.getAudio();
		}

		getType()
		{
			return MessageType.videoNoteText;
		}

		getAudio()
		{
			const video = Video.createByFileModel(this.file).toMessageFormat();

			return {
				...this.audio,
				previewUrl: video.previewImage,
			};
		}

		/**
		 * @return {VideoNoteTextDialogWidgetItem}
		 */
		toDialogWidgetItem()
		{
			const superResult = super.toDialogWidgetItem();

			return {
				...superResult,
				audio: this.audio,
			};
		}
	}

	module.exports = { VideoNoteTextMessage };
});
