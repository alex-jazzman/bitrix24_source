import { type JsonObject } from 'main.core';
import { type EventEmitter } from 'main.core.events';

import { BaseRecentList } from 'im.v2.component.list.items.base';
import { RecentType } from 'im.v2.const';
import { type ImModelRecentItem } from 'im.v2.model';

import { ChannelService } from './classes/channel-service';
import { ChannelRecentMenu } from './classes/context-menu-manager';
import { PullWatchManager } from './classes/pull-watch-manager';
import { ChannelItem } from './components/channel-item';
import { EmptyState } from './components/empty-state';

// @vue/component
export const ChannelList = {
	name: 'ChannelList',
	components: { EmptyState, BaseRecentList, ChannelItem },
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
			return this.$store.getters['recent/getSortedCollection']({ type: RecentType.openChannel });
		},
	},
	created()
	{
		this.contextMenuManager = new ChannelRecentMenu({ emitter: this.getEmitter() });
	},
	beforeUnmount()
	{
		this.contextMenuManager.destroy();
		this.getPullWatchManager().unsubscribe();
	},
	activated()
	{
		void this.loadInitialItems();
		this.getPullWatchManager().subscribe();
	},
	deactivated()
	{
		this.getPullWatchManager().unsubscribe();
	},
	methods: {
		async loadInitialItems()
		{
			if (this.isLoading)
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
		getRecentService(): ChannelService
		{
			if (!this.service)
			{
				this.service = new ChannelService();
			}

			return this.service;
		},
		getPullWatchManager(): PullWatchManager
		{
			if (!this.pullWatchManager)
			{
				this.pullWatchManager = new PullWatchManager();
			}

			return this.pullWatchManager;
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
				<EmptyState />
			</template>
			<template #item="{ item, onClick, onRightClick }">
				<ChannelItem
					:item="item"
					@click="onClick(item)"
					@click.right="onRightClick(item, $event)"
				/>
			</template>
		</BaseRecentList>
	`,
};
