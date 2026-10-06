/**
 * @module im/messenger/controller/attach-chat/chat-selector/src/provider
 */
jn.define('im/messenger/controller/attach-chat/chat-selector/src/provider', (require, exports, module) => {
	const { Type } = require('type');

	const { Loc } = require('im/messenger/loc');
	const { BaseSelectorProvider } = require('selector/providers/base');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const {
		ChatSearchProvider,
		ChatSearchConfig,
		RecentSectionLocalSearchStrategy,
		DefaultServerSearchStrategy,
	} = require('im/messenger/lib/chat-search');
	const { ChatTitle } = require('im/messenger/lib/element/chat-title');
	const { ChatAvatar } = require('im/messenger/lib/element/chat-avatar');
	const {
		RestMethod,
		RecentTabByNavigationTab,
		DialogType,
		RecentTab,
		MessengerInitRestMethod,
		NavigationTabId,
		RefreshMode,
	} = require('im/messenger/const');
	const { ChatPermission } = require('im/messenger/lib/permission-manager');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { runAction } = require('im/messenger/lib/rest');

	const ChatServerLoadService = require('im/messenger/controller/recent/service/server-load/chat');

	/**
	 * @class ChatDialogSelectorProvider
	 * Provides a list of regular chat dialogs where the current user is the owner.
	 * Excludes chats that already have a parent and the current project itself.
	 */
	class ChatDialogSelectorProvider extends BaseSelectorProvider
	{
		/**
		 * @param {string} context
		 * @param {Object} options
		 * @param {string|number} [options.parentChatId] - chat id of the project being attached to (excluded from list)
		 */
		constructor(context, options = {})
		{
			super(context);

			this.queryString = '';
			this.items = [];

			this.store = serviceLocator.get('core').getStore();

			/** @type {ChatSearchProvider|null} */
			this.searchProvider = null;
			this.processedQuery = '';

			this.logger = getLoggerWithContext('chat-selector-provider', this);

			/** @type {number|null} */
			this.excludedParentChatId = options.parentChatId ? Number(options.parentChatId) : null;

			this.serverLoaded = false;

			/** @type {ChatServerLoadService|null} */
			this.serverLoadService = null;
		}

		/**
		 * Unified entry point: empty text → loadRecent(), non-empty → doSearch(text).
		 *
		 * @param {string} text
		 */
		applyQuery(text)
		{
			const query = (text ?? '').trim();
			this.processedQuery = '';

			if (query.length > 0)
			{
				this.queryString = query;
				this.doSearch(query);
			}
			else
			{
				this.queryString = '';
				this.loadRecent();
			}
		}

		loadRecent()
		{
			this.#loadItemsFromStore();

			if (!this.serverLoaded)
			{
				void this.#loadFromServerAndRefresh();

				return;
			}

			this.listener.onRecentResult(this.items, true);
		}

		/**
		 * @param {string} query
		 */
		doSearch(query)
		{
			this.queryString = query;
			const currentQuery = query.trim().toLocaleLowerCase(env.languageId);

			if (currentQuery.length === 0)
			{
				this.processedQuery = '';
				this.listener.onFetchResult(this.items, true);

				return;
			}

			if (currentQuery === this.processedQuery)
			{
				return;
			}

			this.processedQuery = currentQuery;

			this.#ensureSearchProvider();
			void this.searchProvider.doSearch(currentQuery);
		}

		/**
		 * @param {Array<string>} itemIdList
		 * @param {boolean} needSearchOnServer
		 */
		onSearchLocalComplete = (itemIdList, needSearchOnServer) => {
			const dialogs = this.#filterAvailableDialogs(this.getDialogsByIds(itemIdList));

			if (dialogs.length === 0 && !needSearchOnServer)
			{
				this.listener.onFetchResult([], true);

				return;
			}

			const searchItems = this.prepareItemsForDrawing(dialogs);

			if (needSearchOnServer)
			{
				searchItems.push(this.getLoadingItem());
			}

			this.listener.onFetchResult(searchItems, true);
		};

		/**
		 * @param {Array<string>} itemIdList
		 */
		onSearchServerComplete = (itemIdList) => {
			const dialogs = this.#filterAvailableDialogs(this.getDialogsByIds(itemIdList));

			if (dialogs.length === 0)
			{
				this.listener.onFetchResult([], false);

				return;
			}

			this.listener.onFetchResult(this.prepareItemsForDrawing(dialogs), false);
		};

		/**
		 * @param {Array} items
		 * @return {Array}
		 */
		prepareItemsForDrawing(items)
		{
			return items.map((item) => this.prepareItemForDrawing(item));
		}

		/**
		 * @param {Object} item
		 * @return {Object}
		 */
		prepareItemForDrawing(item)
		{
			const chatAvatar = ChatAvatar.createFromDialogId(item.dialogId);
			const chatTitle = ChatTitle.createFromDialogId(item.dialogId);

			const title = chatTitle.getTitle({ useNotes: false }) ?? item.name;

			return {
				id: item.dialogId,
				title,
				subtitle: chatTitle.getDescription(),
				useLetterImage: false,
				sectionCode: 'common',
				avatar: chatAvatar.getListItemAvatarProps(),
				type: 'info',
				params: {
					id: item.dialogId,
					chatId: item.chatId,
					title,
					type: 'dialog',
				},
			};
		}

		/**
		 * @return {Object}
		 */
		getLoadingItem()
		{
			return {
				id: 'loading',
				title: Loc.getMessage('IMMOBILE_ATTACH_CHAT_SELECTOR_LOADING'),
				type: 'loading',
				unselectable: true,
				sectionCode: 'common',
			};
		}

		/**
		 * @param {Array<string>} itemIdList
		 * @return {Array}
		 */
		getDialogsByIds(itemIdList)
		{
			const getDialogById = this.store.getters['dialoguesModel/getById'];

			return itemIdList
				.map((id) => getDialogById(id))
				.filter(Boolean)
			;
		}

		/**
		 * Reads chat recent items from Vuex store into this.items.
		 */
		#loadItemsFromStore()
		{
			try
			{
				const recentItems = this.store.getters['recentModel/getChatFirstPage']();

				const dialogIds = recentItems
					.filter((item) => Type.isPlainObject(item))
					.map((item) => item.id)
				;

				const allDialogs = this.getDialogsByIds(dialogIds);
				const dialogs = this.#filterAvailableDialogs(allDialogs);
				this.items = this.prepareItemsForDrawing(dialogs);
			}
			catch (error)
			{
				this.logger.error('#loadItemsFromStore() error:', error);
				this.items = [];
			}
		}

		/**
		 * Fetches chat list from server once, then refreshes the list.
		 *
		 * @return {Promise<void>}
		 */
		async #loadFromServerAndRefresh()
		{
			const currentItems = [...this.items];
			if (currentItems.length > 0)
			{
				this.listener.onRecentResult([...currentItems, this.getLoadingItem()], true);
			}
			else
			{
				this.listener.onRecentResult([], true);
			}

			try
			{
				const service = this.#getServerLoadService();

				const result = await runAction(RestMethod.immobileMessengerLoad, {
					data: {
						methodList: [MessengerInitRestMethod.chatsList],
					},
				});

				await service.handleInitResult(RefreshMode.startUp, result);
				this.serverLoaded = true;
			}
			catch (error)
			{
				this.logger.error('#loadFromServerAndRefresh error:', error);
			}

			this.#loadItemsFromStore();
			this.listener.onRecentResult(this.items, true);
		}

		/**
		 * @return {ChatServerLoadService}
		 */
		#getServerLoadService()
		{
			if (!this.serverLoadService)
			{
				const noopEmitter = {
					on: () => noopEmitter,
					once: () => noopEmitter,
					off: () => noopEmitter,
					emit: () => noopEmitter,
				};

				const locator = {
					get: (key) => {
						const data = {
							id: NavigationTabId.chats,
							emitter: noopEmitter,
							recentSection: RecentTabByNavigationTab[NavigationTabId.chats],
							parentChatId: 0,
						};

						return data[key] ?? null;
					},
					has: (key) => ['id', 'emitter', 'recentSection', 'parentChatId'].includes(key),
					add: () => {},
				};

				this.serverLoadService = new ChatServerLoadService(locator, 'attach-chat-chat', {});
				this.serverLoadService.onInit();
			}

			return this.serverLoadService;
		}

		/**
		 * Creates or reuses the ChatSearchProvider for regular chat dialogs.
		 */
		#ensureSearchProvider()
		{
			if (this.searchProvider)
			{
				return;
			}

			this.searchProvider = new ChatSearchProvider({
				localStrategy: new RecentSectionLocalSearchStrategy({
					section: RecentTab.chat,
					parentChatId: null,
				}),
				serverStrategy: new DefaultServerSearchStrategy({
					config: new ChatSearchConfig(0),
					recentTab: RecentTab.chat,
					dynamicOptions: () => ({
						onlyWithOwnerRight: true,
						searchChatTypes: ['C'],
						onlyWithNullEntityType: true,
					}),
				}),
				loadSearchProcessed: (itemIdList, needSearchOnServer) => {
					this.onSearchLocalComplete(itemIdList, needSearchOnServer);
				},
				loadSearchComplete: (itemIdList, query) => {
					if (this.processedQuery !== query)
					{
						return;
					}

					this.onSearchServerComplete(itemIdList);
				},
			});
		}

		/**
		 * Client-side filter: only regular (closed) group chats without an existing parent,
		 * where the current user is the owner. Open chats are excluded: they cannot be attached
		 * to a project, mirroring the server searchChatTypes: ['C'] and the backend AttachToParent right.
		 *
		 * @param {Array} dialogs
		 * @return {Array}
		 */
		#filterAvailableDialogs(dialogs)
		{
			return dialogs.filter((dialog) => {
				// Only regular (closed) group chats: no open chats, collab, channel, etc.
				if (dialog.type !== DialogType.chat)
				{
					return false;
				}

				// Don't show the current project itself
				if (this.excludedParentChatId && Number(dialog.chatId) === this.excludedParentChatId)
				{
					return false;
				}

				// Chat must already not have a parent (attach is 0 → N only, no re-parenting allowed)
				if (Number(dialog.parentChatId ?? dialog.parent_chat_id ?? 0) !== 0)
				{
					return false;
				}

				// Backend AttachToParent requires owner role on the source chat
				return ChatPermission.isOwner(dialog);
			});
		}
	}

	module.exports = { ChatDialogSelectorProvider };
});
