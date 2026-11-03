import { Event, Text, type JsonObject } from 'main.core';
import { type EventEmitter } from 'main.core.events';
import { type ComponentOptions } from 'ui.vue3';

import { RecentListSlider } from 'im.v2.component.list.container.elements.list-slider';
import { RecentSearch } from 'im.v2.component.search';
import { EventType, RecentType, type RecentTypeItem } from 'im.v2.const';
import { Analytics } from 'im.v2.lib.analytics';
import { Logger } from 'im.v2.lib.logger';
import {
	holdKeyboardFocusHandoffForNestedList,
	isFocusOwnedByPopup,
	isKeyboardFocusHandoffPending,
	releaseKeyboardFocusHandoffFromNestedList,
} from 'im.v2.lib.a11y';
import { Utils } from 'im.v2.lib.utils';
import { type ImModelLayout, type ImModelChat } from 'im.v2.model';

import { CollabPromoManager } from './classes/promo-manager.js';
import { CollabCard } from './components/collab-card/collab-card';
import { CardLoader } from './components/collab-card/components/card-loader';
import { CollabHeader } from './components/header/header';
import { CollabNavigation } from './components/navigation/navigation';
import { CollabSectionConfig, type CollabSectionItem } from './const/section-config';

import './css/nested-container.css';

