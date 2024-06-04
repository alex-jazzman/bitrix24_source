import { EventEmitter, BaseEvent } from 'main.core.events';

import { Utils } from 'im.v2.lib.utils';
import { EventType } from 'im.v2.const';
import { ListLoadingState as LoadingState } from 'im.v2.component.elements';

import { ChannelItem } from './components/channel-item/channel-item';
import { EmptyState } from './components/empty-state';
import { ChannelService } from './classes/channel-service';
import { PullWatchManager } from './classes/pull-watch-manager';
import { ChannelRecentMenu } from './classes/context-menu-manager';

import './css/channel-list.css';

import type { JsonObject } from 'main.core';
import type { ImModelRecentItem } from 'im.v2.model';

// @vue/component
export const ChannelList = {
	name: 'ChannelList',
	components: { EmptyState, LoadingState, ChannelItem },
	emits: ['chatClick'],
	data(): JsonObject
	{
		return {
			isLoading: false,
			isLoadingNextPage: false,
			firstPageLoaded: false,
		};
	},
	computed:
	{
		collection(): ImModelRecentItem[]
		{
			return this.$store.getters['recent/getChannelCollection'];
		},
		preparedItems(): ImModelRecentItem[]
		{
			return [...this.collection].sort((a, b) => {
				const firstDate = this.$store.getters['recent/getSortDate'](a.dialogId);
				const secondDate = this.$store.getters['recent/getSortDate'](b.dialogId);

				return secondDate - firstDate;
			});
		},
		isEmptyCollection(): boolean
		{
			return this.collection.length === 0;
		},
	},
	created()
	{
		this.joinedChannels = new Set();
		this.contextMenuManager = new ChannelRecentMenu();
		this.bindEvents();
	},
	beforeUnmount()
	{
		this.contextMenuManager.destroy();
		this.unbindEvents();
	},
	async activated()
	{
		this.isLoading = true;
		await this.getRecentService().loadFirstPage();
		this.firstPageLoaded = true;
		this.isLoading = false;
		this.getPullWatchManager().subscribe();
	},
	deactivated()
	{
		this.removeJoinedChannels();
		this.getPullWatchManager().unsubscribe();
	},
	methods:
	{
		async onScroll(event: Event)
		{
			this.contextMenuManager.close();
			if (!Utils.dom.isOneScreenRemaining(event.target) || !this.getRecentService().hasMoreItemsToLoad)
			{
				return;
			}

			this.isLoadingNextPage = true;
			await this.getRecentService().loadNextPage();
			this.isLoadingNextPage = false;
		},
		onClick(item: ImModelRecentItem)
		{
			this.$emit('chatClick', item.dialogId);
		},
		onRightClick(item: ImModelRecentItem, event: PointerEvent)
		{
			event.preventDefault();
			this.contextMenuManager.openMenu(item, event.currentTarget);
		},
		onChannelJoin(event: BaseEvent<{ channelDialogId: string }>)
		{
			const { channelDialogId } = event.getData();
			this.joinedChannels.add(channelDialogId);
		},
		bindEvents()
		{
			EventEmitter.subscribe(EventType.channel.onChannelJoin, this.onChannelJoin);
		},
		unbindEvents()
		{
			EventEmitter.unsubscribe(EventType.channel.onChannelJoin, this.onChannelJoin);
		},
		removeJoinedChannels()
		{
			[...this.joinedChannels].forEach((channelDialogId: string) => {
				this.$store.dispatch('recent/deleteFromChannelCollection', channelDialogId);
			});

			this.joinedChannels = new Set();
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
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-list-channel__container">
			<LoadingState v-if="isLoading && !firstPageLoaded" />
			<div v-else @scroll="onScroll" class="bx-im-list-channel__scroll-container">
				<EmptyState v-if="isEmptyCollection" />
				<div class="bx-im-list-channel__general_container">
					<ChannelItem
						v-for="item in preparedItems"
						:key="item.dialogId"
						:item="item"
						@click="onClick(item)"
						@click.right="onRightClick(item, $event)"
					/>
				</div>
				<LoadingState v-if="isLoadingNextPage" />
			</div>
		</div>
	`,
};
