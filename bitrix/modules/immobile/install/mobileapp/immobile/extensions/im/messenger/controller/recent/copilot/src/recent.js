/* eslint-disable flowtype/require-return-type */

/**
 * @module im/messenger/controller/recent/copilot/recent
 */
jn.define('im/messenger/controller/recent/copilot/recent', (require, exports, module) => {
	const { clone } = require('utils/object');
	const { CopilotRecentCache } = require('im/messenger/cache');
	const { MessengerEmitter } = require('im/messenger/lib/emitter');
	const { BaseRecent } = require('im/messenger/controller/recent/lib');
	const { restManager } = require('im/messenger/lib/rest-manager');
	const { RestMethod, EventType, ComponentCode, DialogType } = require('im/messenger/const');
	const { LoggerManager } = require('im/messenger/lib/logger');

	const logger = LoggerManager.getInstance().getLogger('recent--copilot-recent');

	/**
	 * @class CopilotRecent
	 */
	class CopilotRecent extends BaseRecent
	{
		constructor(options = {})
		{
			super({ ...options, logger });
		}

		bindMethods()
		{
			this.recentAddHandler = this.recentAddHandler.bind(this);
			this.recentUpdateHandler = this.recentUpdateHandler.bind(this);
			this.recentDeleteHandler = this.recentDeleteHandler.bind(this);
			this.dialogUpdateHandler = this.dialogUpdateHandler.bind(this);

			this.firstPageHandler = this.firstPageHandler.bind(this);
			this.stopRefreshing = this.stopRefreshing.bind(this);
			this.renderInstant = this.renderInstant.bind(this);
			this.loadPage = this.loadPage.bind(this);
		}

		fillStoreFromCache()
		{
			this.recentCache = new CopilotRecentCache({
				storeManager: this.storeManager,
			});
			const cache = this.recentCache.get();

			this.logger.info(`${this.getClassName()}.fillStoreFromCache cache:`, cache);

			return this.fillStore(cache);
		}

		initRequests()
		{
			restManager.on(
				RestMethod.imRecentList,
				this.getRestRecentListOptions(),
				this.firstPageHandler.bind(this),
			);

			this.countersInitRequest();
		}

		subscribeViewEvents()
		{
			this.view
				.on(EventType.recent.itemSelected, this.onItemSelected.bind(this))
				.on(EventType.recent.loadNextPage, this.onLoadNextPage.bind(this))
				.on(EventType.recent.itemAction, this.onItemAction.bind(this))
				.on(EventType.recent.createChat, this.onCreateChat.bind(this))
				.on(EventType.recent.refresh, this.onRefresh.bind(this))
			;
		}

		subscribeStoreEvents()
		{
			this.storeManager
				.on('recentModel/add', this.recentAddHandler)
				.on('recentModel/update', this.recentUpdateHandler)
				.on('recentModel/delete', this.recentDeleteHandler)
				.on('dialoguesModel/add', this.dialogUpdateHandler)
				.on('dialoguesModel/update', this.dialogUpdateHandler)
			;
		}

		subscribeMessengerEvents()
		{
			BX.addCustomEvent(EventType.messenger.afterRefreshSuccess, this.stopRefreshing);
			BX.addCustomEvent(EventType.messenger.renderRecent, this.renderInstant);
		}

		/**
		 * @return {object}
		 */
		getRestRecentListOptions()
		{
			return { ONLY_COPILOT: 'Y', SKIP_OPENLINES: 'Y' };
		}

		/**
		 * @return {object}
		 */
		getRestListOptions()
		{
			return { skipOpenlines: true, onlyCopilot: true };
		}

		/**
		 * @param {object} response
		 */
		pageHandler(response)
		{
			return new Promise((resolve) => {
				/** @type {imV2RecentCopilotResult} */
				const data = response.data();
				this.logger.info(`${this.getClassName()}.pageHandler data:`, data);

				if (data.hasMore === false)
				{
					this.pageNavigation.hasNextPage = false;
				}

				if (data.items.length > 0)
				{
					this.lastMessageDate = data.items[data.items.length - 1].message?.date;
				}
				else
				{
					this.view.hideLoader();
				}

				this.saveRecentData(data)
					.then(() => {
						this.pageNavigation.isPageLoading = false;

						this.renderInstant();
						this.checkEmpty();

						resolve();
					})
					.catch((error) => {
						this.logger.error(`${this.getClassName()}.saveRecentItems.catch:`, error);
					})
				;
			});
		}

		/**
		 * @param {imV2RecentCopilotResult} recentItems
		 * @return {Promise<void>}
		 */
		async saveRecentData(recentItems)
		{
			const modelData = this.prepareDataForModels(recentItems);

			void await this.store.dispatch('usersModel/set', modelData.users);
			void await this.store.dispatch('dialoguesModel/set', modelData.dialogues);
			void await this.store.dispatch('dialoguesModel/copilotModel/setCollection', modelData.copilot);
			void await this.store.dispatch('recentModel/set', modelData.recent);

			if (this.pageNavigation.currentPage === 1)
			{
				const recentIndex = [];
				modelData.recent.forEach((item) => recentIndex.push(item.id.toString()));

				const idListForDeleteFromCache = [];
				this.store.getters['recentModel/getCollection']()
					.forEach((item) => {
						if (!recentIndex.includes(item.id.toString()))
						{
							idListForDeleteFromCache.push(item.id);
						}
					});

				idListForDeleteFromCache.forEach((id) => {
					this.store.dispatch('recentModel/delete', { id });
				});

				await this.saveShareDialogCache(modelData.recent);
			}
		}

		/**
		 * @param {imV2RecentCopilotResult} recentData
		 */
		prepareDataForModels(recentData)
		{
			const result = {
				users: [],
				dialogues: [],
				recent: [],
				copilot: [],
			};

			recentData.items.forEach((item) => {
				if (item.user && item.user.id > 0)
				{
					result.users.push(item.user);
				}
				let dialogItem = {};

				if (item.chat && item.chat?.type === DialogType.copilot)
				{
					dialogItem = {
						...item.chat,
						counter: item.counter,
						dialogId: item.id,
					};
					if (item.message)
					{
						dialogItem.lastMessageId = item.message.id;
					}
				}

				result.dialogues.push(dialogItem);

				result.recent.push({
					...item,
					avatar: item.avatar.url,
					color: item.avatar.color,
					counter: dialogItem.counter,
				});

				try
				{
					const chats = recentData.copilot.chats.find((chat) => chat.dialogId === item.id);
					const roles = recentData.copilot.roles;
					const messages = recentData.copilot.messages?.find((message) => message.id === item.message.id);
					const copilotItem = {
						dialogId: item.id,
						chats: [chats],
						aiProvider: '',
						roles,
					};

					if (messages)
					{
						copilotItem.messages = [messages];
					}
					result.copilot.push(copilotItem);
				}
				catch (error)
				{
					logger.error(`${this.constructor.name}.prepareDataForModels.catch:`, error);
				}
			});

			try
			{
				const uniqueMap = new Map(result.users.map((userObj) => [userObj.id, userObj]));
				result.users = [...uniqueMap.values()];
			}
			catch (error)
			{
				logger.error(`${this.constructor.name}.prepareDataForModels.filter users catch:`, error);
			}

			return result;
		}

		/* region Events */

		onItemSelected(recentItem)
		{
			if (recentItem.params.disableTap)
			{
				return;
			}

			this.openDialog(recentItem.id, ComponentCode.imCopilotMessenger);
		}

		onLoadNextPage()
		{
			const canLoadNextPage = !this.pageNavigation.isPageLoading && this.pageNavigation.hasNextPage;
			if (!canLoadNextPage)
			{
				return;
			}

			this.loadNextPage();
		}

		onItemAction(event)
		{
			const action = event.action.identifier;
			const itemId = event.item.params.id;

			this.itemAction.do(action, itemId);
		}

		onCreateChat()
		{
			MessengerEmitter.emit(EventType.messenger.createChat, {}, ComponentCode.imCopilotMessenger);
		}


		onRefresh()
		{
			MessengerEmitter.emit(EventType.messenger.refresh, true, ComponentCode.imCopilotMessenger);
		}

		/* endregion Events */
		recentAddHandler(mutation)
		{
			const recentList = [];
			const recentItemList = clone(mutation.payload.data.recentItemList);

			recentItemList.forEach((item) => recentList.push(item.fields));

			this.addItems(recentList);
		}

		recentUpdateHandler(mutation)
		{
			const recentList = [];

			mutation.payload.data.recentItemList.forEach((item) => {
				recentList.push(clone(this.store.getters['recentModel/getCollection']()[item.index]));
			});

			this.updateItems(recentList);
		}

		recentDeleteHandler(mutation)
		{
			this.renderer.removeFromQueue(mutation.payload.data.id);

			this.view.removeItem({ id: mutation.payload.data.id });
			if (!this.pageNavigation.hasNextPage && this.view.isLoaderShown)
			{
				this.view.hideLoader();
			}

			this.checkEmpty();
		}

		dialogUpdateHandler(mutation)
		{
			if (!['removeParticipants', 'addParticipants'].includes(mutation?.payload?.actionName))
			{
				const dialogId = mutation.payload.data.dialogId;
				const recentItem = clone(this.store.getters['recentModel/getById'](dialogId));
				if (recentItem)
				{
					this.updateItems([recentItem]);
				}
			}
		}

		showWelcomeScreen()
		{
			this.view.showWelcomeScreen();
		}

		/**
		 * @override
		 * @param {Array} recentItems
		 * @return {Promise}
		 */
		saveShareDialogCache(recentItems)
		{
			return Promise.resolve(true);
		}
	}

	module.exports = { CopilotRecent };
});
