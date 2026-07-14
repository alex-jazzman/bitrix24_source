/**
 * @module im/messenger/controller/selector/forward/tabbed/src/provider
 */
jn.define('im/messenger/controller/selector/forward/tabbed/src/provider', (require, exports, module) => {
	const { Type } = require('type');
	const { withCurrentDomain } = require('utils/url');

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
	const { RestMethod, RecentTabByNavigationTab, DialogType } = require('im/messenger/const');
	const { ChatPermission } = require('im/messenger/lib/permission-manager');
	const { UserHelper } = require('im/messenger/lib/helper');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { runAction } = require('im/messenger/lib/rest');

	const { ForwardTab, forwardTabRegistry } = require('im/messenger/controller/selector/forward/tabbed/src/tab-config');

	const ChatServerLoadService = require('im/messenger/controller/recent/service/server-load/chat');
	const CollabServerLoadService = require('im/messenger/controller/recent/service/server-load/collab');
	const TaskServerLoadService = require('im/messenger/controller/recent/service/server-load/task');
	const ChannelLoadService = require('im/messenger/controller/recent/service/server-load/channel');
	const CopilotServerLoadService = require('im/messenger/controller/recent/service/server-load/copilot');

	const ASSET_PATH = '/bitrix/mobileapp/immobile/extensions/im/messenger/assets/common/png/';

	const SERVER_LOAD_SERVICE_BY_TAB = {
		[ForwardTab.chats]: ChatServerLoadService,
		[ForwardTab.tasks]: TaskServerLoadService,
		[ForwardTab.projects]: CollabServerLoadService,
		[ForwardTab.channels]: ChannelLoadService,
		[ForwardTab.copilot]: CopilotServerLoadService,
	};

	/**
	 * @class ForwardDialogSelectorProvider
	 */
	class ForwardDialogSelectorProvider extends BaseSelectorProvider
	{
		/**
		 * @param {string} context
		 * @param {Object} options
		 * @param {boolean} [options.withFavorite=false]
		 */
		constructor(context, options = {})
		{
			super(context);

			this.queryString = '';
			this.items = [];
			this.withFavorite = options.withFavorite ?? false;

			this.store = serviceLocator.get('core').getMessengerStore();
			this.activeTab = ForwardTab.chats;

			/** @type {Set<string>} */
			this.tabServerLoaded = new Set();

			/** @type {Object<string, IServerLoadService>} */
			this.serverLoadServices = {};

			/** @type {ChatSearchProvider|null} */
			this.searchProvider = null;
			/** @type {string|null} */
			this.searchProviderTab = null;
			this.processedQuery = '';

			this.logger = getLoggerWithContext('forward-dialog-selector-provider', this);
		}

		/**
		 * @param {string} tabId
		 * @param {string} [searchText='']
		 */
		setActiveTab(tabId, searchText = '')
		{
			if (!forwardTabRegistry.has(tabId))
			{
				return;
			}

			this.activeTab = tabId;
			this.processedQuery = '';

			const query = searchText.trim();
			if (query.length > 0)
			{
				this.queryString = query;
				this.doSearch(query);

				return;
			}

			this.queryString = '';
			this.loadRecent();
		}

		loadRecent()
		{
			this.#loadItemsFromStore();

			if (!this.tabServerLoaded.has(this.activeTab))
			{
				void this.#loadFromServerAndRefresh(this.activeTab);

				return;
			}

			this.listener.onRecentResult(this.items, true);
		}

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
			if (UserHelper.isCurrentUser(item.dialogId) && this.withFavorite)
			{
				return this.getFavoriteItem();
			}

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
					title,
					type: 'dialog',
				},
			};
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
			const dialogs = this.#filterDialogsByActiveTab(this.getDialogsByIds(itemIdList));

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
			const dialogs = this.#filterDialogsByActiveTab(this.getDialogsByIds(itemIdList));

			if (dialogs.length === 0)
			{
				this.listener.onFetchResult([], false);

				return;
			}

			this.listener.onFetchResult(this.prepareItemsForDrawing(dialogs), false);
		};

		/**
		 * @param {Array} dialogs
		 * @return {Array}
		 */
		#filterDialogsByActiveTab(dialogs)
		{
			const config = forwardTabRegistry.get(this.activeTab);
			if (!config)
			{
				return dialogs;
			}

			return this.#filterAvailableDialogs(dialogs, config.filter);
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
		 * @param {Array} items
		 * @return {Array}
		 */
		withFavoriteItem(items)
		{
			return [this.getFavoriteItem(), ...items];
		}

		/**
		 * @return {Object}
		 */
		getFavoriteItem()
		{
			return {
				id: env.userId,
				title: Loc.getMessage('IMMOBILE_MESSENGER_FORWARD_SELECTOR_FAVORITE_ITEM'),
				useLetterImage: false,
				avatar: {
					hideOutline: true,
					uri: withCurrentDomain(`${ASSET_PATH}favorite_avatar.png`),
				},
				type: 'info',
			};
		}

		/**
		 * @return {Object}
		 */
		getLoadingItem()
		{
			return {
				id: 'loading',
				title: Loc.getMessage('IMMOBILE_MESSENGER_FORWARD_SELECTOR_LOADING_ITEM'),
				type: 'loading',
				unselectable: true,
				sectionCode: 'common',
			};
		}

		/**
		 * @param {string} tabId
		 * @return {IServerLoadService}
		 */
		#getServerLoadService(tabId)
		{
			if (!this.serverLoadServices[tabId])
			{
				const ServiceClass = SERVER_LOAD_SERVICE_BY_TAB[tabId];
				const config = forwardTabRegistry.get(tabId);
				const locator = this.#createMinimalLocator(config.navigationTabId);

				const service = new ServiceClass(locator, `forward-${tabId}`, {});
				// BaseRecentService binds onInit to emitter event, but our noop emitter
				// never fires, so we call onInit manually
				service.onInit();

				this.serverLoadServices[tabId] = service;
			}

			return this.serverLoadServices[tabId];
		}

		/**
		 * @description Creates or reuses a ChatSearchProvider filtered by the active tab
		 */
		#ensureSearchProvider()
		{
			if (this.searchProviderTab === this.activeTab && this.searchProvider)
			{
				return;
			}

			const tabId = this.activeTab;
			this.searchProvider = this.#createSearchProviderForTab(tabId);
			this.searchProviderTab = tabId;
		}

		/**
		 * @private
		 * @param {string} tabId
		 * @return {ChatSearchProvider}
		 */
		#createSearchProviderForTab(tabId)
		{
			const recentTab = forwardTabRegistry.get(tabId).recentTab;

			return new ChatSearchProvider({
				localStrategy: new RecentSectionLocalSearchStrategy({
					section: recentTab,
					parentChatId: null,
				}),
				serverStrategy: new DefaultServerSearchStrategy({
					config: new ChatSearchConfig(null),
					recentTab,
				}),
				loadSearchProcessed: (itemIdList, needSearchOnServer) => {
					if (this.activeTab !== tabId)
					{
						return;
					}

					this.onSearchLocalComplete(itemIdList, needSearchOnServer);
				},
				loadSearchComplete: (itemIdList, query) => {
					if (this.activeTab !== tabId || this.processedQuery !== query)
					{
						return;
					}

					this.onSearchServerComplete(itemIdList);
				},
			});
		}

		/**
		 * @description Filters dialogs by tab config type filter and write permissions (single pass)
		 * @param {Array} dialogs
		 * @param {Object} filter
		 * @param {Array<string>} [filter.dialogTypes]
		 * @param {Array<string>} [filter.exceptDialogTypes]
		 * @return {Array}
		 */
		#filterAvailableDialogs(dialogs, filter)
		{
			return dialogs.filter((dialog) => {
				if (filter.dialogTypes && !filter.dialogTypes.includes(dialog.type))
				{
					return false;
				}

				if (filter.exceptDialogTypes && filter.exceptDialogTypes.includes(dialog.type))
				{
					return false;
				}

				if (dialog.textFieldEnabled === false)
				{
					return false;
				}

				if (dialog.type === DialogType.user || dialog.type === DialogType.private)
				{
					return true;
				}

				return ChatPermission.canPost(dialog);
			});
		}

		/**
		 * @description Reads current tab data from the Vuex store into this.items
		 */
		#loadItemsFromStore()
		{
			try
			{
				const config = forwardTabRegistry.get(this.activeTab);
				const recentItems = this.store.getters[config.recentGetter]();

				const dialogIds = recentItems
					.filter((item) => Type.isPlainObject(item))
					.map((item) => item.id)
				;

				const allDialogs = this.getDialogsByIds(dialogIds);
				const dialogs = this.#filterAvailableDialogs(allDialogs, config.filter);
				const preparedItems = this.prepareItemsForDrawing(dialogs);

				this.items = (this.activeTab === ForwardTab.chats && this.withFavorite)
					? this.withFavoriteItem(preparedItems)
					: preparedItems;
			}
			catch (error)
			{
				this.logger.error('#loadItemsFromStore() error:', error);
				this.items = [];
			}
		}

		/**
		 * @description Fetches tab data from server via ServerLoadService, then refreshes the list
		 * @param {string} tabId
		 * @return {Promise<void>}
		 */
		async #loadFromServerAndRefresh(tabId)
		{
			const currentItems = [...this.items];
			this.listener.onRecentResult([...currentItems, this.getLoadingItem()], true);

			try
			{
				const config = forwardTabRegistry.get(tabId);
				const service = this.#getServerLoadService(tabId);

				const result = await runAction(RestMethod.immobileMessengerLoad, {
					data: {
						methodList: [config.initMethod],
					},
				});

				await service.handleInitResult('forward', result);
				this.tabServerLoaded.add(tabId);
			}
			catch (error)
			{
				this.logger.error('#loadFromServerAndRefresh error:', error);
			}

			if (this.activeTab === tabId)
			{
				this.#loadItemsFromStore();
				this.listener.onRecentResult(this.items, true);
			}
		}

		/**
		 * @description Creates a minimal locator stub for ServerLoadService.
		 * Provides only the keys required by BaseRecentService constructor (id, emitter)
		 * and by processResult (recentSection, parentChatId).
		 * @param {string} navigationTabId
		 * @return {Object}
		 */
		#createMinimalLocator(navigationTabId)
		{
			const noopEmitter = {
				on: () => noopEmitter,
				once: () => noopEmitter,
				off: () => noopEmitter,
				emit: () => noopEmitter,
			};

			const data = {
				id: navigationTabId,
				emitter: noopEmitter,
				recentSection: RecentTabByNavigationTab[navigationTabId],
				parentChatId: 0,
			};

			return {
				get: (key) => data[key] ?? null,
				has: (key) => key in data,
				add: () => {},
			};
		}
	}

	module.exports = { ForwardDialogSelectorProvider };
});
