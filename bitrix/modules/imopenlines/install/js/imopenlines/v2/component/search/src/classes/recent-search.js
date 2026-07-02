import { Runtime, type JsonObject } from 'main.core';
import { type BaseEvent } from 'main.core.events';

import { RecentSearchView } from 'im.v2.component.search';
import { sortByDate, mergeSearchItems } from 'im.v2.lib.search';

import { SearchService } from 'imopenlines.v2.provider.service';
import { RecentContextMenu } from 'imopenlines.v2.lib.menu';

import { getMinTokenSize } from '../helpers/get-min-token-size';

const SEARCH_DEBOUNCE_MS = 400;

// @vue/component
export const RecentSearch = {
	name: 'RecentSearch',
	components: { RecentSearchView },
	props: {
		query: {
			type: String,
			default: '',
		},
		searchMode: {
			type: Boolean,
			required: true,
		},
		showUsersCarousel: {
			type: Boolean,
			default: true,
		},
	},
	emits: ['loading', 'openItem', 'closeSearch'],
	data(): JsonObject
	{
		return {
			isRecentLoading: false,
			isServerLoading: false,
			searchResult: [],
			recentItems: [],
			currentServerQueries: 0,
		};
	},
	computed: {
		preparedQuery(): string
		{
			return this.query.trim().toLowerCase();
		},
	},
	watch: {
		preparedQuery(newQuery: string)
		{
			if (newQuery.length === 0)
			{
				this.isServerLoading = false;
				this.cleanSearchResult();

				return;
			}

			this.startSearch(newQuery);
		},
		isServerLoading(newValue: boolean)
		{
			this.$emit('loading', newValue);
		},
		searchMode(newValue: boolean)
		{
			if (!newValue)
			{
				this.searchService.clearSessionResult();
				void this.loadLatestSearchResults();
			}
		},
	},
	created()
	{
		this.searchService = new SearchService();
		this.runServerSearch = Runtime.debounce(this.searchOnServer, SEARCH_DEBOUNCE_MS, this);
		this.initContextMenu();

		void this.loadLatestSearchResults();
	},
	beforeUnmount()
	{
		this.runServerSearch = null;
		this.searchService = null;
		this.contextMenuManager = null;
	},
	methods: {
		async loadLatestSearchResults()
		{
			this.isRecentLoading = true;
			this.recentItems = await this.searchService.loadLatestResults();
			this.isRecentLoading = false;
		},
		startSearch(query: string)
		{
			const result = this.searchService.searchLocal(query);
			const isUserTyping = query !== this.preparedQuery;
			if (isUserTyping)
			{
				return;
			}

			this.searchResult = sortByDate(result);
			if (query.length >= getMinTokenSize())
			{
				this.isServerLoading = true;
				this.runServerSearch(query);
			}
		},
		cleanSearchResult()
		{
			this.searchResult = [];
			this.searchService.clearSessionResult();
		},
		async searchOnServer(query: string)
		{
			this.currentServerQueries++;

			const serverResult = await this.searchService.search(query);
			const isUserTyping = query !== this.preparedQuery;
			if (isUserTyping)
			{
				this.stopLoader();

				return;
			}

			const mergedItems = mergeSearchItems(this.searchResult, serverResult);
			this.searchResult = sortByDate(mergedItems);

			this.stopLoader();
		},
		stopLoader()
		{
			this.currentServerQueries--;
			if (this.currentServerQueries > 0)
			{
				return;
			}

			this.isServerLoading = false;
		},
		initContextMenu()
		{
			this.contextMenuManager = new RecentContextMenu();
			this.contextMenuManager.subscribe(RecentContextMenu.events.openItem, (event: BaseEvent) => {
				this.$emit('openItem', event.getData());
				this.$emit('closeSearch');
			});
		},
		onOpenContextMenu(event: { dialogId: string, target: HTMLElement })
		{
			this.contextMenuManager.openMenu({ dialogId: event.dialogId }, event.target);
		},
		onCloseContextMenu()
		{
			this.contextMenuManager.destroy();
		},
		onClickItem(event: { dialogId: string })
		{
			this.searchService.saveItemToRecentSearch(event.dialogId);
		},
		onOpenItem(event: { dialogId: string })
		{
			this.$emit('openItem', event);
		},
		onCloseSearch()
		{
			this.$emit('closeSearch');
		},
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
	`,
};
