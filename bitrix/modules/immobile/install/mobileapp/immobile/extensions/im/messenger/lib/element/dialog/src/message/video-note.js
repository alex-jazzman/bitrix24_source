/**
 * @module im/messenger/lib/element/dialog/message/video-note
 */
jn.define('im/messenger/lib/element/dialog/message/video-note', (require, exports, module) => {
	const { Type } = require('type');
	const { Color } = require('tokens');
	const { Icon } = require('assets/icons');

	const { Loc } = require('im/messenger/loc');
	const {
		MessageType,
		TranscriptStatus,
		AiTasksStatusType,
		FileStatus,
		AiTaskIndicationRole,
	} = require('im/messenger/const');
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
		 * @param {CreateMessageOptions|{}} options
		 */
		constructor(modelMessage, options = {})
		{
			super(modelMessage, options);
			const [firstFile = {}] = this.getModelFiles();
			this.fileModel = firstFile;
			this.transcriptModel = serviceLocator.get('core').getStore().getters['filesModel/transcriptModel/getById'](firstFile?.id);
			this.videoNote = this.getVideoNote(modelMessage, options, { ...firstFile });

			// The text reaches native for two independent reasons: the caption is available and native
			// renders the saved text under the round video, or the note is a reply whose quote travels
			// as encoded text (validateQuote) and has to be parsed for native (reply-with-media).
			// setMessage strips the quote's trailing empty node, so native keeps a bare quote.
			if (
				modelMessage.text
				&& (Feature.isVideoNoteCaptionAvailable || Feature.isReplyWithMediaAvailable)
			)
			{
				this.setMessage(modelMessage.text, { dialogId: options.dialogId });
			}
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
		 * @param {CreateMessageOptions|{}} options
		 * @param {FilesModelState|{}} file
		 * @return {MessageVideoNote}
		 */
		getVideoNote(modelMessage, options, file)
		{
			const video = Video.createByFileModel(file).toMessageFormat();
			const { isPlaying, playingTime } = serviceLocator.get('core').getStore().getters['messagesModel/playbackModel/getPlayback'](options.dialogId, modelMessage.id);

			/** @type {MessageVideoNote} */
			const videoNote = {
				id: video.id,
				localUrl: video.localUrl,
				url: video.url,
				previewUrl: video.previewImage,
				isPlaying,
				playingTime,
				speech2text: this.#prepareTranscriptProps(),
				aiAnimation: this.#prepareAiAnimation(modelMessage),
			};

			if (this.#shouldSendRate(options, video.status))
			{
				videoNote.rate = options.audioRate;
			}

			return videoNote;
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
		 * Native shows the rate control by the presence of the field, so unlike the audio element
		 * the rate is sent only for a video note the user can act on: shared options exist in the
		 * message list only, and the tap is handled there as well.
		 *
		 * @param {CreateMessageOptions|{}} options
		 * @param {FileStatus} fileStatus
		 * @return {boolean}
		 */
		#shouldSendRate(options, fileStatus)
		{
			return Feature.isVideoNotePlaybackRateAvailable
				&& Type.isNumber(options.audioRate)
				&& fileStatus === FileStatus.done;
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
			if (!this.#canTranscript() || !this.#canAiAnimation(modelMessage))
			{
				return null;
			}

			if (modelMessage.error)
			{
				return null;
			}

			const status = modelMessage.visualState?.aiTaskStatus;

			// The status comes from a pull event payload, so an inherited key of Object.prototype
			// (constructor, toString) would otherwise hand a function to the native side as a frame.
			if (!Object.prototype.hasOwnProperty.call(AiAnimationConfig, status))
			{
				return null;
			}

			return AiAnimationConfig[status];
		}

		#canTranscript()
		{
			return this.fileModel?.isTranscribable && Feature.isVideoNoteTranscriptionAvailable;
		}

		/**
		 * @param {MessagesModelState} modelMessage
		 * @return {boolean}
		 */
		#canAiAnimation(modelMessage)
		{
			// An operation led by the message-level indication owns the message on its own: both tracks
			// key their frames by the same aiTaskStatus values, so leaving this one on would draw two
			// indications at once. The role is written by the indication manager alone, and pull offers
			// every event to that manager first, so a status without a role is exactly what the new
			// track did not take - on a build without the native indication, that is every status there is.
			if (Feature.isAiTaskMessageIndicationSupported && this.#isLedByMessageIndication(modelMessage))
			{
				return false;
			}

			return Feature.isAiTaskCreationUISupported && Feature.isAiTaskCreationUIAvailable;
		}

		/**
		 * @param {MessagesModelState} modelMessage
		 * @return {boolean}
		 */
		#isLedByMessageIndication(modelMessage)
		{
			return AiTaskIndicationRole.isIndicationRole(modelMessage.visualState?.aiTaskRole);
		}
	}

	module.exports = { VideoNoteMessage };
});
