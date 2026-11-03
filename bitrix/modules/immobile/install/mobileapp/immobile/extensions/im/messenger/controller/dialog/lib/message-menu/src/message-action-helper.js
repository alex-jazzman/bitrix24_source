/**
 * @module im/messenger/controller/dialog/lib/message-menu/src/message-action-helper
 */

jn.define('im/messenger/controller/dialog/lib/message-menu/src/message-action-helper', (require, exports, module) => {
	const { isModuleInstalled } = require('module');
	const {
		DialogType,
		ActionByUserType,
		MessageComponent,
	} = require('im/messenger/const');

	const { Feature, MobileFeature } = require('im/messenger/lib/feature');
	const { ChatPermission, UserPermission } = require('im/messenger/lib/permission-manager');
	const { MessageHelper, DialogHelper } = require('im/messenger/lib/helper');

	/**
	 * @class MessageMenuActionHelper
	 * @implements IMessageMenuActionHelper
	 */
	class MessageMenuActionHelper
	{
		/** @type {MessageHelper} */
		#messageHelper;
		/** @type {DialogHelper} */
		#dialogHelper;
		/** @type {number|undefined} */
		#fileCount;

		/**
		 * @param {MessagesModelState} messageModel
		 * @param {FilesModelState || undefined} fileModel
		 * @param {DialoguesModelState} dialogModel
		 * @param {UsersModelState} userModel
		 * @param {boolean} isPinned
		 * @param {boolean} isUserSubscribed
		 */
		constructor({
			messageModel,
			fileModel,
			dialogModel,
			userModel,
			isPinned,
			isUserSubscribed,
		})
		{
			this.messageModel = messageModel;
			this.fileModel = fileModel;
			this.dialogModel = dialogModel;
			this.userModel = userModel;
			this.isPinned = isPinned;
			this.isUserSubscribed = isUserSubscribed;
			this.#messageHelper = MessageHelper.createByModel(messageModel);
			this.#dialogHelper = DialogHelper.createByModel(dialogModel);
		}

		isPossibleReact()
		{
			if (this.#dialogHelper.isBot && this.#isYour())
			{
				return false;
			}

			if (this.#isCopilot())
			{
				return true;
			}

			if (this.#isBot())
			{
				return UserPermission.canBotSetReactions(this.userModel);
			}

			return true;
		}

		isPossibleReply()
		{
			if (this.#isChannel())
			{
				return false;
			}

			if (Number(this.dialogModel.parentMessageId) === Number(this.messageModel.id))
			{
				return false;
			}

			return ChatPermission.canReply(this.dialogModel);
		}

		/**
		 * CAP-01: Public helper — gate for UI affordances that lead to reply-with-media scenarios
		 * (e.g. file/image/video attach options shown while in reply mode).
		 * Returns true only when both native build and server support media reply
		 * (Feature.isReplyWithMediaAvailable = native chat_reply_with_media && server FEAT-01).
		 * Regular text reply (isPossibleReply) is NOT affected — no regression on AC-022.
		 *
		 * Active protection: send-side degradation in sendFilesWithText already suppresses the
		 * replyId when the flag is off. On mobile, reply is a unified action (enter reply mode,
		 * then optionally attach) — there is no separate "reply-with-media" menu item to gate today.
		 * This method is the designated hook point for that gate once native-side integration
		 * exposes a dedicated reply-with-media affordance or menu entry (planned Q-3 native integration).
		 * @returns {boolean}
		 */
		isPossibleReplyWithMedia()
		{
			return this.isPossibleReply() && Feature.isReplyWithMediaAvailable;
		}

		isPossibleCopy()
		{
			if (this.isDialogCopilot())
			{
				return this.#isText() && !this.#isDeleted();
			}

			return this.#isText() && !this.#isVote();
		}

		isPossibleCopyLink()
		{
			return !this.isDialogCopilot() && !this.#isComment();
		}

		isPossibleMark()
		{
			if (this.dialogModel.type === DialogType.comment)
			{
				return false;
			}

			if (!this.#isViewed() || this.#isYour())
			{
				return false;
			}

			return Number(this.messageModel.id) !== Number(this.dialogModel.markedId);
		}

		isPossiblePin()
		{
			if (this.dialogModel.type === DialogType.comment)
			{
				return false;
			}

			if (!ChatPermission.canPost(this.dialogModel))
			{
				return false;
			}

			return !this.isPinned;
		}

		isPossibleUnpin()
		{
			if (this.dialogModel.type === DialogType.comment)
			{
				return false;
			}

			if (!ChatPermission.canPost(this.dialogModel))
			{
				return false;
			}

			return this.isPinned;
		}

		isPossibleForward()
		{
			if (this.#isVote())
			{
				return false;
			}

			// a vote inside a discussion stays unavailable whatever the feature says: the ban on votes
			// is ours and does not depend on the server, which would let one through
			return this.dialogModel.type !== DialogType.comment || Feature.isChatThreadsAvailable;
		}

		isPossibleCreate()
		{
			if (this.#isChannel())
			{
				return false;
			}

			return !this.#isDeleted()
				&& !this.#isVote()
				&& !this.#isSticker()
				&& !this.#isDeletedSticker()
			;
		}

		isPossibleTaskCreate()
		{
			return this.isPossibleCreate()
				&& Feature.isMultilevelMessageMenuSupported
				&& isModuleInstalled('tasks')
				&& UserPermission.canPerformActionByUserType(ActionByUserType.createAnyTask);
		}

		isPossibleAiTaskCreate()
		{
			// The server refuses a system message as an unsupported source, so the item is kept out of
			// the menu rather than offered and answered with a toast. Excluded here and not in
			// isPossibleCreate(): the neighbouring create items go to services with rules of their own.
			return this.isPossibleCreate()
				&& !this.#isSystem()
				&& Feature.isAiTaskCreationFromMessagesEntryPointAvailable;
		}

		isPossibleEventCreate()
		{
			return this.isPossibleCreate()
				&& Feature.isMultilevelMessageMenuSupported
				&& isModuleInstalled('calendar')
				&& UserPermission.canPerformActionByUserType(ActionByUserType.createCalendarEvent);
		}

		isPossibleSaveFile()
		{
			return this.#getFileCount() > 0 && !this.#isDeleted() && !this.#isVideoNote();
		}

		isPossibleSaveToDisk()
		{
			return this.isPossibleSaveFile()
				&& UserPermission.canPerformActionByUserType(ActionByUserType.saveFileToDisk);
		}

		isPossibleDownloadToDevice()
		{
			if (this.#isVideoNote())
			{
				return false;
			}

			return (this.#isSingleFileMessage() && this.isPossibleSaveFile())
				|| (this.isPossibleSaveSeveralFiles() && this.#isSeveralFilesDownloadPossible());
		}

		/**
		 * Several files to act on at once. The message keeps its own attachments and the files of its
		 * blocks in different places, so the count comes from the file source of the menu, not from
		 * the attachment list alone. Unlike `#isGallery()`, which looks at the attachments only.
		 *
		 * @returns {boolean}
		 */
		isPossibleSaveSeveralFiles()
		{
			return this.#getFileCount() > 1 && !this.#isDeleted();
		}

		isPossibleSaveToLibrary()
		{
			return this.isPossibleSaveMediaToLibrary() && !this.#isGallery();
		}

		isPossibleSaveMediaToLibrary()
		{
			return (this.#isImage() || this.#isVideo() || this.#isAudio()) && !this.#isDeleted();
		}

		isPossibleShowProfile()
		{
			return !this.#isYour()
				&& !this.#isSystem()
				&& !this.isDialogCopilot()
				&& !this.#isBot()
				&& UserPermission.canPerformActionByUserType(ActionByUserType.openProfile)
				&& UserPermission.canPerformActionByUserType(ActionByUserType.openProfile, this.userModel);
		}

		isPossibleCallFeedback()
		{
			return !this.#isYour() && !this.#isSystem() && (this.isDialogCopilot() || this.isAiAssistantMessage());
		}

		isPossibleMultiselect()
		{
			if (this.dialogModel.type === DialogType.comment)
			{
				return false;
			}

			if (this.#isVote())
			{
				return false;
			}

			return !this.messageModel.sending;
		}

		isPossibleEdit()
		{
			if (this.isDialogCopilot() && this.#isMessageToCopilot())
			{
				return false;
			}

			// CAP-02: a video note is editable only where its caption is rendered
			return this.#isYour()
				&& !this.#isDeleted()
				&& !this.#isSystem()
				&& !this.#isForward()
				&& !this.#isVote()
				&& (!this.#isVideoNote() || Feature.isVideoNoteCaptionAvailable)
				&& !this.#isSticker()
				&& !this.#isDeletedSticker()
				&& !this.#isBlock()
				&& !this.#isContact()
			;
		}

		isPossibleDelete()
		{
			const canDeleteOtherMessage = ChatPermission.canDeleteOtherMessage(this.dialogModel);

			if (this.#isYour())
			{
				if (this.#isDeleted())
				{
					return false;
				}

				return ChatPermission.canDeleteOwnMessage(this.dialogModel);
			}

			return canDeleteOtherMessage;
		}

		isPossibleSubscribe()
		{
			return (
				this.#isChannel()
				&& !this.isUserSubscribed
				&& !this.#isSystem()
				&& !this.#isEmojiOrSmileOnly()
				&& !this.#isVote()
				&& !this.#isSticker()
				&& !this.#isDeletedSticker()
			);
		}

		isPossibleUnsubscribe()
		{
			return (
				this.#isChannel()
				&& this.isUserSubscribed
				&& !this.#isSystem()
				&& !this.#isEmojiOrSmileOnly()
				&& !this.#isVote()
				&& !this.#isSticker()
				&& !this.#isDeletedSticker()
			);
		}

		isPossibleResend()
		{
			return this.#isSendError();
		}

		isPossibleFinishVote()
		{
			return (
				Feature.isVoteMessageAvailable
				&& this.#isYour()
				&& this.#isVoteModelExist()
				&& !this.#isFinishedVote()
			);
		}

		isPossibleRevote()
		{
			return (
				Feature.isVoteMessageAvailable
				&& this.#isVotedVote()
				&& this.#isRevotingVote()
				&& !this.#isFinishedVote()
			);
		}

		isPossibleOpenVoteResult()
		{
			return (
				Feature.isVoteMessageAvailable
				&& this.#isYour()
				&& this.#isVoteModelExist()
				&& !this.#isEmptyVote()
			);
		}

		isPossibleAskCopilot()
		{
			if (!Feature.isCopilotMentionAvailable)
			{
				return false;
			}

			if (!this.#dialogHelper?.isCopilotMentionSupported)
			{
				return false;
			}

			if (
				this.#isSticker()
				|| this.#isDeletedSticker()
			)
			{
				return false;
			}

			return ChatPermission.canReply(this.dialogModel);
		}

		#isDeleted()
		{
			return this.#messageHelper.isDeleted;
		}

		#isForward()
		{
			return this.#messageHelper.isForward;
		}

		#isGallery()
		{
			return this.#messageHelper.isGallery;
		}

		/**
		 * Number of files the menu actions work on: the attachments of the message plus the files of
		 * its blocks. A file id without a model in the store is not counted, because no action can
		 * reach such a file. Memoized for the lifetime of the helper, which is one menu build: both
		 * halves of the file set behind the count are memoized by the message helper the same way.
		 *
		 * @returns {number}
		 */
		#getFileCount()
		{
			this.#fileCount ??= this.#messageHelper.getAllFiles().length;

			return this.#fileCount;
		}

		#isVideo()
		{
			return this.#messageHelper.isVideo;
		}

		#isImage()
		{
			return this.#messageHelper.isImage;
		}

		#isAudio()
		{
			return this.#messageHelper.isAudio;
		}

		#isSystem()
		{
			return this.#messageHelper.isSystem;
		}

		#isText()
		{
			return this.#messageHelper.isText;
		}

		#isViewed()
		{
			return this.#messageHelper.isViewed;
		}

		#isYour()
		{
			return this.#messageHelper.isYour;
		}

		#isVote()
		{
			return this.#messageHelper.isVote;
		}

		#isVoteModelExist()
		{
			return this.#messageHelper.isVoteModelExist;
		}

		#isFinishedVote()
		{
			return this.#messageHelper.isFinishedVote;
		}

		#isVotedVote()
		{
			return this.#messageHelper.isVotedVote;
		}

		#isRevotingVote()
		{
			return this.#messageHelper.isRevotingVote;
		}

		#isEmptyVote()
		{
			return this.#messageHelper.isEmptyVote;
		}

		#isVideoNote()
		{
			return this.#messageHelper.isVideoNote;
		}

		#isSticker()
		{
			return this.#messageHelper.isSticker;
		}

		#isDeletedSticker()
		{
			return this.#messageHelper.isDeletedSticker;
		}

		#isBlock()
		{
			return this.#messageHelper.isBlock;
		}

		#isContact()
		{
			return this.#messageHelper.getComponentId() === MessageComponent.contact;
		}

		isDialogCopilot()
		{
			return this.dialogModel.type === DialogType.copilot;
		}

		isAiAssistantMessage()
		{
			return this.#messageHelper.isAiAssistant;
		}

		#isBot()
		{
			return Boolean(this.userModel?.bot);
		}

		#isCopilot()
		{
			return this.#messageHelper.isCopilot;
		}

		#isMessageToCopilot()
		{
			return !(this.messageModel.text.includes('[USER') || this.messageModel.text.includes('[user'));
		}

		isAdmin()
		{
			return this.#dialogHelper?.isCurrentUserOwner;
		}

		isManager()
		{
			return this.#dialogHelper?.isCurrentUserManager;
		}

		#isChannel()
		{
			return this.#dialogHelper?.isChannel;
		}

		#isComment()
		{
			return this.#dialogHelper?.isComment;
		}

		#isEmojiOrSmileOnly()
		{
			return this.#messageHelper.isEmojiOnly || this.#messageHelper.isSmileOnly;
		}

		#isSendError()
		{
			return this.messageModel.error === true;
		}

		#isSingleFileMessage()
		{
			return this.#getFileCount() === 1;
		}

		#isSingleAttachmentMessage()
		{
			return this.#messageHelper.files.length === 1;
		}

		/**
		 * Several files reach the device only when the native build downloads them at once (API 60+).
		 * Below that a message is saved when it carries a single attachment of its own — a block
		 * message never gets there, its native support ('chat_builder') is newer than API 60.
		 *
		 * @returns {boolean}
		 */
		#isSeveralFilesDownloadPossible()
		{
			return MobileFeature.isMultipleFilesDownloadSupported() || this.#isSingleAttachmentMessage();
		}
	}

	module.exports = { MessageMenuActionHelper };
});
