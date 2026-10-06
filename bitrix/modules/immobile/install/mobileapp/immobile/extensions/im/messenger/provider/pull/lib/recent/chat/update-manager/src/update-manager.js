/**
 * @module im/messenger/provider/pull/lib/recent/chat/update-manager/update-manager
 */
jn.define('im/messenger/provider/pull/lib/recent/chat/update-manager/update-manager', (require, exports, module) => {
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { RecentDataConverter } = require('im/messenger/lib/converter/data/recent');

	/**
	 * @class ChatRecentUpdateManager
	 */
	class ChatRecentUpdateManager
	{
		/** @type {RecentUpdateParams} */
		#params;
		/** @type {MessengerCoreStore} */
		#store;

		/**
		 * @param {RecentUpdateParams} params
		 */
		constructor(params)
		{
			this.#params = params;
			this.#store = serviceLocator.get('core').getStore();
		}

		setLastMessageInfo()
		{
			this.#setMessageChat();
			this.#setSourceChats();
			this.#setUsers();
			this.#setFiles();
			this.#setMessage();
		}

		getDialogId()
		{
			return this.#params.chat.dialogId;
		}

		getParentChatId()
		{
			return this.#params.chat?.parent_chat_id ?? 0;
		}

		getLastMessageId()
		{
			return this.getLastMessage().id;
		}

		/**
		 * @return {RawMessage} // todo check types
		 */
		getLastMessage()
		{
			return {
				...this.#params.message,
			};
		}

		/**
		 * @return {Partial<RawMessage>} // todo check types
		 */
		getPreparedLastMessage()
		{
			const message = this.getLastMessage();
			const currentUserId = serviceLocator.get('core').getUserId();
			message.status = message.author_id === currentUserId ? 'received' : '';
			message.senderId = message.author_id;

			return message;
		}

		/**
		 * @return {RecentModelState}
		 */
		getPreparedRecentItem()
		{
			const message = this.getPreparedLastMessage();

			const userData = (message.author_id > 0
				? this.#params.users.find((user) => Number(user.id) === message.author_id)
				: null) ?? { id: 0 };

			// own is not emitted in the realtime RecentUpdate; the client holds it itself, so we leave the key off.
			return RecentDataConverter.fromPullToModel({
				id: this.getDialogId(),
				chat: this.#params.chat,
				user: userData,
				lastActivityDate: this.#params.lastActivityDate,
				message,
			});
		}

		#setUsers()
		{
			this.#store.dispatch('usersModel/set', this.#params.users);
		}

		#setFiles()
		{
			this.#store.dispatch('filesModel/set', this.#params.files);
		}

		#setMessageChat()
		{
			const chat = {
				...this.#params.chat,
				dialogId: this.getDialogId(),
			};

			this.#store.dispatch('dialoguesModel/set', chat);
		}

		#setMessage()
		{
			const lastChannelPost = this.getLastMessage();

			// The recentUpdate preview payload carries no read fields (unread/viewed), and
			// messagesModel/store replaces the element with defaults. A message already living in
			// the model keeps its actual read state authoritative: re-storing the bare payload would
			// mark a still-unread message of an open dialog as viewed and hide it from the read gate.
			const existingMessage = this.#store.getters['messagesModel/getById'](lastChannelPost.id);
			if ('id' in existingMessage)
			{
				return;
			}

			this.#store.dispatch('messagesModel/store', lastChannelPost);
		}

		/**
		 * Persists child source chats (set, with DB persist) so getByChatId(message.chatId)
		 * resolves on cold start. set keeps wasCompletelySync false, so opening the source
		 * chat still triggers a full server load.
		 */
		#setSourceChats()
		{
			const chats = this.#params.chats;
			if (!chats || typeof chats !== 'object')
			{
				return;
			}

			const mainChatId = this.#params.chat?.id;
			const sourceChats = [];

			Object.entries(chats).forEach(([chatIdStr, chatData]) => {
				const chatId = Number(chatIdStr);

				// Main chat is already handled by #setMessageChat().
				if (chatId > 0 && chatId !== mainChatId && chatData && typeof chatData === 'object')
				{
					const dialogId = chatData.dialogId ?? `chat${chatId}`;
					sourceChats.push({
						...chatData,
						chatId,
						dialogId,
					});
				}
			});

			if (sourceChats.length > 0)
			{
				this.#store.dispatch('dialoguesModel/set', sourceChats);
			}
		}
	}

	module.exports = { ChatRecentUpdateManager };
});
