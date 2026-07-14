import { type JsonObject, Event, Runtime } from 'main.core';

import { CreateChatPromo } from 'im.v2.component.list.container.elements.create-chat-promo';
import { CreateChatButton } from 'im.v2.component.list.container.elements.create-chat-button';
import { CollabList, CollabUnreadList } from 'im.v2.component.list.items.collab';
import { Layout, ChatType, ActionByUserType, RecentType, PromoId } from 'im.v2.const';
import { PromoManager } from 'im.v2.lib.promo';
import { Analytics } from 'im.v2.lib.analytics';
import { CreateChatManager } from 'im.v2.lib.create-chat';
import { Feature, FeatureManager, TariffManager } from 'im.v2.lib.feature';
import { Logger } from 'im.v2.lib.logger';
import { PermissionManager } from 'im.v2.lib.permission';
import { HeaderMenu } from 'im.v2.component.list.container.elements.header-menu';
import { ChatSearchInput, RecentSearch } from 'im.v2.component.search';
import { CollabManager } from 'im.v2.lib.collab';

import '../css/container.css';

// @vue/component
export const CollabListContainer = {
	name: 'CollabListContainer',
	components: {
		CollabList,
		CreateChatPromo,
		CreateChatButton,
		HeaderMenu,
		CollabUnreadList,
		ChatSearchInput,
		RecentSearch,
	},
	emits: ['selectChat'],
	data(): JsonObject
	{
		return {
			searchMode: false,
			searchQuery: '',
			isSearchLoading: false,
			unreadMode: false,
		};
	},
	computed:
	{
		ChatType: () => ChatType,
		RecentType: () => RecentType,
		canCreate(): boolean
		{
			const creationAvailable = FeatureManager.isFeatureAvailable(Feature.collabCreationAvailable);
			const hasAccess = PermissionManager.getInstance().canPerformActionByUserType(ActionByUserType.createCollab);

			return creationAvailable && hasAccess;
		},
		isCollabV2Available(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.isCollabV2Available);
		},
		createIconClass(): Record<string, boolean>
		{
			return { 'bx-im-list-container-collab__header_create-collab': !this.isCollabV2Available };
		},
		searchInputText(): string
		{
			return CollabManager.getSearchInputText();
		},
		isUnreadRecentModeAvailable(): boolean
		{
			return FeatureManager.isFeatureAvailable(Feature.unreadRecentModeAvailable);
		},
	},
	created()
	{
		Logger.warn('List: Collab container created');

		Event.bind(document, 'mousedown', this.onDocumentClick);
		void this.showCollabAiPromo();
	},
	beforeUnmount()
	{
		Event.unbind(document, 'mousedown', this.onDocumentClick);
	},
	methods:
	{
		onDocumentClick(event: MouseEvent)
		{
			const clickOnRecentContainer = event.composedPath().includes(this.$refs['collab-container']);
			if (!clickOnRecentContainer)
			{
				this.onCloseSearch();
			}
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
		onUpdateSearch(query)
		{
			this.searchMode = true;
			this.searchQuery = query;
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
		onSelectChat(dialogId: string): void
		{
			this.$emit('selectChat', { layoutName: Layout.collab, dialogId });
		},
		onCreateClick(): void
		{
			if (!TariffManager.collabV2.isAvailable() && this.isCollabV2Available)
			{
				TariffManager.collabV2.openFeatureSlider();

				return;
			}

			Analytics.getInstance().chatCreate.onStartClick(ChatType.collab);
			this.startCollabCreation();
		},
		startCollabCreation()
		{
			void CreateChatManager.getInstance().startChatCreation(ChatType.collab);
		},
		onToggleUnreadMode()
		{
			this.unreadMode = !this.unreadMode;
		},
		async showCollabAiPromo()
		{
			if (!PromoManager.getInstance().needToShow(PromoId.collabAi))
			{
				return;
			}

			await Runtime.loadExtension('socialnetwork.v2.components.popup.new-projects-popup');
			void PromoManager.getInstance().markAsWatched(PromoId.collabAi);
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-list-container-collab__container" ref="collab-container">
			<div class="bx-im-list-container-collab__header_container">
				<HeaderMenu
					v-if="isUnreadRecentModeAvailable"
					:unreadMode="unreadMode"
					:recentSection="RecentType.collab"
					@toggleUnreadMode="onToggleUnreadMode"
				/>
				<div class="bx-im-list-container-collab__search-input_container">
					<ChatSearchInput
						:searchMode="searchMode"
						:isLoading="searchMode && isSearchLoading"
						:placeholder="searchInputText"
						@openSearch="onOpenSearch"
						@closeSearch="onCloseSearch"
						@updateSearch="onUpdateSearch"
					/>
				</div>
				<CreateChatButton
					v-if="canCreate"
					@click="onCreateClick"
					:class="createIconClass"
				/>
			</div>
			<div class="bx-im-list-container-collab__elements_container">
				<div class="bx-im-list-container-collab__elements">
					<RecentSearch
						v-show="searchMode"
						:searchMode="searchMode"
						:query="searchQuery"
						:showUsersCarousel="false"
						:recentSectionType="RecentType.collab"
						@loading="onSearchLoading"
						@openItem="onOpenSearchItem"
						@closeSearch="onCloseSearch"
					/>
					<CollabList v-show="!searchMode && !unreadMode" @selectChat="onSelectChat" />
					<CollabUnreadList v-if="unreadMode" @selectChat="onSelectChat"/>
				</div>
			</div>
		</div>
	`,
};
