/**
 * @module im/messenger/provider/push/message-handler/base
 */
jn.define('im/messenger/provider/push/message-handler/base', (require, exports, module) => {
	const { Type } = require('type');
	const {
		DialogType,
		MessageStatus,
		CounterType,
	} = require('im/messenger/const');
	const { RecentDataConverter } = require('im/messenger/lib/converter/data/recent');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	const { PushHelper } = require('im/messenger/provider/push/message-handler/lib/helper');
	const { getLogger } = require('im/messenger/lib/logger');

	const logger = getLogger('push-handler');

	/**
	 * @class BasePushMessageHandler
	 */
	class BasePushMessageHandler
	{
		/**
		 * @return {MessengerCoreStore}
		 */
		get store()
		{
			return serviceLocator.get('core').getStore();
		}

		/**
		 * @abstract
		 * @param {Array<MessengerPushEvent>} eventList
		 * @return {Array<MessengerPushEvent>}
		 */
		filterMessageEvents(eventList)
		{
			throw new Error('should implements this method');
		}

		/**
		 * @param {Array<MessengerPushEvent>} eventList
		 * @return {Promise<void>}
		 */
		async handleMessageBatch(eventList)
		{
			const componentEventList = this.filterMessageEvents(eventList);
			if (componentEventList.length === 0)
			{
				return;
			}
			logger.log(`${this.className}.handleMessageBatch`, eventList);
			const modelData = this.prepareData(eventList);
			try
			{
				await this.setData(modelData);
			}
			catch (error)
			{
				logger.error(`${this.className}.handleMessageBatch error`, error);
			}
			logger.warn(`${this.className} handleMessageBatch completed`);
		}

		async setData(modelData)
		{
			await this.setUsers(modelData.users);
			await this.setDialogs(modelData.dialogs);
			await this.setFiles(modelData.files);
			await this.setStickers(modelData.stickers);
			await this.setMessages(modelData.messages);
			await this.setCounters(modelData.counters);
			await this.setRecent(modelData.recent);
		}

		async setDialogs(dialogs = [])
		{
			if (!Type.isArrayFilled(dialogs))
			{
				return;
			}

			await this.store.dispatch('dialoguesModel/setFromPush', dialogs);
		}

		async setUsers(users = [])
		{
			if (!Type.isArrayFilled(users))
			{
				return;
			}

			await this.store.dispatch('usersModel/setFromPush', users);
		}

		async setFiles(files = [])
		{
			if (!Type.isArrayFilled(files))
			{
				return;
			}

			await this.store.dispatch('filesModel/setFromPush', files);
		}

		async setMessages(messages = [])
		{
			if (!Type.isArrayFilled(messages))
			{
				return;
			}

			await this.store.dispatch('messagesModel/setFromPush', messages);
		}

		/**
		 * @abstract
		 * @param recentItems
		 * @return {Promise<void>}
		 */
		async setRecent(recentItems = [])
		{
			throw new Error('You must implement setRecent() method.');
		}

		/**
		 * @abstract
		 * @param {Array<StickerState>} stickers
		 * @return {Promise<void>}
		 */
		async setStickers(stickers = [])
		{
			throw new Error('You must implement setStickers() method.');
		}

		/**
		 * @abstract
		 * @param {Array<CounterModelState>} counters
		 * @return {Promise<void>}
		 */
		async setCounters(counters = [])
		{
			throw new Error('You must implement setCounters() method.');
		}

		/**
		 * @param {Array<MessengerPushEvent>} componentEventList
		 * @param componentEventList
		 */
		prepareData(componentEventList)
		{
			const items = this.prepareEventWithHelperList(componentEventList);

			return {
				dialogs: this.prepareDialogs(items),
				users: this.prepareUsers(items),
				files: this.prepareFiles(items),
				messages: this.prepareMessages(items),
				recent: this.prepareRecentItems(items),
				stickers: this.prepareStickers(items),
				counters: this.prepareCounters(items),
			};
		}

		/**
		 * @param {Array<{event: MessengerPushEvent, helper: PushHelper}>} items
		 * @return {Array<RawChat>}
		 */
		prepareDialogs(items)
		{
			const dialogCollection = {};

			for (const { event, helper } of items)
			{
				let dialog = null;
				if (helper.isChatExist())
				{
					dialog = this.prepareGroupChat(event, helper);
				}
				else
				{
					dialog = this.prepareUserChat(event, helper);
				}

				dialogCollection[dialog.dialogId] = dialog;
			}

			return Object.values(dialogCollection);
		}

		/**
		 * @param {Array<{event: MessengerPushEvent, helper: PushHelper}>} items
		 * @return {Array<RawUser>}
		 */
		prepareUsers(items)
		{
			const userCollection = {};

			for (const { helper } of items)
			{
				helper.getUsers().forEach((user) => {
					userCollection[user.id] = user;
				});
			}

			return Object.values(userCollection);
		}

		/**
		 * @param {Array<{event: MessengerPushEvent, helper: PushHelper}>} items
		 * @return {Array<RawFile>}
		 */
		prepareFiles(items)
		{
			const filesCollection = {};

			for (const { helper } of items)
			{
				helper.getFiles().forEach((file) => {
					filesCollection[file.id] = file;
				});
			}

			return Object.values(filesCollection);
		}

		/**
		 * @param {Array<{event: MessengerPushEvent, helper: PushHelper}>} items
		 * @return {Array<RawMessage>}
		 */
		prepareMessages(items)
		{
			const messages = [];

			for (const { helper } of items)
			{
				const message = helper.getMessage();

				// if params are empty then they have an array type.
				if (Type.isPlainObject(message.params) && Type.isArrayFilled(message.params?.FILE_ID))
				{
					message.params.FILE_ID = message.params.FILE_ID.map((fileId) => Number(fileId));
				}

				messages.push({
					...message,
				});
			}

			return messages;
		}

		/**
		 * @param {Array<{event: MessengerPushEvent, helper: PushHelper}>} items
		 * @return {Array<object>}
		 */
		prepareRecentItems(items)
		{
			const recentCollection = {};

			for (const { event, helper } of items)
			{
				const message = this.prepareRecentMessage({ event, helper });

				const recentItem = RecentDataConverter.fromPushToModel({
					id: helper.getDialogId(),
					chat: helper.getChat(),
					user: helper.getSender(),
					lines: event.params.lines, // undefined it's OK
					counter: event.params.counter,
					liked: false,
					lastActivityDate: event.params.message.date,
					dateMessage: event.params.message.date,
					message,
				});

				recentCollection[recentItem.id] = recentItem;
			}

			return Object.values(recentCollection);
		}

		/**
		 * @desc the method returns an array of unique stickers
		 * @param {Array<{event: MessengerPushEvent, helper: PushHelper}>} items
		 * @return {Array<StickerState>}
		 */
		prepareStickers(items)
		{
			const stickerCollection = {};

			for (const { helper } of items)
			{
				const sticker = helper.getSticker();
				if (Type.isNil(sticker))
				{
					continue;
				}
				const stickerId = `${sticker.packId}|${sticker.packType}|${sticker.id}`;

				stickerCollection[stickerId] = sticker;
			}

			return Object.values(stickerCollection);
		}

		/**
		 * @param {Array<{event: MessengerPushEvent, helper: PushHelper}>} items
		 * @return {Array<CounterModelState>}
		 */
		prepareCounters(items)
		{
			/**
			 * @type {Record<number, CounterModelState>}
			 */
			const counterCollection = {};

			for (const { event, helper } of items)
			{
				const { params } = event;
				const chatId = helper.getChatId();

				counterCollection[chatId] = {
					chatId,
					parentChatId: 0,
					counter: params.counter,
					recentSections: helper.getRecentSections(),
					isMuted: false,
				};
			}

			return Object.values(counterCollection);
		}

		/**
		 * @param {{event: MessengerPushEvent, helper: PushHelper}} item
		 * @return {PushRawMessage & {status: string}}
		 */
		prepareRecentMessage({ helper })
		{
			const messageStatus = helper.getSenderId() === helper.getCurrentUserId()
				? MessageStatus.received
				: ''
			;

			return {
				...helper.getMessage(),
				status: messageStatus,
			};
		}

		get className()
		{
			return this.constructor.name;
		}

		/**
		 * @param {MessengerPushEvent} event
		 * @return {PushHelper}
		 */
		getHelper(event)
		{
			return new PushHelper(event);
		}

		/**
		 * @param {MessengerPushEvent} event
		 * @param {PushHelper} helper
		 */
		prepareGroupChat(event, helper)
		{
			const { params } = event;

			return {
				...helper.getChat(),
				dialogId: params.dialogId,
				counter: params.counter,
			};
		}

		/**
		 * @param {MessengerPushEvent} event
		 * @param {PushHelper} helper
		 */
		prepareUserChat(event, helper)
		{
			const { params } = event;

			const sender = helper.getSender();

			return {
				dialogId: params.dialogId,
				counter: params.counter,
				type: DialogType.private,
				name: sender.name,
				avatar: sender.avatar,
				color: sender.color,
				chatId: params.chatId,
			};
		}

		/**
		 * @protected
		 * @param {Array<MessengerPushEvent>} eventList
		 * @return {Array<{event: MessengerPushEvent, helper: PushHelper}>}
		 */
		prepareEventWithHelperList(eventList)
		{
			return eventList.map((event) => ({
				event,
				helper: this.getHelper(event),
			}));
		}
	}

	module.exports = { BasePushMessageHandler };
});
