/**
 * @module im/messenger/controller/recent/channel/recent
 */
jn.define('im/messenger/controller/recent/channel/recent', (require, exports, module) => {
	const { clone } = require('utils/object');
	const { BaseRecent } = require('im/messenger/controller/recent/lib');
	const { restManager } = require('im/messenger/lib/rest-manager');
	const { MessengerEmitter } = require('im/messenger/lib/emitter');
	const { RestMethod, EventType, ComponentCode } = require('im/messenger/const');
	const { RecentRest } = require('im/messenger/provider/rest');

	/**
	 * @class ChannelRecent
	 */
	class ChannelRecent extends BaseRecent
	{
		constructor(options = {})
		{
			super(options);

			this.lastMessageId = null;
		}

		async fillStoreFromCache()
		{}

		async init()
		{
			await super.init();

			this.view.showLoader();
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

		stopRefreshing()
		{
			this.logger.info(`${this.getClassName()}.stopRefreshing`);
			this.view.stopRefreshing();
		}

		initRequests()
		{
			restManager.on(
				RestMethod.imV2RecentChannelTail,
				this.getRestRecentListOptions(),
				this.firstPageHandler.bind(this),
			);

			this.countersInitRequest();
		}

		onItemSelected(recentItem)
		{
			if (recentItem.params.disableTap)
			{
				return;
			}

			this.openDialog(recentItem.id, ComponentCode.imChannelMessenger);
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

		pageHandler(response)
		{
			return new Promise((resolve) => {
				/** @type {imV2RecentChannelTailResult} */
				const data = response.data();
				this.logger.info(`${this.getClassName()}.pageHandler data:`, data);

				if (data.hasNextPage === false)
				{
					this.pageNavigation.hasNextPage = false;
				}

				if (data.recentItems.length === 0)
				{
					this.view.hideLoader();
				}

				if (data.recentItems.length > 0)
				{
					const recentMessageIdList = data.recentItems.map((item) => item.messageId);

					this.lastMessageId = Math.min(...recentMessageIdList);
				}

				this.saveRecentData(data)
					.then(() => {
						this.pageNavigation.isPageLoading = false;

						this.renderInstant();
						this.checkEmpty();

						resolve();
					})
					.catch((error) => {
						this.logger.error(`${this.getClassName()}.saveRecentItems error:`, error);
					})
				;
			});
		}

		/**
		 *
		 * @param {imV2RecentChannelTailResult} recentData
		 * @return {Promise<void>}
		 */
		async saveRecentData(recentData)
		{
			const modelData = this.prepareDataForModels(recentData);

			void await this.store.dispatch('usersModel/set', modelData.users);
			void await this.store.dispatch('dialoguesModel/set', modelData.dialogues);
			void await this.store.dispatch('filesModel/set', modelData.files);
			void await this.store.dispatch('messagesModel/store', modelData.messages);

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

				for await (const id of idListForDeleteFromCache)
				{
					this.store.dispatch('recentModel/delete', { id });
				}
			}
		}

		/**
		 *
		 * @param {imV2RecentChannelTailResult} recentData
		 */
		prepareDataForModels(recentData)
		{
			const result = {
				users: recentData.users,
				dialogues: recentData.chats,
				files: recentData.files,
				recent: [],
				messages: [...recentData.messages, ...recentData.additionalMessages],
			};

			recentData.recentItems.forEach((recentItem) => {
				const message = recentData.messages.find((recentMessage) => recentItem.messageId === recentMessage.id);

				/** @type {RecentModelState} */
				const item = {
					id: recentItem.dialogId,
					pinned: recentItem.pinned,
					liked: false,
					unread: recentItem.unread,
					message: {
						...message,
						text: ChatMessengerCommon.purifyText(message.text, message.params),
					},
				};

				result.recent.push(item);
			});

			return result;
		}

		onItemAction(event)
		{
			const action = event.action.identifier;
			const itemId = event.item.params.id;

			this.itemAction.do(action, itemId);
		}

		onCreateChat()
		{
			MessengerEmitter.emit(
				EventType.navigation.broadCastEventWithTabChange,
				{
					broadCastEvent: EventType.messenger.createChannel,
					toTab: ComponentCode.imMessenger,
					data: {},
				},
				ComponentCode.imNavigation,
			);
		}

		onRefresh()
		{
			MessengerEmitter.emit(EventType.messenger.refresh, true, ComponentCode.imChannelMessenger);
		}

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
			const dialogId = mutation.payload.data.dialogId;
			const recentItem = clone(this.store.getters['recentModel/getById'](dialogId));
			if (recentItem)
			{
				this.updateItems([recentItem]);
			}
		}

		/**
		 * @return {object}
		 */
		getRestRecentListOptions()
		{
			return {
				limit: this.pageNavigation.itemsPerPage,
			};
		}

		saveShareDialogCache(recentItems)
		{
			return Promise.resolve(true);
		}

		/**
		 * @return {Promise<any>}
		 */
		getPageFromService()
		{
			const options = this.getRestListOptions();

			if (this.pageNavigation.currentPage > 1)
			{
				options.filter = {
					lastMessageId: this.lastMessageId,
				};
			}

			return RecentRest.getChannelList(options);
		}
	}

	module.exports = { ChannelRecent };
});
