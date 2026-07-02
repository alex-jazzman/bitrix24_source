import { type JsonObject } from 'main.core';
import { type EventEmitter } from 'main.core.events';

import { BaseRecentList } from 'im.v2.component.list.items.base';
import { RecentType } from 'im.v2.const';
import { DraftManager } from 'im.v2.lib.draft';
import { type ImModelRecentItem } from 'im.v2.model';

import { CollabService } from '../classes/services/collab';
import { CollabRecentMenu } from '../classes/context-menu-manager';
import { EmptyState } from './empty-state';

// @vue/component
export const CollabList = {
	name: 'CollabList',
	components: { EmptyState, BaseRecentList },
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
			return this.$store.getters['recent/getSortedCollection']({ type: RecentType.collab });
		},
	},
	async created()
	{
		this.contextMenuManager = new CollabRecentMenu({ emitter: this.getEmitter() });

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
		getRecentService(): CollabService
		{
			if (!this.service)
			{
				this.service = new CollabService();
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
