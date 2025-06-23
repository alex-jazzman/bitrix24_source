/**
 * @module im/messenger/controller/dialog/lib/message-menu/message
 */

jn.define('im/messenger/controller/dialog/lib/message-menu/message', (require, exports, module) => {
	const {
		DialogType,
	} = require('im/messenger/const');
	const { Feature, MobileFeature } = require('im/messenger/lib/feature');
	const { ChatPermission } = require('im/messenger/lib/permission-manager');
	const { MessageHelper, DialogHelper } = require('im/messenger/lib/helper');

	/**
	 * @class MessageMenuMessage
	 * @implements IMessageMenuMessage
	 */
	class MessageMenuMessage
	{
		/** @type {MessageHelper} */
		#messageHelper;
		#dialogHelper;

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
			this.#messageHelper = MessageHelper.createByModel(messageModel, fileModel ?? []);
			this.#dialogHelper = DialogHelper.createByModel(dialogModel);
		}

		isPossibleReact()
		{
			// return this.dialogModel.type !== DialogType.copilot; TODO experimental solution
			return true;
		}

		isPossibleReply()
		{
			if (this.#isChannel() || this.dialogModel.type === DialogType.copilot)
			{
				return false;
			}

			if (Number(this.dialogModel.parentMessageId) === Number(this.messageModel.id))
			{
				return false;
			}

			return ChatPermission.isCanReply(this.dialogModel);
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

		isPossiblePin()
		{
			if (this.dialogModel.type === DialogType.comment)
			{
				return false;
			}

			if (!ChatPermission.isCanPost(this.dialogModel))
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

			if (!ChatPermission.isCanPost(this.dialogModel))
			{
				return false;
			}

			return this.isPinned;
		}

		isPossibleForward()
		{
			return this.dialogModel.type !== DialogType.comment && !this.#isVote();
		}

		isPossibleCreate()
		{
			return !this.#isChannel() && !this.#isVote();
		}

		isPossibleSaveFile()
		{
			return this.#isWithFile() && !this.#isDeleted();
		}

		isPossibleDownloadToDevice()
		{
			return (this.#isSingleFileMessage() && this.isPossibleSaveFile())
				|| (this.isPossibleSaveGallery() && MobileFeature.isMultipleFilesDownloadSupported());
		}

		isPossibleSaveGallery()
		{
			return this.#isGallery() && !this.#isDeleted();
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
			return !this.#isYour() && !this.#isSystem() && !this.isDialogCopilot() && !this.#isBot();
		}

		isPossibleCallFeedback()
		{
			return !this.#isYour() && !this.#isSystem() && this.isDialogCopilot();
		}

		isPossibleMultiselect()
		{
			if (!Feature.isMultiSelectAvailable)
			{
				return false;
			}

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
			if (this.isDialogCopilot())
			{
				return this.#isYour() && !this.#isDeleted() && !this.#isSystem() && !this.#isForward()
					&& !this.#isMessageToCopilot();
			}

			return this.#isYour() && !this.#isDeleted() && !this.#isSystem() && !this.#isForward() && !this.#isVote();
		}

		isPossibleDelete()
		{
			if (this.#isYour())
			{
				return !this.#isDeleted();
			}

			if (ChatPermission.isCanDeleteOtherMessage(this.dialogModel))
			{
				return !this.#isDeleted();
			}

			return false;
		}

		isPossibleSubscribe()
		{
			return (
				this.#isChannel()
				&& !this.isUserSubscribed
				&& !this.#isSystem()
				&& !this.#isEmojiOrSmileOnly()
				&& !this.#isVote()
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

		#isWithFile()
		{
			return this.#messageHelper.isWithFile;
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

		isDialogCopilot()
		{
			return this.dialogModel.type === DialogType.copilot;
		}

		#isBot()
		{
			return this.userModel.bot;
		}

		#isMessageToCopilot()
		{
			return !(this.messageModel.text.includes('[USER') || this.messageModel.text.includes('[user'));
		}

		isAdmin()
		{
			return this.#dialogHelper?.isCurrentUserOwner;
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
			return this.messageModel.files.length === 1;
		}
	}

	module.exports = { MessageMenuMessage };
});
