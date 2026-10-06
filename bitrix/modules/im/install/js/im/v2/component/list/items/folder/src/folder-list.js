import { type JsonObject } from 'main.core';
import { type EventEmitter } from 'main.core.events';

import { BaseRecentList } from 'im.v2.component.list.items.base';
import { DraftManager } from 'im.v2.lib.draft';
import { type ImModelRecentItem, type ImModelLayout, type ImModelFolder } from 'im.v2.model';

import { FolderRecentService } from './classes/folder-service';
import { FolderRecentMenu } from './classes/context-menu';
import { EmptyState } from './components/empty-state';

// @vue/component
export const FolderChatList = {
	name: 'FolderChatList',
	components: { BaseRecentList, EmptyState },
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
			firstPageLoaded: false,
		};
	},
	computed: {
		layout(): ImModelLayout
		{
			return this.$store.getters['application/getLayout'];
		},
		collection(): ImModelRecentItem[]
		{
			const folderDialogIds = this.folder.definition.chats.map((chat) => chat.dialogId);

			return this.$store.getters['recent/getCollectionByIds'](folderDialogIds);
		},
		folder(): ImModelFolder
		{
			return this.$store.getters['recent/folders/getById'](this.folderId);
		},
	},
	async created()
	{
		this.contextMenuManager = new FolderRecentMenu({ emitter: this.getEmitter() });

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
		getRecentService(): FolderRecentService
		{
			if (!this.service)
			{
				this.service = new FolderRecentService({ folderId: this.folderId });
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
			data-testid="folder-chat-list"
			@selectChat="onSelectChat"
			@itemRightClick="onItemRightClick"
			@closeMenu="onCloseMenu"
		>
			<template #empty-state>
				<EmptyState :folderId="folderId" />
			</template>
		</BaseRecentList>
	`,
};
