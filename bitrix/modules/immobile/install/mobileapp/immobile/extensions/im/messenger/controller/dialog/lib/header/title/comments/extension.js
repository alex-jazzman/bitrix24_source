/**
 * @module im/messenger/controller/dialog/lib/header/title/comments
 */
jn.define('im/messenger/controller/dialog/lib/header/title/comments', (require, exports, module) => {
	const { Type } = require('type');
	const { ChatTitle } = require('im/messenger/lib/element/chat-title');
	const { ChatAvatar } = require('im/messenger/lib/element/chat-avatar');
	const { applyAppStatusToTitleParams } = require('im/messenger/controller/dialog/lib/header/title/status');

	/**
	 * @class CommentsHeaderTitle
	 * @implements IDialogHeaderTitle
	 */
	class CommentsHeaderTitle
	{
		/**
		 * @param {() => DialoguesModelState} getDialog
		 * @param {RelatedEntityData} relatedEntity
		 */
		constructor({ getDialog, relatedEntity })
		{
			/** @protected @type {() => DialoguesModelState} */
			this.getDialog = getDialog;

			/** @protected @type {RelatedEntityData} */
			this.relatedEntity = relatedEntity;
		}

		/**
		 * @return JNWidgetTitleParams
		 */
		createTitleParams()
		{
			const dialogId = this.getDialog()?.dialogId || this.relatedEntity.customData.dialogId;
			const avatar = ChatAvatar.createForComment(dialogId);
			const title = ChatTitle.createForComment(dialogId, {
				parentChannelName: this.#getParentChannelName(),
			});

			const result = {
				...avatar.getTitleParams(),
				...title.getTitleParams({
					useNotes: true,
				}),
			};

			applyAppStatusToTitleParams(result);

			return result;
		}

		/**
		 * @return {string}
		 */
		#getParentChannelName()
		{
			const parentChatName = this.relatedEntity?.customData?.parentChatName;
			if (Type.isStringFilled(parentChatName))
			{
				return parentChatName;
			}

			const parentChannelChatId = this.relatedEntity?.id;
			if (!parentChannelChatId)
			{
				return '';
			}

			const parentTitle = ChatTitle.createFromDialogId(`chat${parentChannelChatId}`);

			return parentTitle.getTitle();
		}
	}

	module.exports = {
		CommentsHeaderTitle,
	};
});
