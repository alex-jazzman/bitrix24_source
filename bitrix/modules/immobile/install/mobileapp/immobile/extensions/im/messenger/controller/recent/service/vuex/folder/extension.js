/**
 * @module im/messenger/controller/recent/service/vuex/folder
 */
jn.define('im/messenger/controller/recent/service/vuex/folder', (require, exports, module) => {
	const { Type } = require('type');
	const { unique } = require('utils/array');
	const { BaseRecentService } = require('im/messenger/controller/recent/service/base');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	/**
	 * @implements {IVuexService}
	 * @class FolderVuexService
	 */
	class FolderVuexService extends BaseRecentService
	{
		onInit()
		{
			this.folderId = Number(this.props.folderId);
			this.subscribeEvents();
		}

		get storeManager()
		{
			return serviceLocator.get('core').getStoreManager();
		}

		get store()
		{
			return serviceLocator.get('core').getStore();
		}

		subscribeEvents()
		{
			this.storeManager
				.on('recentModel/add', this.recentAddHandler)
				.on('recentModel/update', this.recentUpdateHandler)
				.on('recentModel/delete', this.recentDeleteHandler)
				.on('dialoguesModel/add', this.dialogUpdateHandler)
				.on('dialoguesModel/update', this.dialogUpdateHandler)
				.on('dialoguesModel/addCollection', this.dialogCollectionUpdateHandler)
				.on('dialoguesModel/updateCollection', this.dialogCollectionUpdateHandler)
				.on('dialoguesModel/clearAllCounters', this.dialogReadAllCountersHandler)
				.on('counterModel/set', this.counterSetHandler)
				.on('counterModel/delete', this.counterDeleteHandler)
				.on('folderModel/setChats', this.folderChatsChangedHandler)
				.on('folderModel/update', this.folderUpdateHandler)
				.on('folderModel/setState', this.folderSetStateHandler)
			;
		}

		unsubscribeEvents()
		{
			this.storeManager
				.off('recentModel/add', this.recentAddHandler)
				.off('recentModel/update', this.recentUpdateHandler)
				.off('recentModel/delete', this.recentDeleteHandler)
				.off('dialoguesModel/add', this.dialogUpdateHandler)
				.off('dialoguesModel/update', this.dialogUpdateHandler)
				.off('dialoguesModel/addCollection', this.dialogCollectionUpdateHandler)
				.off('dialoguesModel/updateCollection', this.dialogCollectionUpdateHandler)
				.off('dialoguesModel/clearAllCounters', this.dialogReadAllCountersHandler)
				.off('counterModel/set', this.counterSetHandler)
				.off('counterModel/delete', this.counterDeleteHandler)
				.off('folderModel/setChats', this.folderChatsChangedHandler)
				.off('folderModel/update', this.folderUpdateHandler)
				.off('folderModel/setState', this.folderSetStateHandler)
			;
		}

		recentAddHandler = ({ payload }) => {
			this.logger.log('recentAddHandler', payload);
			if (this.#isFolderFirstPageAction(payload))
			{
				this.#renderFolderItems();

				return;
			}

			// the add mutation only fires for records new to the model, so an item that landed in
			// the upsert bucket is a chat that appeared in this folder
			if (this.#updateRecentItems(this.#getRecentItemsFromPayload(payload)))
			{
				this.#getRender()?.markCompositionChanged();
			}
		};

		recentUpdateHandler = ({ payload }) => {
			this.logger.log('recentUpdateHandler', payload);
			if (this.#isFolderFirstPageAction(payload))
			{
				this.#renderFolderItems();

				return;
			}

			this.#updateRecentItems(this.#getRecentItemsFromPayload(payload));
		};

		recentDeleteHandler = ({ payload }) => {
			const itemId = String(payload?.data?.id ?? '');
			if (!Type.isStringFilled(itemId) || !this.#getRender().hasItemPending(itemId))
			{
				return;
			}

			this.#getRender().deleteItems([{ id: itemId }]);
		};

		dialogUpdateHandler = ({ payload }) => {
			const dialogId = String(payload?.data?.dialogId ?? '');
			if (!Type.isStringFilled(dialogId))
			{
				return;
			}

			const recentItem = this.store.getters['recentModel/getById'](dialogId) ?? { id: dialogId };
			this.#updateRecentItems([recentItem]);
		};

		/**
		 * A whole page of dialogues seeded at once: answered like a single record, once for the page.
		 * The restore from the local database commits the same mutations and is left alone.
		 *
		 * @param {MutationPayload<DialoguesAddCollectionData|DialoguesUpdateCollectionData>} payload
		 */
		dialogCollectionUpdateHandler = ({ payload }) => {
			if (payload?.actionName !== 'setCollection')
			{
				return;
			}

			const items = payload?.data?.addItems ?? payload?.data?.updateItems;
			if (!Type.isArrayFilled(items))
			{
				return;
			}

			const recentItems = items
				.map((item) => String(item.dialogId ?? ''))
				.filter((dialogId) => Type.isStringFilled(dialogId))
				.map((dialogId) => this.store.getters['recentModel/getById'](dialogId) ?? { id: dialogId })
			;

			this.#updateRecentItems(recentItems);
		};

		dialogReadAllCountersHandler = ({ payload }) => {
			const dialogIdList = payload?.data?.affectedDialogs;
			if (!Type.isArrayFilled(dialogIdList))
			{
				return;
			}

			const items = dialogIdList.map((dialogId) => {
				return this.store.getters['recentModel/getById'](String(dialogId)) ?? { id: String(dialogId) };
			});

			this.#updateRecentItems(items);
		};

		counterSetHandler = ({ payload }) => {
			const counterList = payload?.data?.counterList;
			if (!Type.isArrayFilled(counterList))
			{
				return;
			}

			const previousParentChatIdList = payload?.data?.previousParentChatIdList ?? [];
			const chatIds = unique([
				...this.#extractChatIdsFromCounters(counterList),
				...previousParentChatIdList,
			]);

			const items = this.#getRecentItemsByChatIds(chatIds);
			if (Type.isArrayFilled(items))
			{
				this.#updateRecentItems(items);
			}
		};

		counterDeleteHandler = ({ payload }) => {
			if (!['clear', 'clearByType', 'delete'].includes(payload?.actionName))
			{
				return;
			}

			const { chatIdList = [], parentChatIdList = [] } = payload?.data ?? {};
			const items = this.#getRecentItemsByChatIds(unique([...chatIdList, ...parentChatIdList]));
			if (Type.isArrayFilled(items))
			{
				this.#updateRecentItems(items);
			}
		};

		folderChatsChangedHandler = ({ payload }) => {
			if (payload?.data?.folderId !== this.folderId)
			{
				return;
			}

			this.#renderFolderItems();
		};

		folderUpdateHandler = ({ payload }) => {
			if (payload?.data?.id !== this.folderId || !Type.isArray(payload?.data?.fields?.chatIds))
			{
				return;
			}

			this.#renderFolderItems();
		};

		folderSetStateHandler = () => {
			this.#renderFolderItems();
		};

		/**
		 * @param {Array<RecentModelState>} items
		 * @return {boolean} true when at least one item was queued for upsert
		 */
		#updateRecentItems(items)
		{
			if (!Type.isArrayFilled(items) || !this.recentLocator.has('render'))
			{
				return false;
			}

			const render = this.#getRender();
			const toUpsert = [];
			const toDelete = [];

			for (const item of items)
			{
				const id = String(item.id ?? item.dialogId ?? '');
				if (!Type.isStringFilled(id))
				{
					continue;
				}

				const chatId = this.#getChatIdByDialogId(id);
				if (this.#isChatInFolder(chatId))
				{
					const recentItem = this.store.getters['recentModel/getById'](id);
					if (recentItem)
					{
						toUpsert.push(recentItem);
					}
				}
				else if (render.hasItemPending(id))
				{
					toDelete.push({ id });
				}
			}

			if (Type.isArrayFilled(toUpsert))
			{
				render.upsertItems(toUpsert);
			}

			if (Type.isArrayFilled(toDelete))
			{
				render.deleteItems(toDelete);
			}

			return Type.isArrayFilled(toUpsert);
		}

		/**
		 * @param {MutationPayload<RecentAddData|RecentUpdateData>} payload
		 * @return {Array<RecentModelState>}
		 */
		#getRecentItemsFromPayload(payload)
		{
			const recentItemList = payload?.data?.recentItemList;
			if (!Type.isArrayFilled(recentItemList))
			{
				return [];
			}

			return recentItemList
				.map((item) => item.fields?.id ?? item.id)
				.filter((id) => Type.isStringFilled(String(id)))
				.map((id) => this.store.getters['recentModel/getById'](String(id)))
				.filter(Boolean)
			;
		}

		#renderFolderItems()
		{
			if (!this.recentLocator.has('render'))
			{
				return;
			}

			this.#getRender().setItems(this.#getFolderRecentItems());
			void this.#getRender().renderInstant();
		}

		/**
		 * @return {Array<RecentModelState>}
		 */
		#getFolderRecentItems()
		{
			const chatIds = this.store.getters['folderModel/getChatIds'](this.folderId);
			const items = this.store.getters['recentModel/getByChatIdList'](chatIds);

			return [...items].sort((a, b) => {
				if (a.pinned !== b.pinned)
				{
					return a.pinned ? -1 : 1;
				}

				return this.#getItemTimestamp(b) - this.#getItemTimestamp(a);
			});
		}

		#getRender()
		{
			return this.recentLocator.get('render');
		}

		#isFolderFirstPageAction(payload)
		{
			return payload?.actionName === 'setFolderFirstPage';
		}

		#isChatInFolder(chatId)
		{
			return Type.isNumber(chatId)
				&& this.store.getters['folderModel/getChatIds'](this.folderId).includes(chatId)
			;
		}

		/**
		 * @param {string} dialogId
		 * @return {number|null}
		 */
		#getChatIdByDialogId(dialogId)
		{
			return this.store.getters['dialoguesModel/getById'](dialogId)?.chatId ?? null;
		}

		/**
		 * @param {Array<CounterModelState>} counterList
		 * @return {Array<number>}
		 */
		#extractChatIdsFromCounters(counterList)
		{
			const chatIds = counterList
				.map((counterState) => {
					return counterState.parentChatId > 0 ? counterState.parentChatId : counterState.chatId;
				})
				.filter(Boolean)
			;

			return unique(chatIds);
		}

		/**
		 * @param {Array<number>} chatIds
		 * @return {Array<RecentModelState>}
		 */
		#getRecentItemsByChatIds(chatIds)
		{
			if (!Type.isArrayFilled(chatIds))
			{
				return [];
			}

			return this.store.getters['recentModel/getByChatIdList'](chatIds);
		}

		/**
		 * @param {RecentModelState} item
		 * @return {number}
		 */
		#getItemTimestamp(item)
		{
			const date = item.lastActivityDate ?? item.message?.date;
			if (date instanceof Date)
			{
				return date.getTime();
			}

			return new Date(date).getTime() || 0;
		}
	}

	module.exports = FolderVuexService;
});
