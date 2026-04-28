import 'ui.design-tokens';
import 'ui.fonts.opensans';

import { Runtime, type JsonObject } from 'main.core';
import { BaseEvent } from 'main.core.events';

import { Utils } from 'im.v2.lib.utils';
import { EventType } from 'im.v2.const';
import { ScrollWithGradient } from 'im.v2.component.elements.scroll-with-gradient';
import { Loader } from 'im.v2.component.elements.loader';
import { sortByDate, type SearchResultItem } from 'im.v2.lib.search';
import { Analytics } from 'im.v2.lib.analytics';

import { SearchService } from '../../classes/search-service';
import { SearchContextMenu } from '../../classes/search-context-menu';
import { RecentSectionSearchConfig } from '../../const/const';
import { getFirstItemFromSearchResults } from '../../helpers/get-first-search-item';
import { getMinTokenSize } from '../../helpers/get-min-token-size';
import { mergeSearchItems } from '../../helpers/merge-search-items';
import { EmptyState } from '../elements/empty-state';
import { SearchItem } from '../elements/search-item';
import { RecentUsersCarousel } from '../elements/recent-users-carousel';

import '../css/chat-search.css';

import type { EventEmitter } from 'main.core.events';
import type { ImModelLayout } from 'im.v2.model';
import type { LayoutType } from 'im.v2.const';

