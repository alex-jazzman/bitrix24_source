import { type JsonObject } from 'main.core';
import { type BaseEvent, type EventEmitter } from 'main.core.events';

import { RecentType } from 'im.v2.const';
import { BaseRecentList } from 'im.v2.component.list.items.base';
import { CreateChatStatus } from 'im.v2.component.list.items.elements.create-chat-status';
import { DraftManager } from 'im.v2.lib.draft';
import { type ImModelRecentItem } from 'im.v2.model';
import { TaskRecentService, CalendarRecentService, CopilotRecentV2Service, type BaseRecentService } from 'im.v2.provider.service.recent';
import { CreateChatManager } from 'im.v2.lib.create-chat';
import { Notifier } from 'im.v2.lib.notifier';

import { CollabNestedRecentMenu } from './classes/context-menu';
import { CollabDefaultService } from '../../classes/services/collab-default';
import { CollabChatService } from '../../classes/services/collab-chat';
import { CollabNestedEmptyState } from './components/empty-state.js';

export const ServiceByRecentType = {
	[RecentType.collabDefault]: CollabDefaultService,
	[RecentType.taskComments]: TaskRecentService,
	[RecentType.collabChat]: CollabChatService,
	[RecentType.calendar]: CalendarRecentService,
	[RecentType.copilot]: CopilotRecentV2Service,
};

// @vue/component
export const BaseCollabNestedList = {
	name: 'BaseCollabNestedList',
	components: { CollabNestedEmptyState, BaseRecentList, CreateChatStatus },
	props: {
		parentChatId: {
			type: Number,
			required: true,
		},
		type: {
			type: String,
			required: true,
		},
		creatableChatType: {
			type: String,
			default: '',
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
			isCreatingChat: false,
		};
	},
	computed: {
		collection(): ImModelRecentItem[]
		{
			return this.$store.getters['recent/getSortedCollection']({
				parentChatId: this.parentChatId,
				type: this.type,
			});
		},
		showCreationStatus(): boolean
		{
			return this.isCreatingChat && this.creatableChatType;
		},
	},
	async created()
	{
		this.initCreateChatManager();

		this.contextMenuManager = new CollabNestedRecentMenu({ emitter: this.getEmitter() });

		await this.loadInitialItems();
		void DraftManager.getInstance().initDraftHistory();
	},
	beforeUnmount()
	{
		this.destroyCreateChatManager();
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
			await this.getRecentService().loadFirstPage()
				.catch((error) => {
					Notifier.chat.handleLoadError(error);
					this.$emit('loadError');
				});
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

			const isOwnChatTypeCreation = CreateChatManager.getInstance().getChatType() === this.creatableChatType;
			if (this.isCreatingChat && isOwnChatTypeCreation)
			{
				CreateChatManager.getInstance().setCreationStatus(false);
			}
		},
		getRecentService(): BaseRecentService
		{
			if (!this.service)
			{
				const ServiceClass = ServiceByRecentType[this.type];
				this.service = new ServiceClass({ parentChatId: this.parentChatId });
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
			<template #before-list>
				<slot name="fixed-chats"></slot>
				<CreateChatStatus v-if="showCreationStatus" :allowedTypes="[creatableChatType]" />
			</template>
			<template #empty-state>
				<CollabNestedEmptyState v-if="withEmptyState" :type="type" />
			</template>
		</BaseRecentList>
	`,
};
