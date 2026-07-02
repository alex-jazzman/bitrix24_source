/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Openlines = this.BX.Messenger.v2.Openlines || {};
(function (exports, main_core, im_v2_component_search, im_v2_lib_search, imopenlines_v2_provider_service, imopenlines_v2_lib_menu) {
	'use strict';

	const DEFAULT_MIN_TOKEN_SIZE = 3;
	const getMinTokenSize = () => {
		const settings = main_core.Extension.getSettings('im.v2.component.search');
		return settings.get('minTokenSize', DEFAULT_MIN_TOKEN_SIZE);
	};

	const SEARCH_DEBOUNCE_MS = 400;

	// @vue/component
	const RecentSearch = {
		name: 'RecentSearch',
		components: {
			RecentSearchView: im_v2_component_search.RecentSearchView
		},
		props: {
			query: {
				type: String,
				default: ''
			},
			searchMode: {
				type: Boolean,
				required: true
			},
			showUsersCarousel: {
				type: Boolean,
				default: true
			}
		},
		emits: ['loading', 'openItem', 'closeSearch'],
		data() {
			return {
				isRecentLoading: false,
				isServerLoading: false,
				searchResult: [],
				recentItems: [],
				currentServerQueries: 0
			};
		},
		computed: {
			preparedQuery() {
				return this.query.trim().toLowerCase();
			}
		},
		watch: {
			preparedQuery(newQuery) {
				if (newQuery.length === 0) {
					this.isServerLoading = false;
					this.cleanSearchResult();
					return;
				}
				this.startSearch(newQuery);
			},
			isServerLoading(newValue) {
				this.$emit('loading', newValue);
			},
			searchMode(newValue) {
				if (!newValue) {
					this.searchService.clearSessionResult();
					void this.loadLatestSearchResults();
				}
			}
		},
		created() {
			this.searchService = new imopenlines_v2_provider_service.SearchService();
			this.runServerSearch = main_core.Runtime.debounce(this.searchOnServer, SEARCH_DEBOUNCE_MS, this);
			this.initContextMenu();
			void this.loadLatestSearchResults();
		},
		beforeUnmount() {
			this.runServerSearch = null;
			this.searchService = null;
			this.contextMenuManager = null;
		},
		methods: {
			async loadLatestSearchResults() {
				this.isRecentLoading = true;
				this.recentItems = await this.searchService.loadLatestResults();
				this.isRecentLoading = false;
			},
			startSearch(query) {
				const result = this.searchService.searchLocal(query);
				const isUserTyping = query !== this.preparedQuery;
				if (isUserTyping) {
					return;
				}
				this.searchResult = im_v2_lib_search.sortByDate(result);
				if (query.length >= getMinTokenSize()) {
					this.isServerLoading = true;
					this.runServerSearch(query);
				}
			},
			cleanSearchResult() {
				this.searchResult = [];
				this.searchService.clearSessionResult();
			},
			async searchOnServer(query) {
				this.currentServerQueries++;
				const serverResult = await this.searchService.search(query);
				const isUserTyping = query !== this.preparedQuery;
				if (isUserTyping) {
					this.stopLoader();
					return;
				}
				const mergedItems = im_v2_lib_search.mergeSearchItems(this.searchResult, serverResult);
				this.searchResult = im_v2_lib_search.sortByDate(mergedItems);
				this.stopLoader();
			},
			stopLoader() {
				this.currentServerQueries--;
				if (this.currentServerQueries > 0) {
					return;
				}
				this.isServerLoading = false;
			},
			initContextMenu() {
				this.contextMenuManager = new imopenlines_v2_lib_menu.RecentContextMenu();
				this.contextMenuManager.subscribe(imopenlines_v2_lib_menu.RecentContextMenu.events.openItem, event => {
					this.$emit('openItem', event.getData());
					this.$emit('closeSearch');
				});
			},
			onOpenContextMenu(event) {
				this.contextMenuManager.openMenu({
					dialogId: event.dialogId
				}, event.target);
			},
			onCloseContextMenu() {
				this.contextMenuManager.destroy();
			},
			onClickItem(event) {
				this.searchService.saveItemToRecentSearch(event.dialogId);
			},
			onOpenItem(event) {
				this.$emit('openItem', event);
			},
			onCloseSearch() {
				this.$emit('closeSearch');
			}
		},
		template: `
		<RecentSearchView
			:searchMode="searchMode"
			:searchResult="searchResult"
			:recentItems="recentItems"
			:isRecentLoading="isRecentLoading"
			:query="query"
			:showUsersCarousel="showUsersCarousel"
			@clickItem="onClickItem"
			@openItem="onOpenItem"
			@closeSearch="onCloseSearch"
			@openContextMenu="onOpenContextMenu"
			@closeContextMenu="onCloseContextMenu"
		/>
	`
	};

	exports.RecentSearch = RecentSearch;

})(this.BX.Messenger.v2.Openlines.Component = this.BX.Messenger.v2.Openlines.Component || {}, BX, BX.Messenger.v2.Component, BX.Messenger.v2.Lib, BX.OpenLines.v2.Provider.Service, BX.OpenLines.v2.Lib);
//# sourceMappingURL=registry.bundle.js.map
