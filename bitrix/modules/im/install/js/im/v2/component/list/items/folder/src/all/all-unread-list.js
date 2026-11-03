import { type JsonObject } from 'main.core';
import { type BaseEvent, type EventEmitter } from 'main.core.events';
import { markRaw } from 'ui.vue3';

import { BaseRecentList } from 'im.v2.component.list.items.base';
import { ActiveCallList } from 'im.v2.component.list.items.elements.active-call-list';
import { CreateChatStatus } from 'im.v2.component.list.items.elements.create-chat-status';
import { RecentEmptyState } from 'im.v2.component.list.items.elements.empty-state';
import { LikeManager } from 'im.v2.component.list.items.recent';
import { EventType, ParentChatScope, type RecentTypeItem } from 'im.v2.const';
import { CreateChatManager } from 'im.v2.lib.create-chat';
import { DraftManager } from 'im.v2.lib.draft';
import { RecentMenu } from 'im.v2.lib.menu';
import { UnreadModeManager } from 'im.v2.lib.unread-mode';
import { type ImModelCallItem, type ImModelRecentItem } from 'im.v2.model';

import { AllFolderRecentService } from './classes/all-folder-recent-service';

// @vue/component
export const AllFolderUnreadList = {
	name: 'AllFolderUnreadList',
	components: { BaseRecentList, ActiveCallList, CreateChatStatus, RecentEmptyState },
	props: {
		folderId: {
			type: Number,
			required: true,
		},
	},
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
			return this.service.getCollection();
		},
		sourceSections(): RecentTypeItem[]
		{
			return this.$store.getters['recent/folders/getSourceSections'](this.folderId);
		},
	},
	async created()
	{
		this.service = new AllFolderRecentService({ folderId: this.folderId, unreadMode: true });
		this.contextMenuManager = markRaw(new RecentMenu({ emitter: this.getEmitter() }));
		this.initLikeManager();
		this.initCreateChatManager();
		this.getEmitter().subscribe(EventType.dialog.onCloseChat, this.onCloseChat);

		this.clearCollection();
		await this.loadInitialItems();

		void DraftManager.getInstance().initDraftHistory();
	},
	beforeUnmount()
	{
		this.service.destroy();
		this.contextMenuManager.destroy();
		this.destroyLikeManager();
		this.destroyCreateChatManager();

		this.getEmitter().unsubscribe(EventType.dialog.onCloseChat, this.onCloseChat);
	},
	methods: {
		clearCollection()
		{
			this.sourceSections.forEach((section: RecentTypeItem) => {
				void this.$store.dispatch('recent/clearUnreadCollection', {
					type: section,
					parentChatId: ParentChatScope.topLevel,
				});
			});
		},
		onCloseChat(event: BaseEvent<{ dialogId: string }>)
		{
			const { dialogId } = event.getData();

			UnreadModeManager.removeItemFromList({
				recentSections: this.sourceSections,
				dialogId,
			});
		},
		async loadInitialItems()
		{
			if (this.firstPageLoaded || this.isLoading)
			{
				return;
			}

			this.isLoading = true;
			await this.service.loadFirstPage();
			this.firstPageLoaded = true;
			this.isLoading = false;
		},
		onListScroll(isScrolled: boolean)
		{
			this.listIsScrolled = isScrolled;
		},
		async onLoadNextPage()
		{
			if (this.isLoadingNextPage || !this.service.hasMoreItemsToLoad())
			{
				return;
			}

			this.isLoadingNextPage = true;
			await this.service.loadNextPage();
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
		onCallClick({ item }: { item: ImModelCallItem })
		{
			this.onSelectChat(item.dialogId);
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
			:contextMenuManager="contextMenuManager"
			data-testid="folder-all-unread-chat-list"
			@listScroll="onListScroll"
			@selectChat="onSelectChat"
			@itemRightClick="onItemRightClick"
			@closeMenu="onCloseMenu"
			@loadNextPage="onLoadNextPage"
		>
			<template #before-scroll>
				<ActiveCallList :listIsScrolled="listIsScrolled" @onCallClick="onCallClick" />
			</template>
			<template #before-list>
				<CreateChatStatus v-if="isCreatingChat" />
			</template>
			<template #empty-state>
				<RecentEmptyState
					data-testid="folder-all-unread-empty-state"
					:title="loc('IM_LIST_UNREAD_RECENT_EMPTY_STATE_TITLE_MSGVER_1')"
					:subtitle="loc('IM_LIST_UNREAD_RECENT_EMPTY_STATE_SUBTITLE')"
				/>
			</template>
		</BaseRecentList>
	`,
};
