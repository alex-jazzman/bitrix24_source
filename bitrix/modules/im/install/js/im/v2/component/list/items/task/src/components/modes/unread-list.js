import { type JsonObject } from 'main.core';
import { type BaseEvent, type EventEmitter } from 'main.core.events';

import { BaseRecentItem, BaseRecentList } from 'im.v2.component.list.items.base';
import { RecentEmptyState } from 'im.v2.component.list.items.elements.empty-state';
import { EventType, ParentChatScope, RecentType } from 'im.v2.const';
import { DraftManager } from 'im.v2.lib.draft';
import { type ImModelRecentItem } from 'im.v2.model';
import { TaskRecentService } from 'im.v2.provider.service.recent';
import { UnreadModeManager } from 'im.v2.lib.unread-mode';

import { TaskRecentMenu } from '../../classes/context-menu-manager';

// @vue/component
export const TaskUnreadList = {
	name: 'TaskUnreadList',
	components: { BaseRecentList, BaseRecentItem, RecentEmptyState },
	emits: ['selectChat'],
	data(): JsonObject
	{
		return {
			isLoading: false,
			isLoadingNextPage: false,
			firstPageLoaded: false,
		};
	},
	computed: {
		collection(): ImModelRecentItem[]
		{
			return this.$store.getters['recent/getSortedUnreadCollection']({ type: RecentType.taskComments });
		},
	},
	async created()
	{
		this.contextMenuManager = new TaskRecentMenu({ emitter: this.getEmitter() });

		this.clearCollection();
		await this.loadInitialItems();
		void DraftManager.getInstance().initDraftHistory();

		this.getEmitter().subscribe(EventType.dialog.onCloseChat, this.onCloseChat);
	},
	beforeUnmount()
	{
		this.contextMenuManager.destroy();

		this.getEmitter().unsubscribe(EventType.dialog.onCloseChat, this.onCloseChat);
	},
	methods: {
		clearCollection()
		{
			this.$store.dispatch('recent/clearUnreadCollection', { type: RecentType.taskComments });
		},
		onCloseChat(event: BaseEvent<{ dialogId: string }>)
		{
			const { dialogId } = event.getData();

			UnreadModeManager.removeItemFromList({
				recentSections: [RecentType.taskComments],
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
			await this.getTaskUnreadService().loadFirstPage();
			this.firstPageLoaded = true;
			this.isLoading = false;
		},
		async onLoadNextPage()
		{
			if (this.isLoadingNextPage || !this.getTaskUnreadService().hasMoreItemsToLoad())
			{
				return;
			}

			this.isLoadingNextPage = true;
			await this.getTaskUnreadService().loadNextPage();
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
		getTaskUnreadService(): TaskRecentService
		{
			if (!this.service)
			{
				this.service = new TaskRecentService({ unreadMode: true, parentChatId: ParentChatScope.all });
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
			@selectChat="onSelectChat"
			@itemRightClick="onItemRightClick"
			@closeMenu="onCloseMenu"
			@loadNextPage="onLoadNextPage"
		>
			<template #empty-state>
				<RecentEmptyState 
					:title="loc('IM_LIST_TASK_UNREAD_EMPTY_STATE_TITLE_MSGVER_1')"
					:subtitle="loc('IM_LIST_TASK_UNREAD_EMPTY_STATE_SUBTITLE')"
				/>
			</template>
		</BaseRecentList>
	`,
};
