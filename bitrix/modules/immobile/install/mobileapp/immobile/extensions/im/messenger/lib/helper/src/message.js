/**
 * @module im/messenger/lib/helper/message
 */
jn.define('im/messenger/lib/helper/message', (require, exports, module) => {
	const { Type } = require('type');
	const { Uuid } = require('utils/uuid');

	const {
		FileType,
		FileAudioType,
		UrlGetParameter,
		MessageComponent,
		TranscriptStatus,
		DialogType,
		BlockElementType,
	} = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { getLogger } = require('im/messenger/lib/logger');
	const { emojiRegex } = require('im/messenger/lib/utils');
	const { SmileManager } = require('im/messenger/lib/smile-manager');
	const { Feature } = require('im/messenger/lib/feature');

	const logger = getLogger('helpers--message');

	/**
	 * MessageHelper is a utility class that encapsulates logic for analyzing a message model
	 * and provides boolean methods to determine the presence of specific characteristics or types.
	 *
	 * Its sole responsibility is to offer boolean checks (e.g., isSystem(), hasAttachment(), isEdited(), etc.)
	 * that help identify the type, status, or special properties of a message based on its model.
	 *
	 * MessageHelper does not mutate, create, or return message models
	 *
	 * @class MessageHelper
	 */
	class MessageHelper
	{
		/** @type {MessagesModelState} */
		messageModel;
		/** @type {Array<FilesModelState>} */
		filesModel;
		/** @type {VoteModelState} */
		voteModel;

		/**
		 * @param {MessagesModelState} messagesModel
		 * @return {MessageHelper|null}
		 */
		static createByModel(messagesModel)
		{
			if (!Type.isPlainObject(messagesModel))
			{
				logger.error('MessageHelper.getByModel error: dialogModel is not an object', messagesModel);

				return null;
			}

			return new MessageHelper(messagesModel);
		}

		/**
		 * @param {string | number} messageId
		 * @return {MessageHelper|null}
		 */
		static createById(messageId)
		{
			if (!Type.isNumber(messageId) && !Type.isStringFilled(messageId))
			{
				logger.error('MessageHelper.getById error: messageId is not a number or string filled', messageId);

				return null;
			}

			const messagesModel = serviceLocator.get('core').getStore().getters['messagesModel/getById'](messageId);
			if (Type.isNil(messagesModel.id))
			{
				logger.warn('MessageHelper.getById: message not found', messageId);

				return null;
			}

			return MessageHelper.createByModel(messagesModel);
		}

		/**
		 * @param {MessagesModelState} messageModel
		 */
		constructor(messageModel)
		{
			this.messageModel = messageModel;
			this.voteModel = messageModel.vote;
			this.#setBlock(messageModel);
		}

		#setBlock(messageModel)
		{
			this.blockModel = messageModel.block ?? serviceLocator.get('core').getStore().getters['messagesModel/blockModel/getByMessageId'](messageModel.id);
		}

		/**
		 * @return {MessengerCoreStore}
		 */
		get #store()
		{
			return serviceLocator.get('core').getStore();
		}

		get messageId()
		{
			return this.messageModel.id;
		}

		/**
		 * @return {Array<FilesModelState>}
		 */
		get files()
		{
			this.filesModel ??= this.#store.getters['filesModel/getListByMessageId'](this.messageModel.id) || [];

			return this.filesModel;
		}

		/**
		 * @return {Array<FilesModelState>}
		 */
		get #files()
		{
			return this.files;
		}

		/**
		 * @return {FilesModelState|null}
		 */
		get #firstFile()
		{
			return this.#files[0] || null;
		}

		get isSystem()
		{
			return this.messageModel.authorId === 0;
		}

		get isSystemText()
		{
			return this.isSystem && this.isText && !this.isWithFile;
		}

		get isText()
		{
			return this.messageModel.text !== '';
		}

		get isViewed()
		{
			return this.messageModel.viewed;
		}

		get isYour()
		{
			return Number(this.messageModel.authorId) === serviceLocator.get('core').getUserId();
		}

		get isDeleted()
		{
			return this.messageModel.params?.IS_DELETED === 'Y';
		}

		get isError()
		{
			return this.messageModel.params?.COMPONENT_PARAMS?.copilotError
				|| this.messageModel.params?.componentId === MessageComponent.error;
		}

		get isForward()
		{
			return !Type.isUndefined(this.messageModel?.forward.id);
		}

		get isVideoNote()
		{
			return this.#files.length === 1 && this.#firstFile?.isVideoNote;
		}

		get isVideoNoteText()
		{
			if (
				!Feature.isVideoNoteTranscriptionAvailable
				|| !this.isVideoNote
				|| !Type.isArrayFilled(this.messageModel.params?.FILE_ID)
			)
			{
				return false;
			}

			const transcriptModel = this.#store.getters['filesModel/transcriptModel/getById'](this.#firstFile?.id);

			return !Type.isNull(transcriptModel) && transcriptModel.status !== TranscriptStatus.ready;
		}

		get isWithAttach()
		{
			return Type.isArrayFilled(this.messageModel?.params?.ATTACH);
		}

		get isWithFile()
		{
			return Type.isArrayFilled(this.messageModel.files);
		}

		get isGallery()
		{
			if (!this.isWithFile)
			{
				return false;
			}

			return this.messageModel.files?.length > 1;
		}

		get isEmpty()
		{
			return !this.isText && !this.isWithFile && !this.isWithAttach;
		}

		/**
		 * @return {boolean}
		 */
		get isMediaGallery()
		{
			if (!this.isGallery || this.isVideoNote)
			{
				return false;
			}

			return this.#files.every((file) => {
				return file?.type === FileType.image || file?.type === FileType.video;
			});
		}

		/**
		 * @return {boolean}
		 */
		get isFileGallery()
		{
			if (!this.isGallery || this.isMediaGallery || this.isVideoNote)
			{
				return false;
			}

			return this.#files.every((file) => {
				return file.type === FileType.file
					|| file.type === FileType.audio
					|| file.type === FileType.image
					|| file.type === FileType.video;
			});
		}

		get isVideo()
		{
			if (!this.isWithFile || this.isVideoNote)
			{
				return false;
			}

			if (this.#files.length === 0 || this.#files.length > 1)
			{
				return false;
			}

			return this.#firstFile?.type === FileType.video;
		}

		get isImage()
		{
			if (!this.isWithFile)
			{
				return false;
			}

			if (this.#files.length === 0 || this.#files.length > 1)
			{
				return false;
			}

			return this.#firstFile?.type === FileType.image && Type.isStringFilled(this.#firstFile?.urlPreview);
		}

		/**
		 * @desc A message containing a single image without a preview (e.g. sent from the web app as a compressed file).
		 */
		get isImageWithoutPreview()
		{
			if (!this.isWithFile)
			{
				return false;
			}

			if (this.#files.length !== 1)
			{
				return false;
			}

			return this.#firstFile?.type === FileType.image
				&& !Type.isStringFilled(this.#firstFile?.urlPreview);
		}

		get isAudio()
		{
			if (!this.isWithFile)
			{
				return false;
			}

			if (this.#files.length === 0 || this.#files.length > 1)
			{
				return false;
			}

			if (this.#firstFile?.extension === FileAudioType.m4a && !Feature.isAudioRecordM4ASupported)
			{
				return false;
			}

			return this.#firstFile?.type === FileType.audio;
		}

		get isFile()
		{
			if (!this.isWithFile)
			{
				return false;
			}

			if (this.#files.length === 0 || this.#files.length > 1)
			{
				return false;
			}

			return this.#firstFile?.type === FileType.file;
		}

		get isVote()
		{
			return this.getComponentId() === MessageComponent.vote;
		}

		get isSticker()
		{
			return Type.isPlainObject(this.messageModel.stickerParams)
				&& Type.isPlainObject(this.#store.getters['stickerPackModel/getStickerData'](this.messageModel.stickerParams))
			;
		}

		get isDeletedSticker()
		{
			return Type.isPlainObject(this.messageModel.stickerParams)
				&& !Type.isPlainObject(this.#store.getters['stickerPackModel/getStickerData'](this.messageModel.stickerParams))
			;
		}

		get isVoteModelExist()
		{
			return Type.isPlainObject(this.voteModel);
		}

		get isFinishedVote()
		{
			return this.isVote && this.isVoteModelExist && this.voteModel.isFinished;
		}

		get isVotedVote()
		{
			return this.isVote && this.isVoteModelExist && this.voteModel.isVoted;
		}

		get isMultipleVote()
		{
			const questions = this.messageModel.params?.COMPONENT_PARAMS?.data?.questions ?? {};

			return this.isVote && Object.values(questions).some((question) => question.fieldType === 1);
		}

		get isRevotingVote()
		{
			return this.isVote && this.messageModel.params?.COMPONENT_PARAMS?.data?.options === 1;
		}

		get isEmptyVote()
		{
			return this.isVote && this.isVoteModelExist && this.voteModel.votedCounter === 0;
		}

		get isMediaMessage()
		{
			return this.isImage || this.isVideo || this.isMediaGallery;
		}

		get isEmojiOnly()
		{
			if (!this.isText)
			{
				return false;
			}

			const messageText = this.messageModel.text;
			const text = messageText.replaceAll(emojiRegex, '');

			return text.replaceAll(/\s/g, '').length === 0;
		}

		get isSmileOnly()
		{
			if (!this.isText)
			{
				return false;
			}

			const messageText = this.messageModel.text;
			const smileManager = SmileManager.getInstance();
			if (Object.values(smileManager.getSmiles()).length === 0)
			{
				return false;
			}

			const pattern = smileManager.getPattern();
			const regExp = new RegExp(`(?:(?:${pattern})(?=(?:(?:${pattern})|\\s|&quot;|<|$)))`, 'g');
			const text = messageText.replaceAll(regExp, '');

			return text.replaceAll(/\s/g, '').length === 0;
		}

		get isInitialPostForComment()
		{
			return Boolean(this.#store.getters['dialoguesModel/getByParentMessageId'](this.messageModel.id));
		}

		get isAiAssistant()
		{
			return this.getComponentId() === MessageComponent.aiAssistant && Feature.isAiAssistantMessageSupported;
		}

		get isCopilot()
		{
			return this.getComponentId() === MessageComponent.copilot;
		}

		/**
		 * @return {boolean}
		 */
		get isCopilotCreatePrompt()
		{
			return this.getComponentId() === MessageComponent.copilotCreation;
		}

		/**
		 * @return {boolean}
		 */
		get isCopilotAddUsers()
		{
			return this.getComponentId() === MessageComponent.copilotAddedUsers;
		}

		/**
		 * @returns {boolean}
		 */
		get isAiBizproc()
		{
			return this.getComponentId() === MessageComponent.aiBizprocMessage && Feature.isFootnoteMessageIdAvailable;
		}

		/**
		 * @returns {boolean}
		 */
		get isBot()
		{
			const userModel = this.#store.getters['usersModel/getById'](this.messageModel.authorId);

			return Boolean(userModel?.bot);
		}

		/**
		 * @returns {boolean}
		 */
		get isConvertCollab()
		{
			return this.getComponentId() === MessageComponent.convertToCollab;
		}

		/**
		 * @returns {boolean}
		 */
		get isBlock()
		{
			return Type.isPlainObject(this.blockModel)
				&& Type.isArrayFilled(this.blockModel.elements)
				&& !this.isDeleted;
		}

		/**
		 * @return {boolean}
		 */
		get hasBlockGallery()
		{
			return this.isBlock
				&& this.blockModel.elements.some((block) => block.type === BlockElementType.gallery);
		}

		/**
		 * @return {Array<FilesModelState>}
		 */
		getBlockMediaFiles()
		{
			if (!this.hasBlockGallery)
			{
				return [];
			}

			const fileIds = this.blockModel.elements
				.filter((block) => block.type === BlockElementType.gallery)
				.flatMap((block) => block.fileIds ?? []);

			return fileIds
				.map((fileId) => this.#store.getters['filesModel/getById'](Number(fileId)))
				.filter(Boolean);
		}

		/**
		 * @return {boolean}
		 */
		get isTemplateId()
		{
			return Type.isStringFilled(this.messageId) && Uuid.isV4(this.messageId);
		}

		/**
		 * Returns true if the message has a componentId that is known to be unsupported as a text message.
		 * Used to prevent fallback to text for certain message types.
		 * @returns {boolean}
		 */
		get isUnsupportedByComponentId()
		{
			const unsupportedComponentIds = [
				MessageComponent.call,
				MessageComponent.vote,
				MessageComponent.aiAssistant,
				MessageComponent.blockMessage,
			];

			return unsupportedComponentIds.includes(this.getComponentId());
		}

		/**
		 * @return {string}
		 */
		getComponentId()
		{
			if (Type.isStringFilled(this.messageModel.params.componentId))
			{
				return this.messageModel.params.componentId;
			}

			if (this.isDeleted)
			{
				return MessageComponent.deleted;
			}

			if (this.isSystem)
			{
				return MessageComponent.system;
			}

			if (this.isWithFile)
			{
				return MessageComponent.file;
			}

			if (this.isEmojiOnly || this.isSmileOnly)
			{
				return MessageComponent.smile;
			}

			if (this.isBlock)
			{
				return MessageComponent.blockMessage;
			}

			return MessageComponent.default;
		}

		/**
		 * @return {?string}
		 */
		getLinkToMessage()
		{
			const core = serviceLocator.get('core');
			const host = core.getHost();
			const messageId = this.messageModel.id;
			const dialog = this.#getDialoguesModel();
			if (Type.isUndefined(dialog))
			{
				return null;
			}

			const dialogId = dialog.dialogId;
			const openDialogParamName = dialog.type === DialogType.tasksTask
				? UrlGetParameter.openTaskChat
				: UrlGetParameter.openChat;

			return `${host}/online/?${openDialogParamName}=${dialogId}&${UrlGetParameter.openMessage}=${messageId}`;
		}

		/**
		 * @return {?DialoguesModelState}
		 */
		#getDialoguesModel()
		{
			return this.#store
				.getters['dialoguesModel/getByChatId'](this.messageModel.chatId);
		}
	}

	module.exports = { MessageHelper };
});
