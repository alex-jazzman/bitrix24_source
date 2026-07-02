import { type JsonObject } from 'main.core';
import { type BaseEvent, type EventEmitter } from 'main.core.events';

import { BaseRecentList } from 'im.v2.component.list.items.base';
import { CreateChatStatus } from 'im.v2.component.list.items.elements.create-chat-status';
import { RecentType } from 'im.v2.const';
import { CreateChatManager } from 'im.v2.lib.create-chat';
import { DraftManager } from 'im.v2.lib.draft';
import { RecentMenu } from 'im.v2.lib.menu';
import { type ImModelRecentItem, type ImModelCallItem } from 'im.v2.model';
import { LegacyRecentService } from 'im.v2.provider.service.recent';

import { LikeManager } from './classes/like-manager';
import { ActiveCallList } from './components/active-call-list';
import { EmptyState } from './components/empty-state';

export { RecentUnreadList } from './components/modes/unread-recent-list';

// @vue/component
export const RecentList = {
	name: 'RecentList',
	components: { ActiveCallList, CreateChatStatus, EmptyState, BaseRecentList },
	emits: ['selectChat'],
	data(): JsonObject
	{
		return {
			isLoading: false,
			isLoadingNextPage: false,
			firstPageLoaded: false,
			listIsScrolled: false,
			isCreatingChat: false,
		};
	},
	computed: {
		collection(): ImModelRecentItem[]
		{
			return this.$store.getters['recent/getSortedCollection']({ type: RecentType.default });
		},
		activeCalls(): ImModelCallItem[]
		{
			return this.$store.getters['recent/calls/get'];
		},
	},
	async created()
	{
		this.contextMenuManager = new RecentMenu({ emitter: this.getEmitter() });
		this.initLikeManager();
		this.initCreateChatManager();

		await this.loadInitialItems();

		void DraftManager.getInstance().initDraftHistory();
	},
	beforeUnmount()
	{
		this.contextMenuManager.destroy();
		this.destroyLikeManager();
		this.destroyCreateChatManager();
	},
	methods: {
		async loadInitialItems()
		{
			if (this.firstPageLoaded || this.isLoading)
			{
				return;
			}

			this.isLoading = true;
			await this.getRecentService().loadFirstPage({ ignorePreloadedItems: true });
			this.firstPageLoaded = true;
			this.isLoading = false;
		},
		async onListScroll(isScrolled: boolean)
		{
			this.listIsScrolled = isScrolled;
		},
		async onLoadNextPage()
		{
			if (this.isLoadingNextPage || !this.getRecentService().hasMoreItemsToLoad())
			{
				return;
			}

			this.isLoadingNextPage = true;
			await this.getRecentService().loadNextPage();
			this.isLoadingNextPage = false;
		},
		onSelectChat(dialogId: string)
		{
			this.$emit('selectChat', dialogId);
		},
		onItemRightClick(payload: { item: ImModelRecentItem, event: PointerEvent })
		{
			const { item, event } = payload;
			event.preventDefault();

			const context = {
				dialogId: item.dialogId,
				recentItem: item,
				compactMode: false,
			};

			this.contextMenuManager.openMenu(context, {
				left: event.pageX,
				top: event.pageY,
			});
		},
		onCloseMenu()
		{
			this.contextMenuManager.close();
		},
		onCallClick({ item })
		{
			this.onClick(item);
		},
		initLikeManager()
		{
			this.likeManager = new LikeManager();
			this.likeManager.init();
		},
		destroyLikeManager()
		{
			this.likeManager.destroy();
		},
		initCreateChatManager()
		{
			if (CreateChatManager.getInstance().isCreating())
			{
				this.isCreatingChat = true;
			}

			this.onCreationStatusChange = (event: BaseEvent<boolean>) => {
				this.isCreatingChat = event.getData();
			};
			CreateChatManager.getInstance().subscribe(
				CreateChatManager.events.creationStatusChange,
				this.onCreationStatusChange,
			);
		},
		destroyCreateChatManager()
		{
			CreateChatManager.getInstance().unsubscribe(
				CreateChatManager.events.creationStatusChange,
				this.onCreationStatusChange,
			);
		},
		getRecentService(): LegacyRecentService
		{
			if (!this.service)
			{
				this.service = LegacyRecentService.getInstance();
			}

			return this.service;
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<BaseRecentList
			:collection="collection"
			:showMainLoader="isLoading && !firstPageLoaded"
			:showBottomLoader="isLoadingNextPage"
			@listScroll="onListScroll"
			@loadNextPage="onLoadNextPage"
			@selectChat="onSelectChat"
			@itemRightClick="onItemRightClick"
			@closeMenu="onCloseMenu"
		>
			<template #before-list>
				<ActiveCallList :listIsScrolled="listIsScrolled" @onCallClick="onCallClick" />
				<CreateChatStatus v-if="isCreatingChat" />
			</template>
			<template #empty-state>
				<EmptyState />
			</template>
		</BaseRecentList>
	`,
};
