import { Event, type JsonObject } from 'main.core';
import { type ComponentOptions } from 'ui.vue3';

import { RecentListSlider } from 'im.v2.component.list.container.elements.list-slider';
import { RecentSearch } from 'im.v2.component.search';
import { RecentType, type RecentTypeItem } from 'im.v2.const';
import { Logger } from 'im.v2.lib.logger';
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
		},
		onToggleUnreadMode()
		{
			this.unreadMode = !this.unreadMode;
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
					@loading="onSearchLoading"
					@openItem="onOpenSearchItem"
					@closeSearch="onCloseSearch"
				/>
				<KeepAlive v-show="!searchMode && !unreadMode">
					<component
						:is="listComponent"
						:parentChatId="parentChatId"
						@selectChat="$emit('selectChat', $event)"
						@loadError="$emit('close')"
					/>
				</KeepAlive>
				<component
					v-if="unreadMode"
					:is="listUnreadComponent"
					:parentChatId="parentChatId"
					@selectChat="$emit('selectChat', $event)"
					@loadError="$emit('close')"
				/>
			</template>
		</RecentListSlider>
	`,
};
