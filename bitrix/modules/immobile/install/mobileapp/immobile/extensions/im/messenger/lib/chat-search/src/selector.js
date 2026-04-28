/**
 * @module im/messenger/lib/chat-search/src/selector
 */
jn.define('im/messenger/lib/chat-search/src/selector', (require, exports, module) => {
	const { Type } = require('type');
	const { EventType, ChatSearchSelectorSection } = require('im/messenger/const');
	const { Loc } = require('im/messenger/loc');
	const { ChatSearchProvider } = require('im/messenger/lib/chat-search/src/provider');
	const { RecentSearchUiConverter } = require('im/messenger/lib/converter/ui/recent-search');
	const { Logger } = require('im/messenger/lib/logger');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { MessengerEmitter } = require('im/messenger/lib/emitter');
	const { formatDateByDialogId } = require('im/messenger/lib/chat-search/src/helper/search-date-formatter');
	const { AnalyticsService } = require('im/messenger/provider/services/analytics');

	const CHAT_SEARCH_SELECTOR_DEFAULT_SECTIONS = {
		[ChatSearchSelectorSection.carousel]: {
			id: ChatSearchSelectorSection.carousel,
			title: Loc.getMessage('IMMOBILE_SEARCH_EXPERIMENTAL_RECENT_USERS_SECTION').toUpperCase(),
			backgroundColor: '#f6f7f8',
		},
		[ChatSearchSelectorSection.recent]: {
			id: ChatSearchSelectorSection.recent,
			backgroundColor: '#f6f7f8',
			title: Loc.getMessage('IMMOBILE_SEARCH_EXPERIMENTAL_RECENT_SECTION').toUpperCase(),
		},
		[ChatSearchSelectorSection.common]: {
			id: ChatSearchSelectorSection.common,
		},
	};

	class ChatSearchSelector
	{
		/**
		 *
		 * @param {JNBaseList} ui
		 * @param {object} params
		 * @param {DialoguesFilter} [params.filter]
		 * @param {string} [params.recentTab]
		 * @param {Array<string>} [params.sections]
		 */
		constructor(ui, params = {})
		{
			this.store = serviceLocator.get('core').getStore();
			this.ui = ui;
			this.isOpen = false;
			this.sections = {};

			this.filter = params.filter;
			this.recentTab = params.recentTab;
			this.enabledSections = params.sections;

			/**
			 * @protected
			 * @type {ChatSearchProvider}
			 */
			this.provider = null;

			/** @type {Array<string>} */
			this.recentItems = [];

			/** @type {Array<string>} */
			this.searchItems = [];

			/** @type {RecentCarouselItem | object} */
			this.selectedItem = null;

			this.isSearchStarted = false;

			this.isRecentLoading = false;

			this.showSearchItem = false;

			this.processedQuery = '';

			this.onScopeSelectedHandler = this.onScopeSelected.bind(this);
			this.onUserTypeTextHandler = this.onUserTypeText.bind(this);
			this.onSearchItemSelectedHandler = this.onSearchItemSelected.bind(this);
			this.searchSectionButtonClickHandler = this.searchSectionButtonClick.bind(this);

			this.initProvider();
			this.subscribeEvents();
			this.setSections();
		}

		open()
		{
			this.ui.showSearchBar();

			this.loadRecentSearchFromServer();
			this.isOpen = true;
			this.drawRecent(this.recentItems);

			AnalyticsService.getInstance().sendOpenSearch();
		}

		/**
		 * @private
		 */
		subscribeEvents()
		{
			this.ui.on(EventType.recent.scopeSelected, this.onScopeSelectedHandler);
			this.ui.on(EventType.recent.userTypeText, this.onUserTypeTextHandler);
			this.ui.on(EventType.recent.searchItemSelected, this.onSearchItemSelectedHandler);
			this.ui.on(EventType.recent.searchSectionButtonClick, this.searchSectionButtonClickHandler);
		}

		unsubscribeEvents()
		{
			this.ui.off(EventType.recent.scopeSelected, this.onScopeSelectedHandler);
			this.ui.off(EventType.recent.userTypeText, this.onUserTypeTextHandler);
			this.ui.off(EventType.recent.searchItemSelected, this.onSearchItemSelectedHandler);
			this.ui.off(EventType.recent.searchSectionButtonClick, this.searchSectionButtonClickHandler);
		}

		/**
		 * @protected
		 */
		initProvider()
		{
			this.provider = new ChatSearchProvider({
				filter: this.filter,
				recentTab: this.recentTab,
				loadLatestSearchProcessed: () => {
					Logger.log('ChatSearchSelector.loadLatestSearchProcessed');
					this.isRecentLoading = true;
				},
				loadLatestSearchComplete: (recentIds) => {
					Logger.log('ChatSearchSelector.loadLatestSearchComplete', recentIds);
					this.isRecentLoading = false;
					this.recentItems = recentIds;
					this.drawRecent(this.recentItems);
				},
				loadSearchProcessed: (localSearchIds, isStartServerSearch) => {
					Logger.log('ChatSearchSelector.loadSearchProcessed', localSearchIds, isStartServerSearch);
					this.showSearchItem = isStartServerSearch;

					this.searchItems = localSearchIds;
					this.drawSearch(localSearchIds);

					if (isStartServerSearch)
					{
						return;
					}

					AnalyticsService.getInstance().sendSearchResult(Type.isArrayFilled(localSearchIds));
				},
				loadSearchComplete: (searchIds, query) => {
					Logger.log('ChatSearchSelector.loadSearchComplete', searchIds, query);

					if (query !== this.processedQuery)
					{
						Logger.warn('ChatSearchSelector.loadSearchComplete: incoming query not equal processed, dont need redraw');

						return;
					}

					this.searchItems = searchIds;
					this.showSearchItem = false;
					this.drawSearch(searchIds);

					AnalyticsService.getInstance().sendSearchResult(Type.isArrayFilled(searchIds));
				},
			});
		}

		/**
		 * @param {Array<string>}recentIds
		 */
		drawRecent(recentIds)
		{
			if (this.processedQuery !== '')
			{
				Logger.warn('ChatSearchSelector.loadLatestSearchComplete: search is progress, dont need draw latest search result');

				return;
			}
			const result = [];

			if (ChatSearchSelectorSection.carousel in this.sections)
			{
				result.push(this.getCarouselItem());
			}

			recentIds.forEach((recentId) => {
				const item = this.prepareItemForDrawing(recentId, ChatSearchSelectorSection.recent);

				if (!item)
				{
					Logger.error('ChatSearchSelector.drawRecent: unknown chat or user id', recentId);

					return;
				}

				result.push(item);
			});

			if (this.isRecentLoading)
			{
				result.push(this.getLoadingItem());
			}
			Logger.log('ChatSearchSelector.drawRecent:', result);

			this.drawItems(result);
		}

		drawSearch(searchIds)
		{
			const result = [];
			searchIds.forEach((searchId) => {
				const item = this.prepareItemForDrawing(searchId, ChatSearchSelectorSection.common);

				if (!item)
				{
					return;
				}

				item.displayedDate = formatDateByDialogId(searchId);
				result.push(item);
			});

			if (this.showSearchItem)
			{
				result.push(this.getSearchingItem());
			}

			if (result.length === 0)
			{
				result.push(this.getEmptyItem());
			}

			this.drawItems(result);
		}

		/**
		 * @private
		 */
		drawItems(items)
		{
			if (!this.isOpen)
			{
				return;
			}

			const currentSections = new Map();
			items.forEach((item) => {
				if (!currentSections.has(item.sectionCode) && !Type.isUndefined(this.sections[item.sectionCode]))
				{
					currentSections.set(item.sectionCode, this.sections[item.sectionCode]);
				}
			});

			this.ui.setSearchResultItems(items, [...currentSections.values()]);
		}

		/**
		 * @private
		 * @param itemId
		 * @param sectionCode
		 * @return {object || null}
		 */
		prepareItemForDrawing(itemId, sectionCode)
		{
			if (DialogHelper.isChatId(itemId))
			{
				const userModel = this.store.getters['usersModel/getById'](Number(itemId));

				if (!userModel)
				{
					return null;
				}

				return RecentSearchUiConverter.toUserSearchItem(userModel, sectionCode);
			}

			if (DialogHelper.isDialogId(itemId))
			{
				const dialogModel = this.store.getters['dialoguesModel/getById'](itemId);

				if (!dialogModel)
				{
					return null;
				}

				return RecentSearchUiConverter.toDialogSearchItem(dialogModel, sectionCode);
			}

			return null;
		}

		/**
		 * @private
		 */
		setSections()
		{
			if (!Type.isArrayFilled(this.enabledSections))
			{
				this.sections = CHAT_SEARCH_SELECTOR_DEFAULT_SECTIONS;

				return;
			}

			this.enabledSections.forEach((section) => {
				if (Type.isPlainObject(CHAT_SEARCH_SELECTOR_DEFAULT_SECTIONS[section]))
				{
					this.sections[section] = CHAT_SEARCH_SELECTOR_DEFAULT_SECTIONS[section];
				}
			});
		}

		/**
		 * @private
		 * @return {{sectionCode: string, hideBottomLine: boolean, childItems: RecentCarouselItem[][], type: string}}
		 */
		getCarouselItem()
		{
			const carouselUserItems = this.provider.loadRecentUsers()
				.map((userId) => {
					const user = this.store.getters['usersModel/getById'](userId);

					return RecentSearchUiConverter.toUserCarouselItem(user, ChatSearchSelectorSection.carousel);
				})
			;

			return {
				type: 'carousel',
				sectionCode: ChatSearchSelectorSection.carousel,
				hideBottomLine: true,
				childItems: carouselUserItems,
			};
		}

		/**
		 * @private
		 * @return {{unselectable: boolean, sectionCode: string, id: string, title: string, type: string}}
		 */
		getLoadingItem()
		{
			return {
				id: 'loading',
				title: Loc.getMessage('IMMOBILE_SEARCH_EXPERIMENTAL_LOADING_ITEM'),
				type: 'loading',
				unselectable: true,
				sectionCode: ChatSearchSelectorSection.common,
			};
		}

		/**
		 * @private
		 * @return {{unselectable: boolean, sectionCode: string, id: string, title: string, type: string}}
		 */
		getSearchingItem()
		{
			return {
				id: 'loading',
				title: Loc.getMessage('IMMOBILE_SEARCH_EXPERIMENTAL_SEARCHING_ITEM'),
				type: 'loading',
				unselectable: true,
				sectionCode: ChatSearchSelectorSection.common,
			};
		}

		getEmptyItem()
		{
			return {
				id: 'empty',
				title: Loc.getMessage('IMMOBILE_SEARCH_EXPERIMENTAL_EMPTY_ITEM'),
				type: 'button',
				unselectable: true,
				sectionCode: ChatSearchSelectorSection.common,
			};
		}

		/**
		 * @private
		 */
		loadRecentSearchFromServer()
		{
			void this.provider.loadLatestSearch();
		}

		// region eventHandlers
		/**
		 * @private
		 * @param args
		 */
		onScopeSelected(...args)
		{
			console.log('onScopeSelected', args);
		}

		/**
		 * @private
		 * @param {string} text
		 * @param {string} scope
		 */
		onUserTypeText({ text, scope = '' })
		{
			if (!this.isSearchStarted)
			{
				AnalyticsService.getInstance().sendStartSearch();
				this.isSearchStarted = true;
			}

			const currentQuery = this.getClearQuery(text);

			if (currentQuery.length === 0)
			{
				this.processedQuery = '';
				this.drawRecent(this.recentItems);

				return;
			}

			if (currentQuery === this.processedQuery)
			{
				return;
			}

			this.processedQuery = currentQuery;

			void this.provider.doSearch(currentQuery);
		}

		/**
		 * @private
		 * @param {RecentCarouselItem || object} item
		 */
		onSearchItemSelected(item)
		{
			const dialogId = item.params && item.params.id ? item.params.id : null;
			if (dialogId === null)
			{
				return;
			}

			this.selectedItem = item;
			this.provider.saveItemToRecent(dialogId)
				.then(() => {
					this.loadRecentSearchFromServer();
				})
				.catch((error) => {
					Logger.error('ChatSearchSelector.saveItemToRecent', error);
				})
			;

			MessengerEmitter.emit(EventType.messenger.openDialog, { dialogId });

			if (!this.isSearchStarted)
			{
				AnalyticsService.getInstance().sendClickRecentSuggest(dialogId, item.sectionCode);
			}

			const selectedSearchItemIndex = this.searchItems.indexOf(String(dialogId));
			if (selectedSearchItemIndex > -1)
			{
				AnalyticsService.getInstance().sendSelectSearchResult(selectedSearchItemIndex);
			}
		}

		/**
		 * @private
		 * @param args
		 */
		searchSectionButtonClick(...args)
		{
			console.log('searchSectionButtonClick', args);
		}
		// endregion

		/**
		 * @private
		 * @param {string} text
		 * @return {string}
		 */
		getClearQuery(text)
		{
			return text.trim().toLocaleLowerCase(env.languageId);
		}

		close()
		{
			this.processedQuery = '';
			this.recentItems = [];
			this.searchItems = [];
			this.isSearchStarted = false;

			if (Type.isNil(this.selectedItem))
			{
				AnalyticsService.getInstance().sendCancelSearch();
			}
		}
	}

	module.exports = { ChatSearchSelector };
});
