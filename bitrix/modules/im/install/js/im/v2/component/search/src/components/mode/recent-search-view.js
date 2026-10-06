import { type BaseEvent, type EventEmitter } from 'main.core.events';
import 'ui.design-tokens';
import 'ui.fonts.opensans';

import { Loader } from 'im.v2.component.elements.loader';
import { ScrollWithGradient } from 'im.v2.component.elements.scroll-with-gradient';
import { EventType, type LayoutType } from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';
import { type SearchResultItem } from 'im.v2.lib.search';
import { Utils } from 'im.v2.lib.utils';
import { type ImModelLayout } from 'im.v2.model';

import { getFirstItemFromSearchResults } from '../../helpers/get-first-search-item';
import { SearchEmptyState } from '../elements/empty-state/search';
import { RecentEmptyState } from '../elements/empty-state/recent';
import { RecentUsersCarousel } from '../elements/recent-users-carousel';
import { SearchItem } from '../elements/search-item';

import '../css/chat-search.css';

// @vue/component
export const RecentSearchView = {
	name: 'ChatSearch',
	components: { ScrollWithGradient, SearchItem, SearchEmptyState, RecentEmptyState, RecentUsersCarousel, Loader },
	props: {
		searchResult: {
			type: Array,
			default: () => [],
		},
		recentItems: {
			type: Array,
			default: () => [],
		},
		isRecentLoading: {
			type: Boolean,
			default: false,
		},
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
	emits: ['openItem', 'closeSearch', 'clickItem', 'openContextMenu', 'closeContextMenu'],
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
		isEmptyRecentState(): boolean
		{
			return this.recentItems.length === 0;
		},
		hasRecentSearchSection(): boolean
		{
			return this.recentItems.length > 0 || this.isRecentLoading;
		},
	},
	created()
	{
		this.getEmitter().subscribe(EventType.search.keyPressed, this.onKeyPressed);
	},
	beforeUnmount()
	{
		this.getEmitter().unsubscribe(EventType.search.keyPressed, this.onKeyPressed);
	},
	methods: {
		onOpenContextMenu(event)
		{
			const { dialogId, nativeEvent } = event;
			if (Utils.key.isAltOrOption(nativeEvent))
			{
				return;
			}

			this.$emit('openContextMenu', { dialogId, target: nativeEvent.currentTarget });
		},
		onScroll()
		{
			this.$emit('closeContextMenu');
		},
		onClickRecentChatItem(event: { dialogId: string, nativeEvent: KeyboardEvent })
		{
			Analytics.getInstance().recentSearch.onSelectFromRecentChats(this.layoutName, event.dialogId);

			this.onClickItem(event);
		},
		onClickRecentSearchItem(event: { dialogId: string, nativeEvent: KeyboardEvent })
		{
			Analytics.getInstance().recentSearch.onSelectFromRecentSearch(this.layoutName, event.dialogId);

			this.onClickItem(event);
		},
		onClickSearchResultItem(event: { dialogId: string, nativeEvent: KeyboardEvent }, itemIndex: number)
		{
			Analytics.getInstance().recentSearch.onSelectFromSearchResult(this.layoutName, itemIndex + 1);

			this.onClickItem(event);
		},
		onClickItem(event: { dialogId: string, nativeEvent: KeyboardEvent })
		{
			const { dialogId, nativeEvent } = event;

			this.$emit('clickItem', { dialogId });
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

			this.onClickItem({
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
		<ScrollWithGradient v-if="searchMode" @scroll="onScroll"> 
			<div class="bx-im-chat-search__container">
				<template v-if="showLatestSearchResult">
					<RecentUsersCarousel
						v-if="showUsersCarousel"
						@clickItem="onClickRecentChatItem"
						@openContextMenu="onOpenContextMenu"
					/>
					<template v-if="hasRecentSearchSection">
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
					<RecentEmptyState v-else-if="isEmptyRecentState" />
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
					<SearchEmptyState v-if="isEmptyState" />
				</template>
			</div>
		</ScrollWithGradient>
	`,
};