// @vue/component
export const CollabNestedListContainer = {
	name: 'CollabNestedListContainer',
	components: {
		RecentListSlider,
		CollabNavigation,
		CollabHeader,
		CollabCard,
		CardLoader,
		RecentSearch,
	},
	provide(): { promoManager: CollabPromoManager }
	{
		return {
			promoManager: this.getPromoManager(),
		};
	},
	props: {
		parentChatId: {
			type: Number,
			required: true,
		},
		initialRecentSection: {
			type: String,
			required: true,
		},
		compactMode: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['selectChat', 'close'],
	data(): JsonObject
	{
		return {
			searchAreaId: Text.getRandom(),
			searchMode: false,
			searchQuery: '',
			isSearchLoading: false,
			currentSection: null,
			unreadMode: false,
		};
	},
	computed: {
		RecentType: () => RecentType,
		layout(): ImModelLayout
		{
			return this.$store.getters['application/getLayout'];
		},
		chatEntityId(): string
		{
			return this.layout.entityId;
		},
		layoutName(): string
		{
			return this.layout.name;
		},
		listComponent(): ?ComponentOptions
		{
			const matchingItem = CollabSectionConfig[this.currentSection];
			if (!matchingItem)
			{
				return null;
			}

			return matchingItem.component;
		},
		listUnreadComponent(): ?ComponentOptions
		{
			const matchingItem = CollabSectionConfig[this.currentSection];
			if (!matchingItem)
			{
				return null;
			}

			return matchingItem.unreadComponent;
		},
		navigationSections(): CollabSectionItem[]
		{
			return Object.values(CollabSectionConfig)
				.filter((sectionItem) => sectionItem.isAvailable());
		},
		parentChat(): ?ImModelChat
		{
			return this.$store.getters['chats/getByChatId'](this.parentChatId);
		},
		isParentChatLoaded(): boolean
		{
			return Boolean(this.parentChat);
		},
	},
	watch: {
		// This list and the chat of its collab are opened by one and the same action, and a search the collab
		// was entered from is owed the focus back only once the last of the two is gone. So the promise made
		// to that search is held here for as long as this list shows that collab.
		parentChatId: {
			immediate: true,
			handler(newParentChatId: number, oldParentChatId: ?number)
			{
				if (oldParentChatId)
				{
					// Switching to another collab reuses this container: the promise of the collab it showed
					// before is over, and nothing is left of that walk to hand the focus to.
					this.releaseFocusHandoffOfNestedList(oldParentChatId);
				}

				holdKeyboardFocusHandoffForNestedList({
					layoutName: this.layoutName,
					dialogId: Utils.dialog.buildChatDialogId(newParentChatId),
				});
			},
		},
		isParentChatLoaded: {
			immediate: true,
			handler(isLoaded: boolean)
			{
				if (!isLoaded)
				{
					return;
				}

				this.getPromoManager().init();
			},
		},
		chatEntityId(newEntityId: string, oldEntityId: string)
		{
			// The open collab chat was exited (entity id cleared) while this nested list stays
			// open. Keyboard focus would be stranded on <body>, so move it onto the list.
			const chatWasExited = !newEntityId && Boolean(oldEntityId);
			if (chatWasExited)
			{
				this.focusNestedListAfterChatExit(oldEntityId);
			}
		},
	},
	created()
	{
		Logger.warn('List: Collab nested container created');

		Event.bind(document, 'mousedown', this.onDocumentClick);

		this.initCurrentRecentSection();
	},
	beforeUnmount()
	{
		this.promoManager?.stop();
		Event.unbind(document, 'mousedown', this.onDocumentClick);

		// Every way out of this list ends here - Esc, the close control, a section change, a collab deleted
		// under the user - so this is the one place that can tell the walk is over.
		this.returnFocusToSearchAfterClose();
	},
	methods: {
		initCurrentRecentSection()
		{
			if (!CollabSectionConfig[this.initialRecentSection])
			{
				this.currentSection = RecentType.collabDefault;

				return;
			}

			this.currentSection = this.initialRecentSection;
		},
		onDocumentClick(event: MouseEvent)
		{
			const sliderContainer = this.$refs.slider.$el;
			const clickOnRecentContainer = event.composedPath().includes(sliderContainer);
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
		onUpdateSearch(query: string)
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

			this.currentSection = RecentType.collabDefault;

			this.$emit('selectChat', dialogId);
		},
		onClose()
		{
			this.$emit('close');
		},
		onSelectSection(selectedSection: RecentTypeItem)
		{
			if (selectedSection === this.currentSection)
			{
				return;
			}

			this.currentSection = selectedSection;
			this.unreadMode = false;

			Analytics.getInstance().projectTab.onSelectSection(selectedSection);
		},
		onToggleUnreadMode()
		{
			this.unreadMode = !this.unreadMode;
		},
		focusNestedListAfterChatExit(exitedDialogId)
		{
			// A chat entered from the search of this header with the keyboard owes the focus back to the search
			// itself, and that promise outranks the row: the user walked in from the search, not from the list.
			const isFocusOwedToSearch = isKeyboardFocusHandoffPending({
				searchAreaId: this.searchAreaId,
				layoutName: this.layoutName,
				dialogId: exitedDialogId,
			});

			// Search owns its own focus; only take over when a plain list is on screen and no popup holds
			// focus. Wait a tick so the list is settled before focusing the row.
			if (isFocusOwedToSearch || this.searchMode || !this.canMoveFocus())
			{
				return;
			}

			void this.$nextTick(() => {
				this.focusExitedChatRow(exitedDialogId);
			});
		},
		focusExitedChatRow(exitedDialogId): boolean
		{
			const list = this.unreadMode ? this.$refs.sectionUnreadList : this.$refs.sectionList;
			const listEl = list?.$el;
			if (!listEl)
			{
				return false;
			}

			// Return focus to the row of the chat that was just open (mirrors the main recent list, whose
			// roving entry stays on the active row), not the first row. Fall back to the first row when
			// that chat is no longer present in the current section.
			const exitedRow = exitedDialogId ? listEl.querySelector(`[data-id="${exitedDialogId}"]`) : null;
			const targetRow = exitedRow?.isConnected ? exitedRow : listEl.querySelector('[data-id]');
			if (!targetRow?.isConnected)
			{
				return false;
			}

			targetRow.focus();

			return true;
		},
		canMoveFocus(): boolean
		{
			// Do not steal focus from a popup/menu that currently owns it (active focus trap).
			return !isFocusOwnedByPopup();
		},
		returnFocusToSearchAfterClose()
		{
			const searchAreaId = this.releaseFocusHandoffOfNestedList(this.parentChatId);

			// A chat is open under this list: it was asked for after the walk and owns the focus, so the
			// promise ends here without a handover.
			if (!searchAreaId || this.chatEntityId)
			{
				return;
			}

			// This list is unmounted here, but its element stays on screen for the closing animation and the
			// row the focus was left on still holds it. The search only takes a focus nobody holds, so the
			// list gives up the one it is about to lose together with its own DOM.
			this.dropFocusHeldInside();

			// The search owns the element that takes the focus; all it needs from here is the moment.
			this.getEmitter().emit(EventType.search.returnFocusToSearch, { searchAreaId });
		},
		dropFocusHeldInside()
		{
			const focused = document.activeElement;
			if (focused && this.$refs.slider?.$el?.contains(focused))
			{
				focused.blur();
			}
		},
		releaseFocusHandoffOfNestedList(parentChatId: number): ?string
		{
			return releaseKeyboardFocusHandoffFromNestedList({
				layoutName: this.layoutName,
				dialogId: Utils.dialog.buildChatDialogId(parentChatId),
			});
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
		getPromoManager(): CollabPromoManager
		{
			if (!this.promoManager)
			{
				this.promoManager = new CollabPromoManager(this.parentChatId);
			}

			return this.promoManager;
		},
	},
	template: `
		<RecentListSlider ref="slider" :compactMode="compactMode" @close="onClose">
			<template #header>
				<CollabHeader
					:unreadMode="unreadMode"
					:currentSection="currentSection"
					:parentChatId="parentChatId"
					:searchMode="searchMode"
					:isSearchLoading="isSearchLoading"
					:searchAreaId="searchAreaId"
					@openSearch="onOpenSearch"
					@closeSearch="onCloseSearch"
					@updateSearch="onUpdateSearch"
					@toggleUnreadMode="onToggleUnreadMode"
				/>
			</template>
			<template v-if="!searchMode" #subheader>
				<CardLoader v-if="!isParentChatLoaded" />
				<CollabCard
					v-else
					:parentChatId="parentChatId"
					:withNewTabButton="compactMode"
				/>
				<CollabNavigation
					:parentChatId="parentChatId"
					:sections="navigationSections"
					:currentSection="currentSection"
					@selectSection="onSelectSection"
				/>
			</template>
			<template #content>
				<RecentSearch
					v-show="searchMode"
					:searchMode="searchMode"
					:query="searchQuery"
					:parentChatId="parentChatId"
					:showUsersCarousel="false"
					:recentSectionType="RecentType.collabDefault"
					:withKeyboardNavigation="true"
					:searchAreaId="searchAreaId"
					@loading="onSearchLoading"
					@openItem="onOpenSearchItem"
					@closeSearch="onCloseSearch"
				/>
				<KeepAlive v-show="!searchMode && !unreadMode">
					<component
						:is="listComponent"
						ref="sectionList"
						:parentChatId="parentChatId"
						@selectChat="$emit('selectChat', $event)"
						@loadError="$emit('close')"
					/>
				</KeepAlive>
				<component
					v-if="unreadMode"
					:is="listUnreadComponent"
					ref="sectionUnreadList"
					:parentChatId="parentChatId"
					@selectChat="$emit('selectChat', $event)"
					@loadError="$emit('close')"
				/>
			</template>
		</RecentListSlider>
	`,
};
