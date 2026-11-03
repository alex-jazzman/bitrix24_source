import { Event, Text, type JsonObject } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { computed } from 'ui.vue3';

import { Analytics } from 'im.v2.lib.analytics';
import { PersonalFolderList } from 'im.v2.component.list.items.folder';
import { CreateChatMenu } from 'im.v2.component.list.container.recent';
import { ChatSearchInput, RecentSearch } from 'im.v2.component.search';
import { EventType, Layout, type LayoutType } from 'im.v2.const';
import { Logger } from 'im.v2.lib.logger';
import { type ImModelLayout } from 'im.v2.model';

import './css/folder-container.css';

// @vue/component
export const PersonalFolderListContainer = {
	name: 'PersonalFolderListContainer',
	components: { PersonalFolderList, ChatSearchInput, RecentSearch, CreateChatMenu },
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
			searchQuery: '',
			isSearchLoading: false,
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
		isFolderLayout(): boolean
		{
			return this.layoutName === Layout.folder;
		},
		folderId(): number
		{
			return this.layout.params.folderId;
		},
		// Every personal folder allows the same chats, so the scope of the mode needs no folder id
		// The eligibility mode replaces the section, so it is cleared instead of defaulting to plain chats.
		searchParams(): { searchFolderEligible: boolean }
		{
			return { searchFolderEligible: true };
		},
	},
	created()
	{
		Logger.warn('List: Folder container created');

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
			this.$emit('selectChat', { layoutName: Layout.folder, dialogId });
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
			const clickOnRecentContainer = event.composedPath().includes(this.$refs['folder-container']);
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
	},
	template: `
		<div
			class="bx-im-list-container-folder__container"
			data-testid="im-list-folder"
			ref="folder-container"
		>
			<div v-if="isFolderLayout" class="bx-im-list-container-folder__header_container" :inert="avatarsOnly || null">
				<div class="bx-im-list-container-folder__search-input_container">
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
			<div class="bx-im-list-container-folder__elements_container">
				<div class="bx-im-list-container-folder__elements">
					<RecentSearch
						v-if="isFolderLayout"
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
					<KeepAlive>
						<PersonalFolderList
							v-if="isFolderLayout"
							v-show="!searchMode"
							:folderId="folderId"
							@selectChat="onSelectChat"
						/>
					</KeepAlive>
				</div>
			</div>
		</div>
	`,
};
