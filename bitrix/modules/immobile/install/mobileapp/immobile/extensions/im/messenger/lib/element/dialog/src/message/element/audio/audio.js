/**
 * @module im/messenger/lib/element/dialog/message/element/audio/audio
 */
jn.define('im/messenger/lib/element/dialog/message/element/audio/audio', (require, exports, module) => {
	const { Type } = require('type');
	const { isEmpty, isEqual } = require('utils/object');
	const { Color } = require('tokens');
	const { Icon } = require('assets/icons');
	const { Loc } = require('im/messenger/loc');
	const { TranscriptStatus, AiTasksStatusType } = require('im/messenger/const');
	const { Feature } = require('im/messenger/lib/feature');
	const { parser } = require('im/messenger/lib/parser');
	const { parserCommon } = require('im/messenger/lib/parser/functions/common');

	const AiAnimationConfig = {
		[AiTasksStatusType.search]: {
			text: Loc.getMessage('IMMOBILE_ELEMENT_DIALOG_MESSAGE_AUDIO_AI_TASK_SEARCH_TEXT'),
			iconName: Icon.SOLID_AI_STARS.getIconName(),
			animate: true,
		},
		[AiTasksStatusType.taskCreationStarted]: {
			text: Loc.getMessage('IMMOBILE_ELEMENT_DIALOG_MESSAGE_AUDIO_AI_TASK_CREATE_TEXT'),
			iconName: Icon.MORE.getIconName(),
			animate: true,
		},
		[AiTasksStatusType.taskCreationCompleted]: {
			text: Loc.getMessage('IMMOBILE_ELEMENT_DIALOG_MESSAGE_AUDIO_AI_TASK_CREATE_COMPLETED_TEXT'),
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
			text: Loc.getMessage('IMMOBILE_ELEMENT_DIALOG_MESSAGE_AUDIO_AI_TASK_NOT_FOUND_TEXT'),
			iconName: Icon.SOLID_CIRCLE_CROSS.getIconName(),
			animate: true,
		},
	};

	class Audio
	{
		/**
		 * @param {MessagesModelState} messageModel
		 * @param {FilesModelState} fileModel
		 * @param {TranscriptModelState | null} transcriptModel
		 * @param {CreateMessageOptions} options
		 */
		constructor(messageModel, fileModel, transcriptModel, options = {})
		{
			this.messageModel = messageModel;
			this.fileModel = fileModel;
			this.transcriptModel = transcriptModel;
			this.options = options;
		}

		/**
		 * @return {MessageAudio}
		 */
		toMessageFormat()
		{
			return {
				id: this.#getId(),
				type: this.#getMessageElementType(),
				localUrl: this.#getLocalUrl(),
				url: this.#getUrl(),
				size: this.#getSize(),
				isPlaying: this.#getIsPlaying(),
				playingTime: this.#getPlayingTime(),
				rate: this.#getRate(),
				speech2text: this.#prepareTranscriptProps(),
				aiAnimation: this.#prepareAiAnimation(),
			};
		}

		/**
		 * @return {MessageAudio['type']}
		 */
		#getMessageElementType()
		{
			return 'audio';
		}

		/**
		 * @return {MessageAudio['id']}
		 */
		#getId()
		{
			if (Type.isNumber(this.fileModel.id))
			{
				return this.fileModel.id.toString();
			}

			if (Type.isStringFilled(this.fileModel.id))
			{
				return this.fileModel.id;
			}

			return 0;
		}

		/**
		 * @return {MessageAudio['url']}
		 */
		#getUrl()
		{
			if (Type.isStringFilled(this.fileModel.urlShow))
			{
				return this.fileModel.urlShow;
			}

			return null;
		}

		/**
		 * @return {MessageAudio['localUrl']}
		 */
		#getLocalUrl()
		{
			if (Type.isStringFilled(this.fileModel.localUrl))
			{
				return this.fileModel.localUrl;
			}

			return null;
		}

		/**
		 * @return {MessageAudio['size']}
		 */
		#getSize()
		{
			if (Type.isNumber(this.fileModel.size))
			{
				return this.fileModel.size;
			}

			return null;
		}

		/**
		 * @return {MessageAudio['playingTime']}
		 */
		#getPlayingTime()
		{
			if (Type.isNumber(this.messageModel.playingTime))
			{
				return this.messageModel.playingTime;
			}

			return null;
		}

		/**
		 * @return {MessageAudio['isPlaying']}
		 */
		#getIsPlaying()
		{
			return this.messageModel.isPlaying;
		}

		/**
		 * @return {number}
		 */
		#getRate()
		{
			if (Type.isNumber(this.options.audioRate))
			{
				return this.options.audioRate;
			}

			return 1;
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

			const hasTranscript = Type.isObject(this.transcriptModel) && !isEmpty(this.transcriptModel);
			const isPreparedFiles = isEqual(this.messageModel.params?.FILE_ID, this.messageModel.files);

			const transcript = {
				text: '',
				textColor: Color.base2.toHex(),
				status: TranscriptStatus.ready,
			};
			if (!hasTranscript || !isPreparedFiles)
			{
				return transcript;
			}

			transcript.status = this.transcriptModel.status;
			if (transcript.status === TranscriptStatus.error)
			{
				transcript.text = this.transcriptModel.text;
				transcript.textColor = Color.chatOtherBase1_1.toHex();

				return transcript;
			}

			transcript.text = parserCommon.simplifyNewLine(this.transcriptModel.text, '\n');
			transcript.text += Loc.getMessage(
				'IMMOBILE_ELEMENT_DIALOG_MESSAGE_FILE_TRANSCRIPT_FOOTNOTE',
				{
					'[COLOR]': '[color="#84B5EE"]',
					'[/COLOR]': '[/color]',
					'[SIZE]': '[size="13"]',
					'[/SIZE]': '[/size]',
					'#DIVIDER#': '\n\n____________\n\n',
				},
			);

			if (!Feature.isTranscribationBbcodeSupported)
			{
				const parserConfig = { text: transcript.text, isReplaceNewLine: false };
				transcript.text = parser.simplify(parserConfig);
			}

			return transcript;
		}

		/**
		 * @return {AiAnimationMessageData|null}
		 */
		#prepareAiAnimation()
		{
			if (!this.#canTranscript() || !this.#canAiAnimation())
			{
				return null;
			}

			if (this.messageModel.error)
			{
				return null;
			}

			if (Type.isStringFilled(this.transcriptModel?.text))
			{
				return null;
			}

			const status = this.messageModel.visualState?.aiTaskStatus;
			const config = AiAnimationConfig[status];

			return config || null;
		}

		/**
		 * @return {boolean}
		 */
		#canTranscript()
		{
			return this.fileModel?.isTranscribable && Feature.isAiFileTranscriptionAvailable;
		}

		/**
		 * @return {boolean}
		 */
		#canAiAnimation()
		{
			return Feature.isAiTaskCreationUISupported && Feature.isAiTaskCreationUIAvailable;
		}
	}

	module.exports = { Audio };
});
