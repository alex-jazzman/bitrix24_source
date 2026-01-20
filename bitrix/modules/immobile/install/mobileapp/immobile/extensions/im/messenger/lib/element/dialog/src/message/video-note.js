/**
 * @module im/messenger/lib/element/dialog/message/video-note
 */
jn.define('im/messenger/lib/element/dialog/message/video-note', (require, exports, module) => {
	const { Color } = require('tokens');

	const { MessageType, TranscriptStatus } = require('im/messenger/const');
	const { Message } = require('im/messenger/lib/element/dialog/message/base');
	const { Video } = require('im/messenger/lib/element/dialog/message/element/video/video');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { Feature } = require('im/messenger/lib/feature');

	class VideoNoteMessage extends Message
	{
		/**
		 * @param {MessagesModelState} modelMessage
		 * @param {CreateMessageOptions} options
		 * @param {FilesModelState} file
		 */
		constructor(modelMessage = {}, options = {}, file = {})
		{
			super(modelMessage, options, file);

			this.fileModel = file;
			this.transcriptModel = serviceLocator.get('core').getStore().getters['filesModel/transcriptModel/getById'](file?.id);
			this.videoNote = this.getVideoNote(modelMessage, { ...file });
		}

		/**
		 * @return {VideoNoteDialogWidgetItem}
		 */
		toDialogWidgetItem()
		{
			return {
				...super.toDialogWidgetItem(),
				videoNote: this.videoNote,
			};
		}

		/**
		 * @param {MessagesModelState} modelMessage
		 * @param {FilesModelState} file
		 * @return {MessageVideoNote}
		 */
		getVideoNote(modelMessage, file)
		{
			const video = Video.createByFileModel(file).toMessageFormat();

			return {
				id: video.id,
				localUrl: video.localUrl,
				url: video.url,
				previewUrl: video.previewImage,
				isPlaying: modelMessage.isPlaying,
				playingTime: modelMessage.playingTime,
				speech2text: this.#prepareTranscriptProps(modelMessage),
			};
		}

		setPlayVideoNote(isPlaying, playingTime)
		{
			this.videoNote.playingTime = playingTime;
			this.videoNote.isPlaying = isPlaying;
		}

		getType()
		{
			return MessageType.videoNote;
		}

		/**
		 * @returns {Speech2Text|null}
		 */
		#prepareTranscriptProps()
		{
			if (!this.#canTranscript())
			{
				return null;
			}

			return {
				text: '',
				textColor: Color.base2.toHex(),
				status: TranscriptStatus.ready,
			};
		}

		#canTranscript()
		{
			return this.fileModel?.isTranscribable && Feature.isVideoNoteTranscriptionAvailable;
		}
	}

	module.exports = { VideoNoteMessage };
});
