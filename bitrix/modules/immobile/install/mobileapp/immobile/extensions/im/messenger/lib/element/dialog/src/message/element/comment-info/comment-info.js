/**
 * @module im/messenger/lib/element/dialog/message/element/comment-info/comment-info
 */
jn.define('im/messenger/lib/element/dialog/message/element/comment-info/comment-info', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { Type } = require('type');

	const { defaultUserIcon } = require('im/messenger/assets/common');
	const { Theme } = require('im/lib/theme');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { ColorUtils } = require('im/messenger/lib/utils');
	const { ChatAvatar } = require('im/messenger/lib/element/chat-avatar');

	/**
	 * @class CommentInfo
	 */
	class CommentInfo
	{
		/** @type {number} */
		#channelId;
		/** @type {?CommentInfoModelState} */
		#commentInfo;

		/**
		 * @param {number} messageId
		 * @param {number} channelId
		 * @returns {CommentInfo}
		 */
		static createByMessagesModel({ messageId, channelId })
		{
			const commentInfo = serviceLocator.get('core').getStore()
				.getters['commentModel/getByMessageId']?.(messageId)
			;

			return new this({ commentInfo, channelId });
		}

		/**
		 * @param {?CommentInfoModelState} commentInfo
		 * @param {number} channelId
		 */
		constructor({ commentInfo, channelId })
		{
			this.#commentInfo = commentInfo;
			this.#channelId = channelId;
		}

		/**
		 * @return {CommentInfoMessageFormat}
		 */
		toMessageFormat()
		{
			if (!this.#commentInfo)
			{
				return {
					title: this.#getDefaultTitle(),
					totalCounter: 0,
					showLoader: false,
				};
			}

			const unreadCounter = this.#getUnreadCounter();

			return {
				title: this.#getTitle(unreadCounter),
				totalCounter: this.#getTotalCounter(),
				unreadCounter,
				users: this.#getUsers(),
				showLoader: this.#commentInfo.showLoader,
			};
		}

		/**
		 * @param {null | {color: string, value: string}} unreadCounter
		 */
		#getTitle(unreadCounter)
		{
			const totalCounter = this.#getTotalCounter();

			if (totalCounter === 0 && Type.isNil(unreadCounter))
			{
				return this.#getDefaultTitle();
			}

			if (totalCounter === 0 && unreadCounter)
			{
				return this.#getEmptyWithCounterTitle();
			}

			return Loc.getMessagePlural('IMMOBILE_ELEMENT_DIALOG_MESSAGE_COMMENT_COUNT', totalCounter, {
				'#COUNT#': totalCounter,
			});
		}

		/**
		 * @return {string}
		 */
		#getDefaultTitle()
		{
			return Loc.getMessage('IMMOBILE_ELEMENT_DIALOG_MESSAGE_COMMENT');
		}

		/**
		 * @return {string}
		 */
		#getEmptyWithCounterTitle()
		{
			return Loc.getMessage('IMMOBILE_ELEMENT_DIALOG_MESSAGE_COMMENT_HAS_COMMENTS');
		}

		/**
		 * @returns {null | {color: string, value: string}}
		 */
		#getUnreadCounter()
		{
			const store = serviceLocator.get('core').getStore();
			const unreadCounter = store.getters['counterModel/getCounterByChatId'](this.#commentInfo.chatId);
			if (unreadCounter === 0)
			{
				return null;
			}

			return {
				color: Theme.colors.accentMainSuccess,
				value: `+${unreadCounter}`,
			};
		}

		#getTotalCounter()
		{
			// remove a first system message from count
			return this.#commentInfo.messageCount > 0
				? this.#commentInfo.messageCount - 1
				: 0
			;
		}

		/**
		 * @returns {null | Array<{imageUrl: string, defaultIconSvg: string}>}
		 */
		#getUsers()
		{
			const users = serviceLocator.get('core').getStore()
				.getters['usersModel/getByIdList'](this.#commentInfo.lastUserIds)
			;

			if (!Type.isArrayFilled(users))
			{
				return null;
			}

			const colorUtils = new ColorUtils();

			return users.map((user) => {
				const chatAvatar = ChatAvatar.createFromDialogId(user.id);
				const result = {
					avatar: chatAvatar.getMessageCommentInfoAvatarProps(),
				};

				if (user.avatar !== '')
				{
					/** @deprecated */
					result.imageUrl = user.avatar;

					return result;
				}

				const color = Type.isStringFilled(chatAvatar.getColor())
					? chatAvatar.getColor()
					: colorUtils.getColorByNumber(user.id)
				;

				result.defaultIconSvg = defaultUserIcon(color);

				return result;
			});
		}
	}

	module.exports = { CommentInfo };
});
