import { Event, Text, type JsonObject } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { computed } from 'ui.vue3';

import { FilterRow, FilterMode, type FilterModeItem } from 'im.v2.component.list.container.elements.filter-row';
import { VibecodeAppList, VibecodeAppUnreadList } from 'im.v2.component.list.items.vibecode-app';
import { ChatSearchInput, RecentSearch } from 'im.v2.component.search';
import { EventType, Layout, RecentType, SystemFolderCode, type LayoutType } from 'im.v2.const';
import { Analytics, AnalyticsSection } from 'im.v2.lib.analytics';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { Logger } from 'im.v2.lib.logger';
import { type ImModelFolder, type ImModelLayout } from 'im.v2.model';

import './css/vibecode-app-container.css';

// The layout resolver only carries the folder code, while the list works with the folder id,
// so the container is the place where the code is turned into the identifier.
//
// The surrounding chrome — own root element, header with the search input, positioned element
// box — is not decoration: the list column is laid out by these three elements, and a bare list
// leaves a gap beside the column and an empty strip where the header belongs.
// @vue/component
export const VibecodeAppListContainer = {
	name: 'VibecodeAppListContainer',
	components: {
		VibecodeAppList,
		VibecodeAppUnreadList,
		ChatSearchInput,
		FilterRow,
		RecentSearch,
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
		folder(): ?ImModelFolder
		{
			return this.$store.getters['recent/folders/getByCode'](SystemFolderCode.vibecodeApp);
		},
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
			return this.$store.getters['counters/getCounterByRecentType'](RecentType.vibecodeApp);
		},
	},
	created()
	{
		Logger.warn('List: Vibecode app container created');

		EventEmitter.subscribe(EventType.recent.openSearch, this.onOpenSearch);
		Event.bind(document, 'mousedown', this.onDocumentClick);
	},
	beforeUnmount()
	{
		EventEmitter.unsubscribe(EventType.recent.openSearch, this.onOpenSearch);
		Event.unbind(document, 'mousedown', this.onDocumentClick);
	},
	methods: {
		onSelectChat(dialogId: string): void
		{
			this.$emit('selectChat', { layoutName: Layout.vibecodeApp, dialogId });
		},
		onOpenSearch(): void
		{
			if (!this.searchMode)
			{
				Analytics.getInstance().recentSearch.onOpen(this.layoutName);
			}

			this.searchMode = true;
		},
		onCloseSearch(): void
		{
			this.searchMode = false;
			this.searchQuery = '';
		},
		onCloseRecentSearch(): void
		{
			Analytics.getInstance().recentSearch.onClose(this.layoutName);

			this.onCloseSearch();
		},
		onUpdateSearch(query: string): void
		{
			this.searchMode = true;
			this.searchQuery = query;
		},
		onSearchLoading(value: boolean): void
		{
			this.isSearchLoading = value;
		},
		onOpenSearchItem(event: { dialogId: string }): void
		{
			this.onSelectChat(event.dialogId);
		},
		onChangeFilterMode(mode: FilterModeItem): void
		{
			this.unreadMode = mode === FilterMode.unread;
			if (this.unreadMode)
			{
				Analytics.getInstance().recentHeaderMenu.onOpenVibecodeAppUnreadMode(AnalyticsSection.filterRow);
			}
		},
		onDocumentClick(event: MouseEvent): void
		{
			const clickOnContainer = event.composedPath().includes(this.$refs['vibecode-app-container']);
			if (this.searchMode && !clickOnContainer)
			{
				this.onCloseSearch();
				Analytics.getInstance().recentSearch.onClose(this.layoutName);
			}
		},
	},
	// No folder means the gate is off or the code did not pass validation: nothing to render.
	// There is no chat creation control on purpose: the composition of the system folder is not
	// filled by hand, it follows the application chats the user has access to (AC-025).
	template: `
		<div v-if="folder" class="bx-im-list-container-vibecode-app__container" data-testid="im-list-vibecode-app" ref="vibecode-app-container">
			<div
				class="bx-im-list-container-vibecode-app__header_container"
				:class="{ '--with-filter-row': isShellNavigationAvailable }"
			>
				<div class="bx-im-list-container-vibecode-app__search-input_container">
					<ChatSearchInput
						data-testid="im-list-vibecode-app-search-input"
						:searchMode="searchMode"
						:isLoading="searchMode && isSearchLoading"
						:activateOnEnter="true"
						:searchAreaId="searchAreaId"
						@openSearch="onOpenSearch"
						@closeSearch="onCloseRecentSearch"
						@updateSearch="onUpdateSearch"
					/>
				</div>
			</div>
			<FilterRow
				v-if="isShellNavigationAvailable"
				:mode="filterMode"
				:counter="unreadCounter"
				:readAllSection="RecentType.vibecodeApp"
				@changeMode="onChangeFilterMode"
			/>
			<div class="bx-im-list-container-vibecode-app__elements_container">
				<div class="bx-im-list-container-vibecode-app__elements">
					<RecentSearch
						v-show="searchMode"
						:searchMode="searchMode"
						:query="searchQuery"
						:showUsersCarousel="false"
						:recentSectionType="RecentType.vibecodeApp"
						:withKeyboardNavigation="true"
						:searchAreaId="searchAreaId"
						@loading="onSearchLoading"
						@openItem="onOpenSearchItem"
						@closeSearch="onCloseSearch"
					/>
					<VibecodeAppList
						v-show="!searchMode && !unreadMode"
						:folderId="folder.id"
						:key="folder.id"
						@selectChat="onSelectChat"
					/>
					<VibecodeAppUnreadList
						v-if="unreadMode"
						v-show="!searchMode"
						@selectChat="onSelectChat"
					/>
				</div>
			</div>
		</div>
	`,
};
