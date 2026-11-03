import { Event, Text, type JsonObject } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { computed } from 'ui.vue3';

import { AllFolderList, AllFolderUnreadList } from 'im.v2.component.list.items.folder';
import { FilterRow, FilterMode, type FilterModeItem } from 'im.v2.component.list.container.elements.filter-row';
import { HeaderMenu } from 'im.v2.component.list.container.elements.header-menu';
import { VibeCodeCatalogButton } from 'im.v2.component.list.container.elements.vibe-code-catalog-button';
import { CreateChatMenu } from 'im.v2.component.list.container.recent';
import { ChatSearchInput, RecentSearch } from 'im.v2.component.search';
import { EventType, Layout, RecentType, SystemFolderCode, type LayoutType, type RecentTypeItem } from 'im.v2.const';
import { Analytics, AnalyticsSection } from 'im.v2.lib.analytics';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { Logger } from 'im.v2.lib.logger';
import { type ImModelFolder, type ImModelFolderDefinition, type ImModelLayout } from 'im.v2.model';

import './css/all-container.css';

// @vue/component
export const AllFolderListContainer = {
	name: 'AllFolderListContainer',
	components: {
		AllFolderList,
		AllFolderUnreadList,
		ChatSearchInput,
		RecentSearch,
		CreateChatMenu,
		FilterRow,
		HeaderMenu,
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
		SystemFolderCode: () => SystemFolderCode,
		layout(): ImModelLayout
		{
			return this.$store.getters['application/getLayout'];
		},
		layoutName(): LayoutType
		{
			return this.layout.name;
		},
		folder(): ?ImModelFolder
		{
			// This container serves exactly one system folder, so its identity comes from the
			// folder registry and not from the layout the user happens to be on.
			return this.$store.getters['recent/folders/getByCode'](SystemFolderCode.all);
		},
		folderId(): number
		{
			return this.folder.id;
		},
		// The folder scope replaces the section, so the section is cleared instead of defaulting to plain chats.
		searchParams(): { searchFolderId: number }
		{
			return { searchFolderId: this.folderId };
		},
		compositionKey(): string
		{
			// The union of the list is built from the sections, so the key follows them and not the source
			// codes: a source the user cannot see gives no section and leaves the list as it was. Sorting is
			// required because the same set may arrive from the server in another order.
			const sections: RecentTypeItem[] = this.$store.getters['recent/folders/getSourceSections'](this.folderId);

			return [...sections].sort().join(',');
		},
		listKey(): string
		{
			return `${this.compositionKey}:all`;
		},
		unreadListKey(): string
		{
			return `${this.compositionKey}:unread`;
		},
		isShellNavigationAvailable(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isChatShellNavigationWebAvailable);
		},
		filterMode(): FilterModeItem
		{
			return this.unreadMode ? FilterMode.unread : FilterMode.all;
		},
		// The same counter the funnel of this folder and its badge in the panel show: the folder unites
		// several sections, so the number comes from their set and not from a single recent section.
		unreadCounter(): number
		{
			const definitions: ImModelFolderDefinition[] = this.$store.getters['recent/folders/getSourceDefinitions'](
				this.folderId,
			);

			return this.$store.getters['counters/getCounterByRecentSections'](definitions);
		},
	},
	created()
	{
		Logger.warn('List: All folder container created');

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
			// Opening a chat keeps the user in the folder, so the folder layout travels with the event.
			this.$emit('selectChat', { layoutName: Layout.folderAll, dialogId });
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
			const clickOnRecentContainer = event.composedPath().includes(this.$refs['all-folder-container']);
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
	// No folder in the registry means the gate went off: there is nothing to build the column from.
	template: `
		<div v-if="folder" class="bx-im-list-container-folder-all__container" data-testid="im-list-folder-all" ref="all-folder-container">
			<!-- In the compact collab peek the header is occluded by the drawer; keep it out of the tab order (mouse there is moot). -->
			<div
				class="bx-im-list-container-folder-all__header_container"
				:class="{ '--with-filter-row': isShellNavigationAvailable }"
				:inert="avatarsOnly || null"
			>
				<VibeCodeCatalogButton />
				<HeaderMenu
					v-if="!isShellNavigationAvailable"
					data-testid="im-list-folder-all-header-menu-trigger"
					:unreadMode="unreadMode"
					:menuKey="SystemFolderCode.all"
					@toggleUnreadMode="onToggleUnreadMode"
				/>
				<div class="bx-im-list-container-folder-all__search-input_container">
					<ChatSearchInput
						data-testid="im-list-folder-all-search-input"
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
			<div class="bx-im-list-container-folder-all__elements_container">
				<div class="bx-im-list-container-folder-all__elements">
					<RecentSearch
						v-show="searchMode"
						:searchMode="searchMode"
						:query="searchQuery"
						:recentSectionType="null"
						:additionalSearchParams="searchParams"
						:withKeyboardNavigation="true"
						:searchAreaId="searchAreaId"
						@loading="onSearchLoading"
						@openItem="onOpenSearchItem"
						@closeSearch="onCloseSearch"
					/>
					<AllFolderList
						v-show="!searchMode && !unreadMode"
						:key="listKey"
						:folderId="folderId"
						@selectChat="onSelectChat"
					/>
					<AllFolderUnreadList
						v-if="unreadMode"
						v-show="!searchMode"
						:key="unreadListKey"
						:folderId="folderId"
						@selectChat="onSelectChat"
					/>
				</div>
			</div>
		</div>
	`,
};
