/**
 * @module im/messenger/provider/push/message-handler/messenger
 */
jn.define('im/messenger/provider/push/message-handler/messenger', (require, exports, module) => {
	const { Type } = require('type');
	const { RecentDataConverter } = require('im/messenger/lib/converter/data/recent');
	const { BasePushMessageHandler } = require('im/messenger/provider/push/message-handler/base');

	/**
	 * @class MessengerPushMessageHandler
	 */
	class MessengerPushMessageHandler extends BasePushMessageHandler
	{
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

		/**
		 * @param {Array<{event: MessengerPushEvent, helper: PushHelper}>} items
		 * @return {Array<{recentItem: object, parentChatId: number, sections: Array<string>}>}
		 */
		prepareRecentItems(items)
		{
			/** @type {Map<string, {recentItem: object, parentChatId: number, sections: Array<string>}>} */
			const uniqueRecentItems = new Map();

			for (const { event, helper } of items)
			{
				const message = this.prepareRecentMessage({ event, helper });
				const parentChatId = helper.getParentChatId();
				const sections = helper.getRecentSections();

				const recentItem = RecentDataConverter.fromPushToModel({
					id: String(helper.getDialogId()),
					chat: helper.getChat(),
					user: helper.getSender(),
					lines: event.params.lines, // undefined it's OK
					counter: event.params.counter,
					liked: false,
					lastActivityDate: event.params.message.date,
					dateMessage: event.params.message.date,
					message,
				});

				uniqueRecentItems.set(recentItem.id, { recentItem, parentChatId, sections });
			}

			return [...uniqueRecentItems.values()];
		}

		/**
		 * @param {Array<{recentItem: object, parentChatId: number, sections: Array<string>}>} recentItems
		 */
		async setRecent(recentItems = [])
		{
			await this.store.dispatch('recentModel/setByRecentConfigTabsBatch', {
				items: recentItems.map(({ recentItem, parentChatId, sections }) => ({
					sections,
					itemList: recentItem,
					parentChatId,
				})),
			});
		}

		async setCounters(counterList = [])
		{
			if (!Type.isArrayFilled(counterList))
			{
				return;
			}

			await this.store.dispatch('counterModel/setList', { counterList });
		}

		/**
		 * @param {Array<StickerState>} stickers
		 * @return {Promise<void>}
		 */
		async setStickers(stickers = [])
		{
			if (!Type.isArrayFilled(stickers))
			{
				return;
			}

			await this.store.dispatch('stickerPackModel/addStickersFromPush', {
				stickers,
			});
		}
	}

	module.exports = { MessengerPushMessageHandler };
});
