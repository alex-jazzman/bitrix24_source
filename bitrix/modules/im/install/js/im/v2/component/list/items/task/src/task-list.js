import { type JsonObject } from 'main.core';
import { type EventEmitter } from 'main.core.events';
import { markRaw } from 'ui.vue3';

import { BaseRecentList } from 'im.v2.component.list.items.base';
import { ActiveCallList } from 'im.v2.component.list.items.elements.active-call-list';
import { RecentType, ParentChatScope } from 'im.v2.const';
import { DraftManager } from 'im.v2.lib.draft';
import { type ImModelRecentItem } from 'im.v2.model';
import { TaskRecentService } from 'im.v2.provider.service.recent';

import { TaskRecentMenu } from './classes/context-menu-manager';
import { EmptyState } from './components/empty-state';

export { TaskUnreadList } from './components/modes/unread-list';

// @vue/component
export const TaskList = {
	name: 'TaskList',
	components: { ActiveCallList, EmptyState, BaseRecentList },
	emits: ['selectChat'],
	data(): JsonObject
	{
		return {
			isLoading: false,
			isLoadingNextPage: false,
			firstPageLoaded: false,
			listIsScrolled: false,
		};
	},
	computed: {
		collection(): ImModelRecentItem[]
		{
			return this.$store.getters['recent/getSortedCollection']({ type: RecentType.taskComments });
		},
	},
	async created()
	{
		this.contextMenuManager = markRaw(new TaskRecentMenu({ emitter: this.getEmitter() }));

		await this.loadInitialItems();

		void DraftManager.getInstance().initDraftHistory();
	},
	beforeUnmount()
	{
		this.contextMenuManager.destroy();
	},
	methods: {
		async loadInitialItems()
		{
			if (this.firstPageLoaded || this.isLoading)
			{
				return;
			}

			this.isLoading = true;
			await this.getRecentService().loadFirstPage();
			this.firstPageLoaded = true;
			this.isLoading = false;
		},
		onListScroll(isScrolled: boolean)
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
			this.onSelectChat(item.dialogId);
		},
		getRecentService(): TaskRecentService
		{
			if (!this.service)
			{
				this.service = new TaskRecentService({ parentChatId: ParentChatScope.all });
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
			:contextMenuManager="contextMenuManager"
			@listScroll="onListScroll"
			@selectChat="onSelectChat"
			@itemRightClick="onItemRightClick"
			@closeMenu="onCloseMenu"
			@loadNextPage="onLoadNextPage"
		>
			<template #before-scroll>
				<ActiveCallList :listIsScrolled="listIsScrolled" @onCallClick="onCallClick" />
			</template>
			<template #empty-state>
				<EmptyState />
			</template>
		</BaseRecentList>
	`,
};
