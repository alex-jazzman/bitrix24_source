import { Event, Extension, type JsonObject } from 'main.core';

import { ChatSearchInput } from 'im.v2.component.search';
import { Layout, ChatType } from 'im.v2.const';

import { RecentList } from 'imopenlines.v2.component.list.items.recent';
import { RecentSearch } from 'imopenlines.v2.component.search';
import 'imopenlines.v2.css.tokens';

import './css/recent-container.css';

// @vue/component
export const RecentListContainer = {
	name: 'RecentListContainer',
	components: { RecentList, ChatSearchInput, RecentSearch },
	emits: ['selectChat'],
	data(): JsonObject
	{
		return {
			searchMode: false,
			searchQuery: '',
			isSearchLoading: false,
		};
	},
	created()
	{
		const messengerAppSettings = Extension.getSettings('im.v2.application.messenger');
		const messengerComponentSettings = Extension.getSettings('im.v2.component.messenger');

		this.$store.dispatch('openLines/queue/set', messengerAppSettings.get('queueConfig'));
		this.$store.dispatch(
			'openLines/queue/setIsLinesOperator',
			messengerComponentSettings.get('isLinesOperator', false),
		);

		Event.bind(document, 'mousedown', this.onDocumentClick);
	},
	beforeUnmount()
	{
		Event.unbind(document, 'mousedown', this.onDocumentClick);
	},
	methods:
	{
		onSearchLoading(value: boolean)
		{
			this.isSearchLoading = value;
		},
		onChatClick(dialogId: string)
		{
			this.$emit('selectChat', { layoutName: Layout.openlinesV2, dialogId });
		},
		onOpenSearch()
		{
			this.searchMode = true;
		},
		onCloseSearch()
		{
			this.searchMode = false;
			this.searchQuery = '';
		},
		onDocumentClick(event: MouseEvent)
		{
			const clickOnRecentContainer = event.composedPath().includes(this.$refs['recent-container']);
			if (this.searchMode && !clickOnRecentContainer)
			{
				this.onCloseSearch();
			}
		},
		onUpdateSearch(query: string)
		{
			this.searchMode = true;
			this.searchQuery = query;
		},
		onOpenSearchItem(event: { dialogId: string })
		{
			const { dialogId } = event;
			const chat = this.$store.getters['chats/get'](dialogId);
			const isOpenLinesChat = chat && chat.type === ChatType.lines;
			const layoutName = isOpenLinesChat ? Layout.openlinesV2 : Layout.chat;

			this.$emit('selectChat', { layoutName, dialogId });
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div
			ref="recent-container"
			class="bx-imol-list-container-recent__container bx-imol-messenger__scope"
		>
			<div class="bx-imol-list-container-recent__header_container">
				<div class="bx-imol-list-container-recent__search-input_container">
					<ChatSearchInput
						:searchMode="searchMode"
						:isLoading="searchMode && isSearchLoading"
						:placeholder="loc('IMOL_LIST_RECENT_CONTAINER_SEARCH_PLACEHOLDER')"
						@openSearch="onOpenSearch"
						@closeSearch="onCloseSearch"
						@updateSearch="onUpdateSearch"
					/>
				</div>
			</div>
			<div class="bx-imol-list-container-recent__elements_container">
				<div class="bx-imol-list-container-recent__elements">
					<RecentSearch
						v-show="searchMode"
						:searchMode="searchMode"
						:query="searchQuery"
						:showUsersCarousel="false"
						@loading="onSearchLoading"
						@openItem="onOpenSearchItem"
						@closeSearch="onCloseSearch"
					/>
					<RecentList v-show="!searchMode" @chatClick="onChatClick" />
				</div>
			</div>
		</div>
	`,
};
