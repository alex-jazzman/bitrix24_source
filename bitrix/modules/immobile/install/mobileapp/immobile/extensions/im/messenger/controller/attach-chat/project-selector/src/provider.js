/**
 * @module im/messenger/controller/attach-chat/project-selector/src/provider
 */
jn.define('im/messenger/controller/attach-chat/project-selector/src/provider', (require, exports, module) => {
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

	const CollabServerLoadService = require('im/messenger/controller/recent/service/server-load/collab');

	/**
	 * @class ProjectDialogSelectorProvider
	 * Provides a list of collab (project) dialogs where the current user can manage members (add users).
	 * Excludes the source chat (chatId) so a chat cannot be attached to itself.
	 */
	class ProjectDialogSelectorProvider extends BaseSelectorProvider
	{
		/**
		 * @param {string} context
		 * @param {Object} options
		 * @param {string|number} [options.chatId] - dialog id of the chat being attached (excluded from list)
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

			this.logger = getLoggerWithContext('project-selector-provider', this);

			/** @type {string|null} */
			this.excludedChatId = options.chatId ? String(options.chatId) : null;

			this.serverLoaded = false;

			/** @type {CollabServerLoadService|null} */
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
		 * Reads collab recent items from Vuex store into this.items.
		 */
		#loadItemsFromStore()
		{
			try
			{
				const recentItems = this.store.getters['recentModel/getCollabFirstPage']();

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
		 * Fetches collab list from server once, then refreshes the list.
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
			// No cached items yet: skip the intermediate empty emit. The final
			// onRecentResult below emits the resolved list, or an empty result
			// when the server returns none.

			try
			{
				const service = this.#getServerLoadService();

				const result = await runAction(RestMethod.immobileMessengerLoad, {
					data: {
						methodList: [MessengerInitRestMethod.collabList],
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
		 * @return {CollabServerLoadService}
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
							id: NavigationTabId.collab,
							emitter: noopEmitter,
							recentSection: RecentTabByNavigationTab[NavigationTabId.collab],
							parentChatId: 0,
						};

						return data[key] ?? null;
					},
					has: (key) => ['id', 'emitter', 'recentSection', 'parentChatId'].includes(key),
					add: () => {},
				};

				this.serverLoadService = new CollabServerLoadService(locator, 'attach-chat-project', {});
				this.serverLoadService.onInit();
			}

			return this.serverLoadService;
		}

		/**
		 * Creates or reuses the ChatSearchProvider for collab dialogs.
		 */
		#ensureSearchProvider()
		{
			if (this.searchProvider)
			{
				return;
			}

			this.searchProvider = new ChatSearchProvider({
				localStrategy: new RecentSectionLocalSearchStrategy({
					section: RecentTab.collab,
					parentChatId: null,
				}),
				serverStrategy: new DefaultServerSearchStrategy({
					config: new ChatSearchConfig(null),
					recentTab: RecentTab.collab,
					dynamicOptions: () => ({
						searchRecentSection: RecentTab.collab,
						onlyWithManageUsersAddRight: true,
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
		 * Client-side filter must mirror the server-side onlyWithManageUsersAddRight=true:
		 * canAddParticipants checks dialog.permissions.manageUsersAdd which maps to the
		 * same backend permission. Source chat is excluded to prevent attaching to itself.
		 *
		 * @param {Array} dialogs
		 * @return {Array}
		 */
		#filterAvailableDialogs(dialogs)
		{
			return dialogs.filter((dialog) => {
				if (dialog.type !== DialogType.collab)
				{
					return false;
				}

				if (this.excludedChatId && String(dialog.dialogId) === this.excludedChatId)
				{
					return false;
				}

				return ChatPermission.canAddParticipants(dialog);
			});
		}
	}

	module.exports = { ProjectDialogSelectorProvider };
});
