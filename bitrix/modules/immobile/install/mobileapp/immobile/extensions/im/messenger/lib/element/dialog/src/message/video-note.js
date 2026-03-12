/**
 * @module im/messenger/lib/element/dialog/message/video-note
 */
jn.define('im/messenger/lib/element/dialog/message/video-note', (require, exports, module) => {
	const { Color } = require('tokens');
	const { Icon } = require('assets/icons');

	const { Loc } = require('im/messenger/loc');
	const { MessageType, TranscriptStatus, AiTasksStatusType } = require('im/messenger/const');
	const { Message } = require('im/messenger/lib/element/dialog/message/base');
	const { Video } = require('im/messenger/lib/element/dialog/message/element/video/video');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { Feature } = require('im/messenger/lib/feature');

	const AiAnimationConfig = {
		[AiTasksStatusType.search]: {
			text: Loc.getMessage('IMMOBILE_ELEMENT_DIALOG_MESSAGE_VIDEO_NOTE_AI_TASK_SEARCH_TEXT'),
			iconName: Icon.SOLID_AI_STARS.getIconName(),
			animate: true,
		},
		[AiTasksStatusType.taskCreationStarted]: {
			text: Loc.getMessage('IMMOBILE_ELEMENT_DIALOG_MESSAGE_VIDEO_NOTE_AI_TASK_CREATE_TEXT'),
			iconName: Icon.MORE.getIconName(),
			animate: true,
		},
		[AiTasksStatusType.taskCreationCompleted]: {
			text: Loc.getMessage('IMMOBILE_ELEMENT_DIALOG_MESSAGE_VIDEO_NOTE_AI_TASK_CREATE_COMPLETED_TEXT'),
			iconName: Icon.SOLID_CIRCLE_CHECK.getIconName(),
			animate: true,
		},
		[AiTasksStatusType.resultCreationStarted]: {
			text: Loc.getMessage('IMMOBILE_ELEMENT_DIALOG_MESSAGE_AI_TASK_ADD_RESULT_TEXT'),
			iconName: Icon.MORE.getIconName(),
			animate: true,
		},
		[AiTasksStatusType.resultCreationCompleted]: {
			text: Loc.getMessage('IMMOBILE_ELEMENT_DIALOG_MESSAGE_AI_TASK_ADD_RESULT_COMPLETE_TEXT'),
			iconName: Icon.SOLID_CIRCLE_CHECK.getIconName(),
			animate: true,
		},
		[AiTasksStatusType.notFound]: {
			text: Loc.getMessage('IMMOBILE_ELEMENT_DIALOG_MESSAGE_VIDEO_NOTE_AI_TASK_NOT_FOUND_TEXT'),
			iconName: Icon.SOLID_CIRCLE_CROSS.getIconName(),
			animate: true,
		},
	};

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
			this.videoNote = this.getVideoNote(modelMessage, options, { ...file });
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
		 * @param {CreateMessageOptions} options
		 * @param {FilesModelState} file
		 * @return {MessageVideoNote}
		 */
		getVideoNote(modelMessage, options, file)
		{
			const video = Video.createByFileModel(file).toMessageFormat();
			const { isPlaying, playingTime } = serviceLocator.get('core').getStore().getters['messagesModel/playbackModel/getPlayback'](options.dialogId, modelMessage.id);

			return {
				id: video.id,
				localUrl: video.localUrl,
				url: video.url,
				previewUrl: video.previewImage,
				isPlaying,
				playingTime,
				speech2text: this.#prepareTranscriptProps(modelMessage),
				aiAnimation: this.#prepareAiAnimation(modelMessage),
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

		/**
		 * @param {MessagesModelState} modelMessage
		 */
		#prepareAiAnimation(modelMessage)
		{
			if (!this.#canTranscript() || !this.#canAiAnimation())
			{
				return null;
			}

			if (modelMessage.error)
			{
				return null;
			}

			const status = modelMessage.visualState?.aiTaskStatus;
			const config = AiAnimationConfig[status];

			return config || null;
		}

		#canTranscript()
		{
			return this.fileModel?.isTranscribable && Feature.isVideoNoteTranscriptionAvailable;
		}

		/**
		 * @return {boolean}
		 */
		#canAiAnimation()
		{
			return Feature.isAiTaskCreationUISupported && Feature.isAiTaskCreationUIAvailable;
		}
	}

	module.exports = { VideoNoteMessage };
});
