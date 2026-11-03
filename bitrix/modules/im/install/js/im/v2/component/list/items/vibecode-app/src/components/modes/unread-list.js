import { type JsonObject } from 'main.core';
import { type BaseEvent, type EventEmitter } from 'main.core.events';

import { BaseRecentList } from 'im.v2.component.list.items.base';
import { RecentEmptyState } from 'im.v2.component.list.items.elements.empty-state';
import { EventType, ParentChatScope, RecentType } from 'im.v2.const';
import { DraftManager } from 'im.v2.lib.draft';
import { UnreadModeManager } from 'im.v2.lib.unread-mode';
import { type ImModelRecentItem } from 'im.v2.model';

import { VibecodeAppRecentMenu } from '../../classes/context-menu';
import { VibecodeAppUnreadService } from '../../classes/vibecode-app-unread-service';

// @vue/component
export const VibecodeAppUnreadList = {
	name: 'VibecodeAppUnreadList',
	components: { BaseRecentList, RecentEmptyState },
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
			return this.$store.getters['recent/getSortedUnreadCollection']({ type: RecentType.vibecodeApp });
		},
	},
	async created()
	{
		this.contextMenuManager = new VibecodeAppRecentMenu({ emitter: this.getEmitter() });

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
			this.$store.dispatch('recent/clearUnreadCollection', { type: RecentType.vibecodeApp });
		},
		onCloseChat(event: BaseEvent<{ dialogId: string }>)
		{
			const { dialogId } = event.getData();

			UnreadModeManager.removeItemFromList({
				recentSections: [RecentType.vibecodeApp],
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
			try
			{
				await this.getUnreadService().loadFirstPage();
				this.firstPageLoaded = true;
			}
			finally
			{
				this.isLoading = false;
			}
		},
		async onLoadNextPage()
		{
			if (this.isLoadingNextPage || !this.getUnreadService().hasMoreItemsToLoad())
			{
				return;
			}

			this.isLoadingNextPage = true;
			try
			{
				await this.getUnreadService().loadNextPage();
			}
			finally
			{
				this.isLoadingNextPage = false;
			}
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
		getUnreadService(): VibecodeAppUnreadService
		{
			if (!this.service)
			{
				this.service = new VibecodeAppUnreadService({
					unreadMode: true,
					parentChatId: ParentChatScope.all,
				});
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
			data-testid="vibecode-app-unread-chat-list"
			@selectChat="onSelectChat"
			@itemRightClick="onItemRightClick"
			@closeMenu="onCloseMenu"
			@loadNextPage="onLoadNextPage"
		>
			<template #empty-state>
				<RecentEmptyState
					:title="loc('IM_LIST_VIBECODE_APP_UNREAD_EMPTY_STATE_TITLE')"
					:subtitle="loc('IM_LIST_VIBECODE_APP_UNREAD_EMPTY_STATE_SUBTITLE')"
				/>
			</template>
		</BaseRecentList>
	`,
};
