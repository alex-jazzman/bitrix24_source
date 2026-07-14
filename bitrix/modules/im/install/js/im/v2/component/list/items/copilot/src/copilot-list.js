import { type JsonObject } from 'main.core';
import { type EventEmitter } from 'main.core.events';

import { BaseRecentList } from 'im.v2.component.list.items.base';
import { RecentType } from 'im.v2.const';
import { DraftManager } from 'im.v2.lib.draft';
import { type ImModelRecentItem } from 'im.v2.model';
import { CopilotRecentService } from 'im.v2.provider.service.copilot';

import { CopilotRecentMenu } from './classes/context-menu-manager';
import { EmptyState } from './components/empty-state.js';

// @vue/component
export const CopilotList = {
	name: 'CopilotList',
	components: { BaseRecentList, EmptyState },
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
			return this.$store.getters['recent/getSortedCollection']({ type: RecentType.copilot });
		},
	},
	async created()
	{
		this.contextMenuManager = new CopilotRecentMenu({ emitter: this.getEmitter() });

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
		getRecentService(): CopilotRecentService
		{
			if (!this.service)
			{
				this.service = new CopilotRecentService();
			}

			return this.service;
		},
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
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
				<EmptyState />
			</template>
		</BaseRecentList>
	`,
};
