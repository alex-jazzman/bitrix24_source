/**
 * @module im/messenger/provider/push/message-handler/database
 */
jn.define('im/messenger/provider/push/message-handler/database', (require, exports, module) => {
	const { Type } = require('type');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { BasePushMessageHandler } = require('im/messenger/provider/push/message-handler/base');
	const { RecentDataConverter } = require('im/messenger/lib/converter/data/recent');

	/**
	 * @class DatabasePushMessageHandler
	 */
	class DatabasePushMessageHandler extends BasePushMessageHandler
	{
		constructor()
		{
			super();

			const repositoryCollection = serviceLocator.get('core').getRepository();
			/**
			 * @type {DialogRepository}
			 */
			this.dialogRepository = repositoryCollection.dialog;
			/**
			 * @type {UserRepository}
			 */
			this.userRepository = repositoryCollection.user;
			/**
			 * @type {FileRepository}
			 */
			this.fileRepository = repositoryCollection.file;
			/**
			 * @type {MessageRepository}
			 */
			this.messageRepository = repositoryCollection.message;
			/**
			 * @type {RecentRepository}
			 */
			this.recentRepository = repositoryCollection.recent;
			/**
			 * @type {StickerRepository}
			 */
			this.stickerRepository = repositoryCollection.sticker;
		}

		/**
		 * @param {Array<MessengerPushEvent>} eventList
		 * @return {Array<MessengerPushEvent>}
		 */
		filterMessageEvents(eventList)
		{
			const verifiedEvents = [];
			for (const event of eventList)
			{
				if (event.command === 'message')
				{
					verifiedEvents.push(event);

					continue;
				}

				const helper = this.getHelper(event);

				if (helper.isLines())
				{
					continue;
				}

				if (!helper.isChatExist())
				{
					continue;
				}

				if (helper.isOpenChannelChat && !helper.isUserInChat())
				{
					continue;
				}

				verifiedEvents.push(event);
			}

			return verifiedEvents;
		}

		async setDialogs(dialogs = [])
		{
			if (!Type.isArrayFilled(dialogs))
			{
				return Promise.resolve();
			}

			return this.dialogRepository.saveFromPush(dialogs);
		}

		async setUsers(users = [])
		{
			if (!Type.isArrayFilled(users))
			{
				return Promise.resolve();
			}

			return this.userRepository.saveFromPush(users);
		}

		async setFiles(files = [])
		{
			if (!Type.isArrayFilled(files))
			{
				return Promise.resolve();
			}

			return this.fileRepository.saveFromPush(files);
		}

		async setMessages(messages = [])
		{
			if (!Type.isArrayFilled(messages))
			{
				return Promise.resolve();
			}

			return this.messageRepository.saveFromPush(messages);
		}

		/**
		 * @param {Array<{event: MessengerPushEvent, helper: PushHelper}>} items
		 * @return {Array<{recentItem: object, sections: Array<string>}>}
		 */
		prepareRecentItems(items)
		{
			/** @type {Map<string, {recentItem: object, sections: Array<string>}>} */
			const uniqueRecentItems = new Map();

			for (const { event, helper } of items)
			{
				const message = this.prepareRecentMessage({ event, helper });
				const sections = helper.getRecentSections();

				const recentItem = RecentDataConverter.fromPushToModel({
					id: String(helper.getDialogId()),
					chat: helper.getChat(),
					user: helper.getSender(),
					lines: event.params.lines,
					counter: event.params.counter,
					liked: false,
					lastActivityDate: event.params.message.date,
					dateMessage: event.params.message.date,
					message,
				});

				uniqueRecentItems.set(recentItem.id, { recentItem, sections });
			}

			return [...uniqueRecentItems.values()];
		}

		async setRecent(recentItems = [])
		{
			if (!Type.isArrayFilled(recentItems))
			{
				return Promise.resolve();
			}

			const recentRepository = serviceLocator.get('core').getRepository().recent;
			await Promise.all(
				recentItems.map(({ recentItem, sections }) =>
					recentRepository.setSections(String(recentItem.id), sections),
				),
			);

			return this.recentRepository.saveFromPush(recentItems.map(({ recentItem }) => recentItem));
		}

		/**
		 * @param {Array<StickerState>} stickers
		 * @return {Promise<void>}
		 */
		async setStickers(stickers = [])
		{
			if (!Type.isArrayFilled(stickers))
			{
				return Promise.resolve();
			}

			return this.stickerRepository.saveFromPush(stickers);
		}

		/**
		 * @desc Local storage of counters is not supported
		 * @param counters
		 * @return {Promise<unknown>}
		 */
		async setCounters(counters)
		{
			return Promise.resolve({});
		}
	}

	module.exports = { DatabasePushMessageHandler };
});
