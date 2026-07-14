/**
 * @module im/messenger/lib/converter/ui/message/src/message-type-rules
 */
jn.define('im/messenger/lib/converter/ui/message/src/message-type-rules', (require, exports, module) => {
	const {
		TextMessage,
		EmojiOnlyMessage,
		DeletedMessage,
		ImageMessage,
		MediaGalleryMessage,
		AudioMessage,
		VideoMessage,
		FileMessage,
		FileGalleryMessage,
		SystemTextMessage,
		CopilotPromptMessage,
		ErrorMessage,
		CopilotMessage,
		CheckInMessageFactory,
		CreateBannerFactory,
		CallMessageFactory,
		VoteMessageFactory,
		AiAssistantMessage,
		VideoNoteMessage,
		VideoNoteTextMessage,
		StickerMessage,
		DeletedStickerMessage,
		BlockMessageFactory,
		AiBizprocMessage,
		UnsupportedMessage,
	} = require('im/messenger/lib/element/dialog');
	const { Logger } = require('im/messenger/lib/logger');
	const { MessageType } = require('im/messenger/const');

	/** @type {MessageTypeRule} */
	const CopilotPromptMessageRule = {
		type: MessageType.copilotPrompt,
		isSuitable: (helper) => helper.isCopilotCreatePrompt,
		create: (model, options) => new CopilotPromptMessage(model, options),
	};

	/** @type {MessageTypeRule} */
	const CreateBannerMessageRule = {
		type: MessageType.banner,
		isSuitable: (helper) => CreateBannerFactory.checkSuitableForDisplay(helper.getComponentId()),
		create: (model, options) => CreateBannerFactory.create(model, options),
	};

	/** @type {MessageTypeRule} */
	const AiAssistantMessageRule = {
		type: MessageType.aiAssistant,
		isSuitable: (helper) => helper.isAiAssistant,
		create: (model, options) => new AiAssistantMessage(model, options),
	};

	/** @type {MessageTypeRule} */
	const StickerMessageRule = {
		type: MessageType.sticker,
		isSuitable: (helper) => helper.isSticker,
		create: (model, options) => new StickerMessage(model, options),
	};

	/** @type {MessageTypeRule} */
	const DeletedStickerMessageRule = {
		type: MessageType.deleted,
		isSuitable: (helper) => helper.isDeletedSticker,
		create: (model, options) => new DeletedStickerMessage(model, options),
	};

	/** @type {MessageTypeRule} */
	const SystemTextMessageRule = {
		type: MessageType.systemText,
		isSuitable: (helper) => helper.isSystemText,
		create: (model, options) => new SystemTextMessage(model, { ...options, showCommentInfo: false }),
	};

	/** @type {MessageTypeRule} */
	const DeletedMessageRule = {
		type: MessageType.deleted,
		isSuitable: (helper) => helper.isDeleted,
		create: (model, options) => new DeletedMessage(model, options),
	};

	/** @type {MessageTypeRule} */
	const ErrorMessageRule = {
		type: MessageType.error,
		isSuitable: (helper) => helper.isError,
		create: (model, options) => new ErrorMessage(model, options),
	};

	/** @type {MessageTypeRule} */
	const AiBizprocRule = {
		type: MessageType.text,
		isSuitable: (helper) => helper.isAiBizproc,
		create: (model, options) => new AiBizprocMessage(model, options),
	};

	/** @type {MessageTypeRule} */
	const CopilotBlockMessageRule = {
		type: MessageType.block,
		isSuitable: (helper) => helper.isCopilot && helper.isBlock && BlockMessageFactory.checkSuitableForDisplay(),
		create: (model, options) => BlockMessageFactory.createCopilot(model, options),
	};

	/** @type {MessageTypeRule} */
	const BlockMessageRule = {
		type: MessageType.block,
		isSuitable: (helper) => helper.isBlock && BlockMessageFactory.checkSuitableForDisplay(),
		create: (model, options) => BlockMessageFactory.create(model, options),
	};

	/** @type {MessageTypeRule} */
	const CopilotMessageRule = {
		type: MessageType.copilot,
		isSuitable: (helper) => helper.isCopilot,
		create: (model, options) => new CopilotMessage(model, options),
	};

	/** @type {MessageTypeRule} */
	const ConvertCollabSystemTextMessageRule = {
		type: MessageType.systemText,
		isSuitable: (helper) => helper.isConvertCollab,
		create: (model, options) => new SystemTextMessage(model, { ...options, showCommentInfo: false }),
	};

	/** @type {MessageTypeRule} */
	const CheckInMessageRule = {
		type: MessageType.checkIn,
		isSuitable: (helper) => CheckInMessageFactory.checkSuitableForDisplay(helper.getComponentId()),
		create: (model, options) => CheckInMessageFactory.create(model, options),
	};

	/** @type {MessageTypeRule} */
	const MediaGalleryMessageRule = {
		type: MessageType.mediaGallery,
		isSuitable: (helper) => helper.isMediaGallery,
		create: (model, options) => new MediaGalleryMessage(model, options),
	};

	/** @type {MessageTypeRule} */
	const FileGalleryMessageRule = {
		type: MessageType.fileGallery,
		isSuitable: (helper) => helper.isFileGallery,
		create: (model, options) => new FileGalleryMessage(model, options),
	};

	/** @type {MessageTypeRule} */
	const CallMessageRule = {
		type: MessageType.call,
		isSuitable: (helper) => CallMessageFactory.checkSuitableForDisplay(helper.getComponentId()),
		create: (model, options) => CallMessageFactory.create(model, options),
	};

	/** @type {MessageTypeRule} */
	const VoteMessageRule = {
		type: MessageType.vote,
		isSuitable: (helper) => helper.isVote && VoteMessageFactory.checkSuitableForDisplay(helper.getComponentId()),
		create: (model, options) => VoteMessageFactory.create(model, options),
	};

	/** @type {MessageTypeRule} */
	const ImageMessageRule = {
		type: MessageType.image,
		isSuitable: (helper) => helper.isImage,
		create: (model, options) => new ImageMessage(model, options),
	};

	/** @type {MessageTypeRule} */
	const ImageWithoutPreviewMessageRule = {
		type: MessageType.file,
		isSuitable: (helper) => helper.isImageWithoutPreview,
		create: (model, options) => new FileMessage(model, options),
	};

	/** @type {MessageTypeRule} */
	const AudioMessageRule = {
		type: MessageType.audio,
		isSuitable: (helper) => helper.isAudio,
		create: (model, options) => new AudioMessage(model, options),
	};

	/** @type {MessageTypeRule} */
	const VideoMessageRule = {
		type: MessageType.video,
		isSuitable: (helper) => helper.isVideo,
		create: (model, options) => new VideoMessage(model, options),
	};

	/** @type {MessageTypeRule} */
	const VideoNoteTextMessageRule = {
		type: MessageType.videoNoteText,
		isSuitable: (helper) => helper.isVideoNoteText,
		create: (model, options) => new VideoNoteTextMessage(model, options),
	};

	/** @type {MessageTypeRule} */
	const VideoNoteMessageRule = {
		type: MessageType.videoNote,
		isSuitable: (helper) => helper.isVideoNote,
		create: (model, options) => new VideoNoteMessage(model, options),
	};

	/** @type {MessageTypeRule} */
	const FileMessageRule = {
		type: MessageType.file,
		isSuitable: (helper) => helper.isFile,
		create: (model, options) => new FileMessage(model, options),
	};

	/** @type {MessageTypeRule} */
	const TextWithAttachMessageRule = {
		type: MessageType.text,
		isSuitable: (helper) => helper.isWithAttach,
		create: (model, options) => new TextMessage(model, options),
	};

	/** @type {MessageTypeRule} */
	const EmojiOnlyMessageRule = {
		type: MessageType.emojiOnly,
		isSuitable: (helper) => helper.isEmojiOnly || helper.isSmileOnly,
		create: (model, options) => new EmojiOnlyMessage(model, options),
	};

	/** @type {MessageTypeRule} */
	const TextMessageRule = {
		type: MessageType.text,
		isSuitable: (helper) => helper.isText && !helper.isUnsupportedByComponentId,
		create: (model, options) => new TextMessage(model, options),
	};

	/** @type {MessageTypeRule} */
	const UnsupportedMessageRule = {
		type: MessageType.unsupported,
		isSuitable: () => true,
		create: (model, options) => {
			Logger.error(`messageTypeRules returned UnsupportedMessage for messageId: ${model?.id}`);

			return new UnsupportedMessage(model, options);
		},
	};

	/**
	 * @type {MessageTypeRules}
	 */
	const messageTypeRules = [
		CopilotPromptMessageRule,
		CreateBannerMessageRule,
		AiAssistantMessageRule,
		StickerMessageRule,
		DeletedStickerMessageRule,
		CopilotBlockMessageRule,
		BlockMessageRule,
		SystemTextMessageRule,
		DeletedMessageRule,
		ErrorMessageRule,
		AiBizprocRule,
		CopilotMessageRule,
		ConvertCollabSystemTextMessageRule,
		CheckInMessageRule,
		MediaGalleryMessageRule,
		FileGalleryMessageRule,
		CallMessageRule,
		VoteMessageRule,
		ImageMessageRule,
		ImageWithoutPreviewMessageRule,
		AudioMessageRule,
		VideoMessageRule,
		VideoNoteTextMessageRule,
		VideoNoteMessageRule,
		FileMessageRule,
		TextWithAttachMessageRule,
		EmojiOnlyMessageRule,
		TextMessageRule,
		UnsupportedMessageRule,
	];

	module.exports = {
		messageTypeRules,
	};
});
