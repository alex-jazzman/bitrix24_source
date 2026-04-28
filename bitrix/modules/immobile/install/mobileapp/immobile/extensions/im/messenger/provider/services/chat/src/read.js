/**
 * @module im/messenger/provider/services/chat/read
 */
jn.define('im/messenger/provider/services/chat/read', (require, exports, module) => {
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { UuidManager } = require('im/messenger/lib/uuid-manager');
	const { LocalReadMessageAction } = require('im/messenger/lib/counters/update-system/action/read-message/local');
	const { getLogger } = require('im/messenger/lib/logger');

	const logger = getLogger('read-service--chat');
	const READ_TIMEOUT = 300;

	/**
	 * @class ReadService
	 */
	class ReadService
	{
		constructor()
		{
			/**
			 * @private
			 * @type{MessengerCoreStore}
			 */
			this.store = serviceLocator.get('core').getStore();

			/**
			 * @private
			 * @type {Record<number, Set<number>>}
			 */
			this.messagesToRead = {};
		}

		/**
		 * @param {number} chatId
		 * @param {string} messageId
		 */
		readMessage(chatId, messageId)
		{
			if (!this.messagesToRead[chatId])
			{
				this.messagesToRead[chatId] = new Set();
			}
			this.messagesToRead[chatId].add(Number(messageId));

			clearTimeout(this.readTimeout);
			this.readTimeout = setTimeout(() => {
				Object.entries(this.messagesToRead).forEach(([queueChatId, messageIds]) => {
					// eslint-disable-next-line no-param-reassign
					queueChatId = Number(queueChatId);
					logger.warn('ReadService: readMessages', messageIds);
					if (messageIds.size === 0)
					{
						return;
					}

					const copiedMessageIds = [...messageIds];
					delete this.messagesToRead[queueChatId];
					const dialogModel = this.#getDialog(queueChatId);
					const unreadMessageList = this.#getUnreadMessageIdList(copiedMessageIds);

					serviceLocator.get('counters-update-system').dispatch(new LocalReadMessageAction({
						chatId: queueChatId,
						messageIdList: copiedMessageIds,
						lastReadId: dialogModel.lastReadId,
						unreadMessages: unreadMessageList,
						actionUuid: UuidManager.getInstance().getActionUuid(),
						lastMessageId: dialogModel.lastMessageId,
					}));
					this.#markedMessagesAsRead(queueChatId, copiedMessageIds);
				});
			}, READ_TIMEOUT);
		}

		/**
		 * @param {number} chatId
		 * @param {Array<number>} messageIds
		 * @returns {Promise<any>}
		 */
		#markedMessagesAsRead(chatId, messageIds)
		{
			const maxMessageId = Math.max(...messageIds);
			const dialog = this.store.getters['dialoguesModel/getByChatId'](chatId);
			if (maxMessageId > dialog.lastReadId)
			{
				this.store.dispatch('dialoguesModel/update', {
					dialogId: dialog.dialogId,
					fields: {
						lastId: maxMessageId,
					},
				});
			}

			return this.store.dispatch('messagesModel/readMessages', {
				chatId,
				messageIds,
			});
		}

		/**
		 * @param {number} chatId
		 * @returns {?DialoguesModelState}
		 */
		#getDialog(chatId)
		{
			return  this.store.getters['dialoguesModel/getByChatId'](chatId);
		}

		/**
		 * @param {Array<number>} messageIdList
		 * @return {Array<number>}
		 */
		#getUnreadMessageIdList(messageIdList)
		{
			return this.store.getters['messagesModel/getListByIds'](messageIdList)
				.filter((message) => message.unread === true)
				.map((message) => message.id)
			;
		}
	}

	module.exports = {
		ReadService,
	};
});