// @vue/component
export const RecentSectionSearch = {
	name: 'ChatSearch',
	components: { ScrollWithGradient, SearchItem, EmptyState, RecentUsersCarousel, Loader },
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
		recentSection: {
			type: String,
			required: true,
		},
	},
	emits: ['loading', 'openItem', 'closeSearch'],
	data(): JsonObject
	{
		return {
			isRecentLoading: false,
			isServerLoading: false,

			currentServerQueries: 0,
			recentItems: [],
			searchResult: [],
		};
	},
	computed: {
		layout(): ImModelLayout
		{
			return this.$store.getters['application/getLayout'];
		},
		layoutName(): LayoutType
		{
			return this.layout.name;
		},
		cleanQuery(): string
		{
			return this.query.trim().toLowerCase();
		},
		showLatestSearchResult(): boolean
		{
			return this.cleanQuery.length === 0;
		},
		isEmptyState(): boolean
		{
			return this.searchResult.length === 0;
		},
	},
	watch: {
		cleanQuery(newQuery: string)
		{
			if (newQuery.length === 0)
			{
				this.cleanSearchResult();
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
				void this.loadRecentSearchFromServer();
			}
		},
	},
	created()
	{
		this.searchService = new SearchService(RecentSectionSearchConfig[this.recentSection]);
		this.searchOnServerDelayed = Runtime.debounce(this.searchOnServer, 400, this);

		this.initContextMenu();
		this.getEmitter().subscribe(EventType.search.keyPressed, this.onKeyPressed);

		void this.loadRecentSearchFromServer();
	},
	beforeUnmount()
	{
		this.getEmitter().unsubscribe(EventType.search.keyPressed, this.onKeyPressed);
	},
	methods: {
		initContextMenu()
		{
			this.contextMenuManager = new SearchContextMenu({ emitter: this.getEmitter() });
			this.contextMenuManager.subscribe(SearchContextMenu.events.openItem, (event: BaseEvent) => {
				this.$emit('openItem', event.getData());
			});
		},
		async loadRecentSearchFromServer()
		{
			this.isRecentLoading = true;
			this.recentItems = await this.searchService.loadLatestResults();
			this.isRecentLoading = false;
		},
		startSearch(query: string)
		{
			if (query.length > 0)
			{
				const result = this.searchService.searchLocal(query);
				if (query !== this.cleanQuery)
				{
					return;
				}

				this.searchResult = sortByDate(result);

				this.sendSearchResultAnalytics();
				Analytics.getInstance().recentSearch.onStart(this.layoutName);
			}

			if (query.length >= getMinTokenSize())
			{
				this.isServerLoading = true;
				this.searchOnServerDelayed(query);
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

			const searchResult = await this.searchService.search(query);
			if (query !== this.cleanQuery)
			{
				this.stopLoader();

				return;
			}
			const mergedItems = mergeSearchItems(this.searchResult, searchResult);
			this.searchResult = sortByDate(mergedItems);

			this.stopLoader();
		},
		sendSearchResultAnalytics()
		{
			if (this.searchResult.length === 0)
			{
				Analytics.getInstance().recentSearch.onShowNotFoundResult(this.layoutName);

				return;
			}

			Analytics.getInstance().recentSearch.onShowSuccessResult(this.layoutName);
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
		onOpenContextMenu(event)
		{
			const { dialogId, nativeEvent } = event;
			if (Utils.key.isAltOrOption(nativeEvent))
			{
				return;
			}

			this.contextMenuManager.openMenu({ dialogId }, nativeEvent.currentTarget);
		},
		onScroll()
		{
			this.contextMenuManager.destroy();
		},
		onClickRecentChatItem(event: { dialogId: string, nativeEvent: KeyboardEvent })
		{
			Analytics.getInstance().recentSearch.onSelectFromRecentChats(this.layoutName, event.dialogId);

			void this.onClickItem(event);
		},
		onClickRecentSearchItem(event: { dialogId: string, nativeEvent: KeyboardEvent })
		{
			Analytics.getInstance().recentSearch.onSelectFromRecentSearch(this.layoutName, event.dialogId);

			void this.onClickItem(event);
		},
		onClickSearchResultItem(event: { dialogId: string, nativeEvent: KeyboardEvent }, itemIndex: number)
		{
			Analytics.getInstance().recentSearch.onSelectFromSearchResult(this.layoutName, itemIndex + 1);

			void this.onClickItem(event);
		},
		async onClickItem(event: { dialogId: string, nativeEvent: KeyboardEvent })
		{
			const { dialogId, nativeEvent } = event;
			this.searchService.saveItemToRecentSearch(dialogId);

			this.$emit('openItem', { dialogId });

			if (!Utils.key.isAltOrOption(nativeEvent))
			{
				this.$emit('closeSearch');
			}
		},
		onKeyPressed(event: BaseEvent)
		{
			if (!this.searchMode)
			{
				return;
			}

			const { keyboardEvent } = event.getData();

			if (Utils.key.isCombination(keyboardEvent, 'Enter'))
			{
				this.onPressEnterKey(event);
			}
		},
		onPressEnterKey(keyboardEvent: KeyboardEvent)
		{
			const firstItem: ?SearchResultItem = getFirstItemFromSearchResults({
				searchResult: this.searchResult,
				recentItems: this.recentItems,
			});
			if (!firstItem)
			{
				return;
			}

			void this.onClickItem({
				dialogId: firstItem.dialogId,
				nativeEvent: keyboardEvent,
			});
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
		loc(key: string): string
		{
			return this.$Bitrix.Loc.getMessage(key);
		},
	},
	template: `
		<ScrollWithGradient :gradientHeight="28" :withShadow="false" @scroll="onScroll"> 
			<div class="bx-im-chat-search__container">
				<template v-if="showLatestSearchResult">
					<RecentUsersCarousel
						v-if="showUsersCarousel"
						@clickItem="onClickRecentChatItem"
						@openContextMenu="onOpenContextMenu"
					/>
					<div class="bx-im-chat-search__title">{{ loc('IM_SEARCH_SECTION_RECENT') }}</div>
					<SearchItem
						v-for="item in recentItems"
						:key="item.dialogId"
						:dialogId="item.dialogId"
						:titleTwoLine="true"
						@clickItem="onClickRecentSearchItem"
						@openContextMenu="onOpenContextMenu"
					/>
					<Loader v-if="isRecentLoading" class="bx-im-chat-search__loader" />
				</template>
				<template v-else>
					<SearchItem
						v-for="(item, index) in searchResult"
						:key="item.dialogId"
						:dialogId="item.dialogId"
						:dateMessage="item.dateMessage"
						:withDate="true"
						:query="cleanQuery"
						:titleTwoLine="true"
						@clickItem="onClickSearchResultItem($event, index)"
						@openContextMenu="onOpenContextMenu"
					/>
					<EmptyState v-if="isEmptyState" />
				</template>
			</div>
		</ScrollWithGradient> 
	`,
};
