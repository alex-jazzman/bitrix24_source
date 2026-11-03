/**
 * @module im/messenger/lib/helper/message
 */
jn.define('im/messenger/lib/helper/message', (require, exports, module) => {
	const { Type } = require('type');
	const { Uuid } = require('utils/uuid');
	const { unique } = require('utils/array');

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

	// Leading synthetic reply-quote block (54-dash delimiters) injected by Dialog.validateQuote /
	// ReplyManager. Kept in sync with QUOTE_DELIMITER in controller/dialog/lib/reply-manager.
	const LEADING_REPLY_QUOTE_REGEX = /^-{54}\r?\n[\s\S]*?\r?\n-{54}\r?\n?/;

	/**
	 * @param {GalleryBlockElementType|FileBlockElementType} element
	 * @return {Array<number>}
	 */
	const fileIdsFromList = (element) => (Type.isArrayFilled(element.fileIds) ? element.fileIds : []);

	// One extractor per block element type that carries files; a type absent from the map
	// contributes nothing. An element without its file field behaves as an empty one.
	const FileIdsByBlockElementType = Object.freeze({
		[BlockElementType.gallery]: fileIdsFromList,
		[BlockElementType.file]: fileIdsFromList,
		[BlockElementType.audio]: (element) => (Type.isNil(element.fileId) ? [] : [element.fileId]),
	});

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
		/** @type {Array<FilesModelState>} */
		blockFilesModel;
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

		/**
		 * @desc Text without the leading synthetic reply-quote block, so a reply is classified
		 * by its own body rather than by the injected quote. Non-reply text is untouched.
		 * @return {string}
		 */
		getTextWithoutLeadingReplyQuote()
		{
			const messageText = this.messageModel.text;
			if (!this.messageModel.params?.replyId || !Type.isStringFilled(messageText))
			{
				return messageText;
			}

			return messageText.replace(LEADING_REPLY_QUOTE_REGEX, '');
		}

		get isEmojiOnly()
		{
			if (!this.isText)
			{
				return false;
			}

			const messageText = this.getTextWithoutLeadingReplyQuote();
			const text = messageText.replaceAll(emojiRegex, '');

			return text.replaceAll(/\s/g, '').length === 0;
		}

		get isSmileOnly()
		{
			if (!this.isText)
			{
				return false;
			}

			const messageText = this.getTextWithoutLeadingReplyQuote();
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

		get isAiAssistantSourceResponse()
		{
			return this.getComponentId() === MessageComponent.aiAssistant
				&& (
					this.isBlock
					|| this.messageModel.params?.COMPONENT_PARAMS?.aiAssistantSourceResponse === true
				);
		}

		get isCopilot()
		{
			return this.getComponentId() === MessageComponent.copilot;
		}

		/**
		 * @desc Transient BitrixGPT "thinking" placeholder: a copilot message flagged
		 * with copilotProcess in COMPONENT_PARAMS. Symmetric to the copilotError read.
		 * @return {boolean}
		 */
		get isCopilotProcess()
		{
			return this.isCopilot && this.messageModel.params?.COMPONENT_PARAMS?.copilotProcess === true;
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
		 * Files of the gallery blocks of the message: the media viewer and the gallery of the block
		 * message read them. The gallery ships before the file and audio blocks, so
		 * `Feature.isMessageFileAudioBlockAvailable` does not close it: turning the option off must
		 * return what the feature changed, not break what worked before it.
		 *
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
				.flatMap((block) => MessageHelper.getBlockElementFileIds(block));

			return this.getBlockFilesByIds(fileIds);
		}

		/**
		 * All files of the message: its own attachments and the files of its blocks. The server does
		 * not duplicate block file ids into `message.files`, so an action over the whole message
		 * joins both sources itself.
		 *
		 * @return {Array<FilesModelState>}
		 */
		getAllFiles()
		{
			const blockFiles = this.getBlockFiles();
			if (blockFiles.length === 0)
			{
				return this.files;
			}

			const ownFileIds = new Set(this.files.map((file) => Number(file.id)));

			return [...this.files, ...blockFiles.filter((file) => !ownFileIds.has(Number(file.id)))];
		}

		/**
		 * Files of the blocks of the message. The option that renders the file and audio blocks closes
		 * the whole set, gallery files included: before the feature no consumer of it reached them.
		 * Rendering the gallery goes through `getBlockMediaFiles()`, which stays open.
		 *
		 * @return {Array<FilesModelState>}
		 */
		getBlockFiles()
		{
			if (!Feature.isMessageFileAudioBlockAvailable || !this.isBlock)
			{
				return [];
			}

			this.blockFilesModel ??= this.getBlockFilesByIds(
				this.blockModel.elements.flatMap((element) => MessageHelper.getBlockElementFileIds(element)),
			);

			return this.blockFilesModel;
		}

		/**
		 * Files of a single block element by its own id (native calls the element id `blockId`).
		 *
		 * @param {string} elementId
		 * @return {Array<FilesModelState>}
		 */
		getBlockFilesByElementId(elementId)
		{
			if (!Feature.isMessageFileAudioBlockAvailable || !this.isBlock)
			{
				return [];
			}

			const element = this.blockModel.elements.find((item) => String(item.id) === String(elementId));
			if (!element)
			{
				return [];
			}

			return this.getBlockFilesByIds(MessageHelper.getBlockElementFileIds(element));
		}

		/**
		 * Chat-file ids a block element owns, as numbers: the server sends an id both as a number
		 * and as a string.
		 *
		 * @param {BaseBlockElementType} [element]
		 * @return {Array<number>}
		 */
		static getBlockElementFileIds(element)
		{
			const fileIds = FileIdsByBlockElementType[element?.type]?.(element) ?? [];

			return fileIds.filter((fileId) => !Type.isNil(fileId)).map(Number);
		}

		/**
		 * Chat-file models of the given ids, in the same order and one model per file: every path to
		 * the files of a block resolves them here, so a repeated id gives one tile of the container
		 * and one place in the count of its download caption. An id without a model in the store is
		 * skipped: a file that has not arrived must not turn into an empty tile of the block.
		 *
		 * @param {Array<number|string>} fileIds
		 * @return {Array<FilesModelState>}
		 */
		getBlockFilesByIds(fileIds)
		{
			if (!Type.isArrayFilled(fileIds))
			{
				return [];
			}

			const uniqueFileIds = unique(fileIds.filter((fileId) => !Type.isNil(fileId)).map(Number));

			return uniqueFileIds
				.map((fileId) => this.#store.getters['filesModel/getById'](fileId))
				.filter(Boolean);
		}

		/**
		 * Resolves the file a message plays. A builder message keeps its files in the block model, so
		 * the audio element of the block is the second source: it is closed by the option that renders
		 * the audio block, and a file that is not audio itself keeps the message out of the autoplay
		 * queue instead of stopping it on a track no view can play.
		 *
		 * The store is an argument: every dialog audio player owns the store it reads.
		 *
		 * @param {MessengerCoreStore} store
		 * @param {MessagesModelState} message
		 * @param {number|string|null} [preferredFileId]
		 * @return {FilesModelState|null}
		 */
		static resolveAudioFile(store, message, preferredFileId = null)
		{
			if (!Type.isNil(preferredFileId))
			{
				const preferredId = Number(preferredFileId);
				const isMessageFile = message.files?.some((fileId) => Number(fileId) === preferredId) ?? false;
				const isBlockFile = MessageHelper.isAudioBlockFile(store, message, preferredId);
				if (!isMessageFile && !isBlockFile)
				{
					return null;
				}

				const preferredFile = store.getters['filesModel/getById'](preferredId);

				return preferredFile?.type === FileType.audio ? preferredFile : null;
			}

			const messageFileId = message.files?.[0];
			if (messageFileId)
			{
				const messageFile = store.getters['filesModel/getById'](messageFileId);
				if (messageFile?.type === FileType.audio)
				{
					return messageFile;
				}
			}

			if (!Feature.isMessageFileAudioBlockAvailable)
			{
				return null;
			}

			const audioFileId = MessageHelper.getAudioBlockFileId(store, message);
			if (!audioFileId)
			{
				return null;
			}

			const blockFile = store.getters['filesModel/getById'](audioFileId);

			return blockFile?.type === FileType.audio ? blockFile : null;
		}

		/**
		 * @param {MessengerCoreStore} store
		 * @param {MessagesModelState} message
		 * @return {number|null}
		 */
		static getAudioBlockFileId(store, message)
		{
			if (!Feature.isMessageFileAudioBlockAvailable)
			{
				return null;
			}

			const block = store.getters['messagesModel/blockModel/getByMessageId'](message.id);
			const audioElement = block?.elements?.find((element) => element.type === BlockElementType.audio);
			const [audioFileId] = MessageHelper.getBlockElementFileIds(audioElement);

			return audioFileId ?? null;
		}

		/**
		 * @param {MessengerCoreStore} store
		 * @param {MessagesModelState} message
		 * @param {number|string} fileId
		 * @return {boolean}
		 */
		static isAudioBlockFile(store, message, fileId)
		{
			return MessageHelper.getAudioBlockFileId(store, message) === Number(fileId);
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
