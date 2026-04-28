/**
 * @module im/messenger/provider/push/message-handler/messenger
 */
jn.define('im/messenger/provider/push/message-handler/messenger', (require, exports, module) => {
	const { Type } = require('type');
	const { RecentTab } = require('im/messenger/const');
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
		 * @return {Record<string, Array<object>>}
		 */
		prepareRecentItems(items)
		{
			const groups = {
				[RecentTab.chat]: {},
				[RecentTab.copilot]: {},
				[RecentTab.collab]: {},
				[RecentTab.tasksTask]: {},
			};

			for (const { event, helper } of items)
			{
				const message = this.prepareRecentMessage({ event, helper });

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

				if (helper.isTaskChat())
				{
					groups[RecentTab.tasksTask][recentItem.id] = recentItem;

					continue;
				}

				groups[RecentTab.chat][recentItem.id] = recentItem;

				if (helper.isCopilotChat())
				{
					groups[RecentTab.copilot][recentItem.id] = recentItem;
				}

				if (helper.isCollabChat())
				{
					groups[RecentTab.collab][recentItem.id] = recentItem;
				}
			}

			groups[RecentTab.chat] = Object.values(groups[RecentTab.chat]);
			groups[RecentTab.copilot] = Object.values(groups[RecentTab.copilot]);
			groups[RecentTab.collab] = Object.values(groups[RecentTab.collab]);
			groups[RecentTab.tasksTask] = Object.values(groups[RecentTab.tasksTask]);

			return groups;
		}

		async setRecent(groups = {})
		{
			await this.store.dispatch('recentModel/setGroupCollection', {
				groups,
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
