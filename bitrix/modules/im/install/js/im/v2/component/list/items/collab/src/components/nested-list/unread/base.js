import { type JsonObject } from 'main.core';
import { type BaseEvent, type EventEmitter } from 'main.core.events';

import { BaseRecentList } from 'im.v2.component.list.items.base';
import { RecentEmptyState } from 'im.v2.component.list.items.elements.empty-state';
import { type ImModelRecentItem } from 'im.v2.model';
import { DraftManager } from 'im.v2.lib.draft';
import { Notifier } from 'im.v2.lib.notifier';
import { type BaseRecentService } from 'im.v2.provider.service.recent';
import { EventType } from 'im.v2.const';
import { UnreadModeManager } from 'im.v2.lib.unread-mode';

import { ServiceByRecentType } from '../base';
import { CollabNestedRecentMenu } from '../classes/context-menu';

// @vue/component
export const BaseCollabNestedUnreadList = {
	name: 'BaseCollabNestedUnreadList',
	components: { BaseRecentList, RecentEmptyState },
	props: {
		parentChatId: {
			type: Number,
			required: true,
		},
		type: {
			type: String,
			required: true,
		},
		withEmptyState: {
			type: Boolean,
			default: true,
		},
	},
	emits: ['selectChat', 'loadError'],
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
			return this.$store.getters['recent/getSortedUnreadCollection']({
				parentChatId: this.parentChatId,
				type: this.type,
			});
		},
	},
	async created()
	{
		this.contextMenuManager = new CollabNestedRecentMenu({ emitter: this.getEmitter() });

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
			this.$store.dispatch('recent/clearUnreadCollection', {
				parentChatId: this.parentChatId,
				type: this.type,
			});
		},
		async loadInitialItems()
		{
			if (this.firstPageLoaded || this.isLoading)
			{
				return;
			}

			this.isLoading = true;
			await this.getUnreadRecentService().loadFirstPage()
				.catch((error) => {
					Notifier.chat.handleLoadError(error);
					this.$emit('loadError');
				});
			this.firstPageLoaded = true;
			this.isLoading = false;
		},
		async onLoadNextPage()
		{
			if (this.isLoadingNextPage || !this.getUnreadRecentService().hasMoreItemsToLoad())
			{
				return;
			}

			this.isLoadingNextPage = true;
			await this.getUnreadRecentService().loadNextPage();
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
		onCloseChat(event: BaseEvent<{ dialogId: string }>)
		{
			const { dialogId } = event.getData();

			UnreadModeManager.removeItemFromList({
				recentSections: [this.type],
				dialogId,
				parentChatId: this.parentChatId,
			});
		},
		getUnreadRecentService(): BaseRecentService
		{
			if (!this.service)
			{
				const ServiceClass = ServiceByRecentType[this.type];
				this.service = new ServiceClass({ unreadMode: true, parentChatId: this.parentChatId });
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
			data-test-id="im_container-recent__unread-list"
		>
			<template #before-list>
				<slot name="fixed-chats"></slot>
			</template>
			<template #empty-state>
				<RecentEmptyState 
					v-if="withEmptyState" 
					:title="loc('IM_LIST_COLLAB_UNREAD_EMPTY_STATE_TITLE')"
					:subtitle="loc('IM_LIST_COLLAB_UNREAD_EMPTY_STATE_SUBTITLE')"
				/>
			</template>
		</BaseRecentList>
	`,
};
