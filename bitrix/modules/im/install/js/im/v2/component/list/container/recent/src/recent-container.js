import { Event, Text, type JsonObject } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { computed } from 'ui.vue3';

import { RecentList, RecentUnreadList } from 'im.v2.component.list.items.recent';
import { ChatSearchInput, RecentSearch } from 'im.v2.component.search';
import { EventType, RecentType, type LayoutType } from 'im.v2.const';
import { Analytics, AnalyticsSection } from 'im.v2.lib.analytics';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { FolderManager } from 'im.v2.lib.folder';
import { Logger } from 'im.v2.lib.logger';
import { type ImModelLayout } from 'im.v2.model';
import { FilterRow, FilterMode, type FilterModeItem } from 'im.v2.component.list.container.elements.filter-row';
import { HeaderMenu } from 'im.v2.component.list.container.elements.header-menu';
import { VibeCodeCatalogButton } from 'im.v2.component.list.container.elements.vibe-code-catalog-button';

import { CreateChatMenu } from './components/create-chat-menu/create-chat-menu';

import './css/recent-container.css';

export { CreateChatMenu } from './components/create-chat-menu/create-chat-menu';

// @vue/component
export const RecentListContainer = {
	name: 'RecentListContainer',
	components: {
		HeaderMenu,
		CreateChatMenu,
		ChatSearchInput,
		FilterRow,
		RecentList,
		RecentSearch,
		RecentUnreadList,
		VibeCodeCatalogButton,
	},
	provide(): { avatarsOnly: boolean }
	{
		return {
			avatarsOnly: computed(() => this.avatarsOnly),
		};
	},
	props: {
		avatarsOnly: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['selectChat'],
	data(): JsonObject
	{
		return {
			searchAreaId: Text.getRandom(),
			searchMode: false,
			unreadMode: false,
			searchQuery: '',
			isSearchLoading: false,
		};
	},
	computed: {
		RecentType: () => RecentType,
		layout(): ImModelLayout
		{
			return this.$store.getters['application/getLayout'];
		},
		layoutName(): LayoutType
		{
			return this.layout.name;
		},
		isShellNavigationAvailable(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isChatShellNavigationWebAvailable);
		},
		filterMode(): FilterModeItem
		{
			return this.unreadMode ? FilterMode.unread : FilterMode.all;
		},
		unreadCounter(): number
		{
			return this.$store.getters['counters/getTotalChatCounter'];
		},
	},
	created()
	{
		Logger.warn('List: Recent container created');

		EventEmitter.subscribe(EventType.recent.openSearch, this.onOpenSearch);
		Event.bind(document, 'mousedown', this.onDocumentClick);
	},
	beforeUnmount()
	{
		EventEmitter.unsubscribe(EventType.recent.openSearch, this.onOpenSearch);
		Event.unbind(document, 'mousedown', this.onDocumentClick);
	},
	methods: {
		// This container is mounted not only in the chats layout: it also stands on the left in
		// notifications, in the chat and folder forms, in project copying and in the conference. The
		// emitted name goes straight into setLayout, so a hardcoded chats layout would drop the user
		// into a hidden section. Those layouts now pick their list by the same rule, so this line
		// serves the rollback branch alone - with the All folder in place the list is the one of the
		// All folder and it carries its own layout name.
		onSelectChat(dialogId)
		{
			this.$emit('selectChat', { layoutName: FolderManager.getRegularChatsLayout().name, dialogId });
		},
		onOpenSearch()
		{
			if (!this.searchMode)
			{
				Analytics.getInstance().recentSearch.onOpen(this.layoutName);
			}

			this.searchMode = true;
		},
		onCloseSearch()
		{
			this.searchMode = false;
			this.searchQuery = '';
		},
		onCloseRecentSearch()
		{
			Analytics.getInstance().recentSearch.onClose(this.layoutName);

			this.onCloseSearch();
		},
		onUpdateSearch(query)
		{
			this.searchMode = true;
			this.searchQuery = query;
		},
		onDocumentClick(event: MouseEvent)
		{
			const clickOnRecentContainer = event.composedPath().includes(this.$refs['recent-container']);
			if (this.searchMode && !clickOnRecentContainer)
			{
				this.onCloseSearch();
				Analytics.getInstance().recentSearch.onClose(this.layoutName);
			}
		},
		onSearchLoading(value: boolean)
		{
			this.isSearchLoading = value;
		},
		onOpenSearchItem(event: { dialogId: string })
		{
			const { dialogId } = event;

			this.onSelectChat(dialogId);
		},
		onToggleUnreadMode()
		{
			this.unreadMode = !this.unreadMode;
		},
		onChangeFilterMode(mode: FilterModeItem)
		{
			this.unreadMode = mode === FilterMode.unread;
			if (this.unreadMode)
			{
				Analytics.getInstance().recentHeaderMenu.onOpenUnreadMode(AnalyticsSection.filterRow);
			}
		},
	},
	template: `
		<div class="bx-im-list-container-recent__scope bx-im-list-container-recent__container" data-testid="im-list-recent" ref="recent-container">
			<!-- In the compact collab peek the header is occluded by the drawer; keep it out of the tab order (mouse there is moot). -->
			<div
				class="bx-im-list-container-recent__header_container"
				:class="{ '--with-filter-row': isShellNavigationAvailable }"
				:inert="avatarsOnly || null"
			>
				<VibeCodeCatalogButton />
				<HeaderMenu
					v-if="!isShellNavigationAvailable"
					:unreadMode="unreadMode"
					:recentSection="RecentType.default"
					@toggleUnreadMode="onToggleUnreadMode"
				/>
				<div class="bx-im-list-container-recent__search-input_container">
					<ChatSearchInput
						:searchMode="searchMode"
						:isLoading="searchMode && isSearchLoading"
						:activateOnEnter="true"
						:searchAreaId="searchAreaId"
						@openSearch="onOpenSearch"
						@closeSearch="onCloseRecentSearch"
						@updateSearch="onUpdateSearch"
					/>
				</div>
				<CreateChatMenu />
			</div>
			<FilterRow
				v-if="isShellNavigationAvailable"
				:mode="filterMode"
				:counter="unreadCounter"
				:readAllSection="RecentType.default"
				:inert="avatarsOnly || null"
				:aria-hidden="avatarsOnly ? 'true' : null"
				@changeMode="onChangeFilterMode"
			/>
			<div class="bx-im-list-container-recent__elements_container">
				<div class="bx-im-list-container-recent__elements">
					<RecentSearch
						v-show="searchMode" 
						:searchMode="searchMode"
						:query="searchQuery"
						:withKeyboardNavigation="true"
						:searchAreaId="searchAreaId"
						@loading="onSearchLoading"
						@openItem="onOpenSearchItem"
						@closeSearch="onCloseSearch"
					/>
					<RecentList v-show="!searchMode && !unreadMode" @selectChat="onSelectChat" />
					<RecentUnreadList v-if="unreadMode" @selectChat="onSelectChat" />
				</div>
			</div>
		</div>
	`,
};
