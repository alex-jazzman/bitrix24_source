/**
 * @module im/messenger/controller/recent/service/server-load/all
 */
jn.define('im/messenger/controller/recent/service/server-load/all', (require, exports, module) => {
	const { Type } = require('type');
	const { PerfPoint } = require('debug/prism');
	const { ROOT_PARENT_CHAT_ID } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const FolderServerLoadService = require('im/messenger/controller/recent/service/server-load/folder');

	/**
	 * @implements {IServerLoadService}
	 * @class AllServerLoadService
	 */
	class AllServerLoadService extends FolderServerLoadService
	{
		/**
		 * The composite tail of the "All" folder carries chats of every member section, so a flat
		 * seed into a single section is not enough: each item is written to the sections the server
		 * reports for its chat, the same way sync and pull do it.
		 *
		 * The seed is additive for any page, so the first page needs no special handling and the
		 * inherited firstPage argument is not used.
		 *
		 * @override
		 * @param {object} recentData
		 * @param {boolean} [firstPage]
		 * @param {?FilterId} [requestedMode] the mode the loader requested the page in
		 * @return {Promise<void>}
		 */
		async processResult(recentData, firstPage = false, requestedMode = null)
		{
			if (!recentData || !Type.isArray(recentData.items))
			{
				this.logger.error('processResult: invalid recentData structure', recentData);

				return;
			}

			const modelData = this.prepareDataForModels(recentData);
			const point = new PerfPoint('recent-all-server-tail', this.recentLocator.get('id')).start();

			try
			{
				point.startPoint('related-models');
				await Promise.all([
					this.store.dispatch('usersModel/set', modelData.users),
					this.store.dispatch('dialoguesModel/set', modelData.dialogues),
					this.store.dispatch('dialoguesModel/setCollection', modelData.dialoguesWithoutChat),
					this.store.dispatch('dialoguesModel/copilotModel/setCollection', modelData.copilot),
				]);
				point.endPoint('related-models');

				const items = this.buildSectionItems(modelData.recent, recentData);
				if (Type.isArrayFilled(items))
				{
					point.startPoint('model-seed');
					await this.store.dispatch('recentModel/setByRecentConfigTabsBatch', { items });
					point.endPoint('model-seed', { itemsCount: items.length });

					point.startPoint('sections-save');
					await this.saveSections(items);
					point.endPoint('sections-save', { itemsCount: items.length });

					// a tail page lies below the bottom of the previous one, so it is outside the
					// window of the list service until it is reported; it moves the window of the
					// mode it was requested in, never of the one the tab happens to be in now
					this.recentLocator.get('vuex')?.addLoadedPage(
						items.map((item) => this.#getItemId(item)),
						requestedMode,
					);
				}

				this.showLoaderByRestResult(recentData);
			}
			catch (error)
			{
				this.logger.error('processResult: dispatch failed', error);

				// closes the phase that was open when it failed; an already closed key is a no-op
				point.endPoint('related-models', { error });
				point.endPoint('model-seed', { error });
				point.endPoint('sections-save', { error });
			}
			finally
			{
				point.end();
			}
		}

		/**
		 * Groups the tail items by the sections of their chat. Every section of a chat is seeded,
		 * not only the ones the "All" folder is built from: the model stays consistent and the
		 * union getter reads the sections it needs itself.
		 *
		 * @param {Array<object>} recentItems
		 * @param {object} recentData
		 * @return {Array<{ sections: Array<string>, itemList: object, parentChatId: number }>}
		 */
		buildSectionItems(recentItems, recentData)
		{
			if (!Type.isArrayFilled(recentData.recentConfigs))
			{
				this.logger.error('buildSectionItems: recentConfigs are missing', recentData);

				return [];
			}

			const sectionsByChatId = new Map(
				recentData.recentConfigs.map((config) => [Number(config.chatId), config.sections]),
			);

			const chats = Type.isArray(recentData.chats) ? recentData.chats : [];
			const parentChatIdByChatId = new Map(
				chats.map((chat) => [Number(chat.id), Number(chat.parentChatId) || ROOT_PARENT_CHAT_ID]),
			);

			return recentItems
				.map((recentItem) => {
					const chatId = Number(recentItem.chatId);
					const sections = sectionsByChatId.get(chatId);
					if (!Type.isArrayFilled(sections))
					{
						return null;
					}

					return {
						sections,
						itemList: recentItem,
						parentChatId: parentChatIdByChatId.get(chatId) ?? ROOT_PARENT_CHAT_ID,
					};
				})
				.filter(Boolean);
		}

		/**
		 * Persists section membership so a cold start restores the same buckets (as pull does).
		 *
		 * @param {Array<{ sections: Array<string>, itemList: object }>} items
		 * @return {Promise<void>}
		 */
		async saveSections(items)
		{
			const recentRepository = serviceLocator.get('core').getRepository().recent;

			await Promise.all(items.map((item) => recentRepository.setSections(
				this.#getItemId(item),
				item.sections,
			)));
		}

		/**
		 * @param {{ itemList: object }} item
		 * @return {string}
		 */
		#getItemId(item)
		{
			return String(item.itemList.id || item.itemList.dialogId);
		}
	}

	module.exports = AllServerLoadService;
});
