/**
 * @module im/messenger/provider/push/message-handler/lib/helper
 */
jn.define('im/messenger/provider/push/message-handler/lib/helper', (require, exports, module) => {
	const { Type } = require('type');
	const { DialogType, RecentTab } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	/**
	 * @class PushHelper
	 */
	class PushHelper
	{
		/** @type {MessengerPushEvent} */
		#event;

		/**
		 * @param {MessengerPushEvent} event
		 */
		constructor(event)
		{
			this.#event = event;
		}

		/**
		 *
		 * @return {"message" | "messageChat"}
		 */
		getEventName()
		{
			return this.#event.command;
		}

		/**
		 * @return {number}
		 */
		getCurrentUserId()
		{
			return serviceLocator.get('core').getUserId();
		}

		/**
		 * @return {PushRawMessage}
		 */
		getMessage()
		{
			return this.#event.params.message;
		}

		/**
		 * @return {Array<RawUser>}
		 */
		getUsers()
		{
			return Object.values(this.#event.params.users);
		}

		/**
		 * @return {Array<RawFile>}
		 */
		getFiles()
		{
			return Object.values(this.#event.params.files);
		}

		/**
		 * @return {number}
		 */
		getChatId()
		{
			return this.#event.params.chatId;
		}

		/**
		 * @return {boolean}
		 */
		isChatExist()
		{
			return Boolean(this.getChat());
		}

		/**
		 * @return {PushRawChat|null}
		 */
		getChat()
		{
			const chatId = this.getChatId();

			return this.#event.params.chat?.[chatId] ?? null;
		}

		/**
		 * @return {string}
		 */
		getChatType()
		{
			const chat = this.getChat();

			return chat?.type ?? '';
		}

		/**
		 * @return {DialogId}
		 */
		getDialogId()
		{
			return this.#event.params.dialogId;
		}

		/**
		 * @return {number}
		 */
		getSenderId()
		{
			return this.getMessage().senderId;
		}

		/**
		 * @return {RawUser|{id: number}}
		 */
		getSender()
		{
			const senderId = this.getSenderId();

			return this.#event.params.users?.[senderId] ?? { id: 0 };
		}

		/**
		 * @return {StickerState|null}
		 */
		getSticker()
		{
			if (Type.isPlainObject(this.#event.params.sticker))
			{
				return this.#event.params.sticker;
			}

			return null;
		}

		/**
		 * @return {boolean}
		 */
		isChannelChat()
		{
			return [DialogType.channel, DialogType.openChannel, DialogType.generalChannel].includes(this.getChatType());
		}

		/**
		 * @return {boolean}
		 */
		isOpenChannelChat()
		{
			return this.getChatType() === DialogType.openChannel;
		}

		/**
		 * @return {boolean}
		 */
		isCopilotChat()
		{
			return this.getChatType() === DialogType.copilot;
		}

		/**
		 * @return {boolean}
		 */
		isCollabChat()
		{
			return this.getChatType() === DialogType.collab;
		}

		/**
		 * @return {boolean}
		 */
		isTaskChat()
		{
			return this.getChatType() === DialogType.tasksTask;
		}

		/**
		 * @return {boolean}
		 */
		isLines()
		{
			return !Type.isNil(this.#event.params.lines);
		}

		getRecentSections()
		{
			if (this.isLines())
			{
				return [RecentTab.openlines];
			}

			if (this.isTaskChat())
			{
				return [RecentTab.tasksTask];
			}

			if (this.isCopilotChat())
			{
				return [RecentTab.chat, RecentTab.copilot];
			}

			if (this.isOpenChannelChat())
			{
				return [RecentTab.chat, RecentTab.openChannel];
			}

			if (this.isCollabChat())
			{
				return [RecentTab.chat, RecentTab.collab];
			}

			return [RecentTab.chat];
		}

		/**
		 * @return {boolean}
		 */
		isUserInChat()
		{
			if (Type.isArray(this.#event.params.userInChat))
			{
				return true;
			}

			const chatUsers = this.#event.params.userInChat[this.getChatId()];

			return chatUsers.includes(this.getCurrentUserId());
		}
	}

	module.exports = { PushHelper };
});
