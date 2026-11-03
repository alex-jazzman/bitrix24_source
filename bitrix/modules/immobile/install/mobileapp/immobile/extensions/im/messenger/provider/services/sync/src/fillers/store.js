/**
 * @module im/messenger/provider/services/sync/fillers/store
 */
jn.define('im/messenger/provider/services/sync/fillers/store', (require, exports, module) => {
	const { Type } = require('type');
	const { clone } = require('utils/object');

	const { DialogHelper } = require('im/messenger/lib/helper');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { ChatDataProvider, RecentDataProvider } = require('im/messenger/provider/data');
	const { SyncFillerBase } = require('im/messenger/provider/services/sync/fillers/base');
	const { StickerDataProvider } = require('im/messenger/provider/data');

	const logger = getLoggerWithContext('sync-service', 'SyncFillerStore');

	/**
	 * @class SyncFillerStore
	 */
	class SyncFillerStore extends SyncFillerBase
	{
		/**
		 * @param {SyncListResult} result
		 * @return {SyncListResult}
		 */
		prepareResult(result)
		{
			const cloneResult = clone(result);

			return this.filterUsers(cloneResult);
		}

		/**
		 * @param {SyncListResult} result
		 */
		async fillDataWithoutEmit(result)
		{
			logger.log('fillDataWithoutEmit:', result);

			try
			{
				await this.updateModels(this.prepareResult(result));
			}
			catch (error)
			{
				logger.error('fillDataWithoutEmit catch:', error);

				throw error;
			}
		}

		async updateModels(syncListResult)
		{
			await this.processStickers(syncListResult);
			await super.updateModels(syncListResult);
		}

		/**
		 * @param {SyncListResult} syncListResult
		 */
		async processRecent(syncListResult)
		{
			const { chatSync, recentItems, messages, chats, recentConfigs } = syncListResult;

			const processedRecentItems = this.prepareAddedRecent(recentItems, chatSync.addedRecent, messages);
			if (processedRecentItems.length === 0)
			{
				return;
			}

			if (!Type.isArrayFilled(recentConfigs))
			{
				return;
			}

			const sectionsByChatId = this.#createRecentSectionsByChatId(recentConfigs);

			const parentChatIdByChatId = new Map(
				chats.map((chat) => [Number(chat.id), Number(chat.parentChatId) || 0]),
			);

			const items = processedRecentItems
				.map((recentItem) => {
					const sections = sectionsByChatId.get(Number(recentItem.chatId)) ?? [];
					if (!Type.isArrayFilled(sections))
					{
						return null;
					}

					return {
						sections,
						itemList: recentItem,
						parentChatId: parentChatIdByChatId.get(Number(recentItem.chatId)) ?? 0,
					};
				})
				.filter(Boolean);

			if (!Type.isArrayFilled(items))
			{
				return;
			}

			await this.store.dispatch('recentModel/setByRecentConfigTabsBatch', { items });
		}

		/**
		 * @param {'model' | 'database'} source
		 * @param {Record<string, number> | []} completeDeletedChatsIds
		 */
		async processCompletelyDeletedChats(source, completeDeletedChatsIds)
		{
			const chatIdList = Object.values(completeDeletedChatsIds);
			if (!Type.isArrayFilled(chatIdList))
			{
				return;
			}
			logger.log('processCompletelyDeletedChats', chatIdList);

			const chatProvider = new ChatDataProvider();
			const recentProvider = new RecentDataProvider();

			await Promise.all(chatIdList.map(async (chatId) => {
				const chatDataProvider = await chatProvider.get({ chatId });
				if (chatDataProvider.hasData())
				{
					const chatData = chatDataProvider.getData();
					const dialogHelper = DialogHelper.createByModel(chatData);
					if (dialogHelper?.isChannel)
					{
						const commentChatData = this.store.getters['dialoguesModel/getByParentChatId'](chatData.chatId);

						if (
							Type.isPlainObject(commentChatData)
							&& this.store.getters['applicationModel/isDialogOpen'](commentChatData.dialogId)
						)
						{
							await chatProvider.delete({ dialogId: commentChatData.dialogId });
							this.closeDeletedChat({
								dialogId: commentChatData.dialogId,
								chatType: commentChatData.type,
								parentChatId: commentChatData.parentChatId,
								shouldShowAlert: false,
								shouldSendDeleteAnalytics: false,
							});
						}
						// A completely deleted chat cannot be left in any section, so the row goes as a
						// whole: sync fills recentConfigs only for chats with an ADD event.
						await recentProvider.deleteFromSource(source, { dialogId: dialogHelper.dialogId });
						await chatProvider.deleteFromSource(source, { chatId });
					}
					else
					{
						await recentProvider.deleteFromSource(source, { chatId });
						await chatProvider.deleteFromSource(source, { chatId });
					}

					this.closeDeletedChat({
						dialogId: chatData.dialogId,
						chatType: chatData.type,
					});
				}
			}));
		}

		/**
		 * @param {SyncListResult} syncListResult
		 */
		async processStickers(syncListResult)
		{
			const {
				stickers,
				messages,
			} = syncListResult;

			if (Type.isArrayFilled(stickers))
			{
				await this.store.dispatch('stickerPackModel/addStickers', {
					stickers,
				});
			}

			const stickerDataProvider = new StickerDataProvider();

			await stickerDataProvider.removeDeletedStickers(messages, stickers);
		}

		#createRecentSectionsByChatId(recentConfigs)
		{
			if (!Type.isArrayFilled(recentConfigs))
			{
				return new Map();
			}

			return new Map(
				recentConfigs.map((config) => [Number(config.chatId), config.sections]),
			);
		}
	}

	module.exports = {
		SyncFillerStore,
	};
});
