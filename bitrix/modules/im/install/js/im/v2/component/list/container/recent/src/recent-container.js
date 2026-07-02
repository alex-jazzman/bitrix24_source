import { Event, type JsonObject } from 'main.core';
import { EventEmitter } from 'main.core.events';

import { RecentList, RecentUnreadList } from 'im.v2.component.list.items.recent';
import { ChatSearchInput, RecentSearch } from 'im.v2.component.search';
import { Layout, EventType, ActionByUserType, RecentType, type LayoutType } from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';
import { Logger } from 'im.v2.lib.logger';
import { PermissionManager } from 'im.v2.lib.permission';
import { type ImModelLayout } from 'im.v2.model';
import { HeaderMenu } from 'im.v2.component.list.container.elements.header-menu';
import { VibeCodeCatalogButton } from 'im.v2.component.list.container.elements.vibe-code-catalog-button';

import { CreateChatMenu } from './components/create-chat-menu/create-chat-menu';

import './css/recent-container.css';

// @vue/component
export const RecentListContainer = {
	name: 'RecentListContainer',
	components: {
		HeaderMenu,
		CreateChatMenu,
		ChatSearchInput,
		RecentList,
		RecentSearch,
		RecentUnreadList,
		VibeCodeCatalogButton,
	},
	emits: ['selectChat'],
	data(): JsonObject
	{
		return {
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
		canCreateChat(): boolean
		{
			const actions = [
				ActionByUserType.createChat,
				ActionByUserType.createCollab,
				ActionByUserType.createChannel,
				ActionByUserType.createConference,
			];

			return actions.some((action) => PermissionManager.getInstance().canPerformActionByUserType(action));
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
		onSelectChat(dialogId)
		{
			this.$emit('selectChat', { layoutName: Layout.chat, dialogId });
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
			this.$store.dispatch('recent/clearUnreadCollection', { type: RecentType.default });
			this.unreadMode = !this.unreadMode;
		},
	},
	template: `
		<div class="bx-im-list-container-recent__scope bx-im-list-container-recent__container" ref="recent-container">
			<div class="bx-im-list-container-recent__header_container">
				<VibeCodeCatalogButton />
				<HeaderMenu
					:unreadMode="unreadMode"
					:recentSection="RecentType.default"
					@toggleUnreadMode="onToggleUnreadMode"
				/>
				<div class="bx-im-list-container-recent__search-input_container">
					<ChatSearchInput 
						:searchMode="searchMode" 
						:isLoading="searchMode && isSearchLoading"
						@openSearch="onOpenSearch"
						@closeSearch="onCloseRecentSearch"
						@updateSearch="onUpdateSearch"
					/>
				</div>
				<CreateChatMenu v-if="canCreateChat" />
			</div>
			<div class="bx-im-list-container-recent__elements_container">
				<div class="bx-im-list-container-recent__elements">
					<RecentSearch
						v-show="searchMode" 
						:searchMode="searchMode"
						:query="searchQuery"
						@loading="onSearchLoading"
						@openItem="onOpenSearchItem"
						@closeSearch="onCloseSearch"
					/>
					<RecentList v-if="!unreadMode" @selectChat="onSelectChat" />
					<RecentUnreadList v-else @selectChat="onSelectChat" />
				</div>
			</div>
		</div>
	`,
};
