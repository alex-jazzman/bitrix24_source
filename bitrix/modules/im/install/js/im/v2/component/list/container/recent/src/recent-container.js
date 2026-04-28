import { EventEmitter } from 'main.core.events';
import { Event } from 'main.core';

import { Messenger } from 'im.public';
import { PermissionManager } from 'im.v2.lib.permission';
import { RecentList } from 'im.v2.component.list.items.recent';
import { ChatSearchInput, RecentSectionSearch } from 'im.v2.component.search';
import { Layout, EventType, ActionByUserType, RecentType } from 'im.v2.const';
import { Logger } from 'im.v2.lib.logger';
import { Analytics } from 'im.v2.lib.analytics';

import { HeaderMenu } from './components/header-menu';
import { CreateChatMenu } from './components/create-chat-menu/create-chat-menu';
import { RecentUnreadListSlider } from './components/unread-slider/unread-slider';

import './css/recent-container.css';

import type { JsonObject } from 'main.core';
import type { ImModelLayout } from 'im.v2.model';
import type { LayoutType } from 'im.v2.const';

// @vue/component
export const RecentListContainer = {
	name: 'RecentListContainer',
	components: {
		HeaderMenu,
		CreateChatMenu,
		ChatSearchInput,
		RecentList,
		RecentSectionSearch,
		RecentUnreadListSlider,
	},
	emits: ['selectEntity'],
	data(): JsonObject
	{
		return {
			searchMode: false,
			unreadOnlyMode: false,
			searchQuery: '',
			isSearchLoading: false,
		};
	},
	computed:
	{
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
	methods:
	{
		onChatClick(dialogId)
		{
			this.$emit('selectEntity', { layoutName: Layout.chat, entityId: dialogId });
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
		onLoading(value: boolean)
		{
			this.isSearchLoading = value;
		},
		onOpenSearchItem(event: { dialogId: string })
		{
			const { dialogId } = event;

			this.onChatClick(dialogId);
		},
		onToggleUnreadMode()
		{
			this.$store.dispatch('recent/clearUnreadCollection', { type: RecentType.default });
			this.unreadOnlyMode = !this.unreadOnlyMode;
		},
	},
	template: `
		<div class="bx-im-list-container-recent__scope bx-im-list-container-recent__container" ref="recent-container">
			<RecentUnreadListSlider 
				:unreadOnlyMode="unreadOnlyMode" 
				@chatClick="onChatClick" 
				@toggleUnreadMode="onToggleUnreadMode"
			/>
			<div class="bx-im-list-container-recent__header_container">
				<HeaderMenu :unreadOnlyMode="unreadOnlyMode" @toggleUnreadMode="onToggleUnreadMode" />
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
					<RecentSectionSearch 
						v-show="searchMode" 
						:searchMode="searchMode"
						:query="searchQuery"
						:recentSection="RecentType.default"
						@loading="onLoading"
						@openItem="onOpenSearchItem"
						@closeSearch="onCloseSearch"
					/>
					<RecentList v-show="!searchMode && !unreadOnlyMode" @chatClick="onChatClick" />
				</div>
			</div>
		</div>
	`,
};
