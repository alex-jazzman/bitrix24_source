import { type JsonObject } from 'main.core';
import { type EventEmitter } from 'main.core.events';
import { markRaw } from 'ui.vue3';

import { BaseRecentList } from 'im.v2.component.list.items.base';
import { ActiveCallList } from 'im.v2.component.list.items.elements.active-call-list';
import { DraftManager } from 'im.v2.lib.draft';
import { type ImModelRecentItem, type ImModelLayout, type ImModelFolder } from 'im.v2.model';

import { FolderRecentService } from './classes/folder-service';
import { FolderRecentMenu } from './classes/context-menu';
import { EmptyState } from './components/empty-state';

// @vue/component
export const PersonalFolderList = {
	name: 'PersonalFolderList',
	components: { ActiveCallList, BaseRecentList, EmptyState },
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
			loadingFolderId: 0,
			loadedFolderId: 0,
			listIsScrolled: false,
		};
	},
	computed: {
		layout(): ImModelLayout
		{
			return this.$store.getters['application/getLayout'];
		},
		isLoading(): boolean
		{
			return this.loadingFolderId === this.folderId;
		},
		firstPageLoaded(): boolean
		{
			return this.loadedFolderId === this.folderId;
		},
		collection(): ImModelRecentItem[]
		{
			const folderDialogIds = this.folder?.definition.chats.map((chat) => chat.dialogId) ?? [];

			return this.$store.getters['recent/getCollectionByIds'](folderDialogIds);
		},
		folder(): ?ImModelFolder
		{
			return this.$store.getters['recent/folders/getById'](this.folderId);
		},
	},
	watch: {
		folderId()
		{
			void this.loadInitialItems();
		},
	},
	async created()
	{
		this.contextMenuManager = markRaw(new FolderRecentMenu({ emitter: this.getEmitter() }));

		await this.loadInitialItems();

		void DraftManager.getInstance().initDraftHistory();
	},
	activated()
	{
		void this.loadInitialItems();
	},
	beforeUnmount()
	{
		this.contextMenuManager.destroy();
	},
	methods: {
		async loadInitialItems()
		{
			if (this.isLoading)
			{
				return;
			}

			const folderId = this.folderId;
			const recentService = FolderRecentService.getInstance(folderId);
			if (recentService.isStateComplete())
			{
				this.loadedFolderId = folderId;

				return;
			}

			this.loadingFolderId = folderId;
			try
			{
				await recentService.loadFirstPage();
				if (!recentService.isStateComplete())
				{
					await recentService.loadFirstPage();
				}
				this.loadedFolderId = folderId;
			}
			finally
			{
				if (this.loadingFolderId === folderId)
				{
					this.loadingFolderId = 0;
				}
			}
		},
		onListScroll(isScrolled: boolean)
		{
			this.listIsScrolled = isScrolled;
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
		getEmitter(): EventEmitter
		{
			return this.$Bitrix.eventEmitter;
		},
	},
	template: `
		<BaseRecentList
			:key="folderId"
			:collection="collection"
			:showMainLoader="isLoading && !firstPageLoaded"
			:contextMenuManager="contextMenuManager"
			data-testid="folder-chat-list"
			@listScroll="onListScroll"
			@selectChat="onSelectChat"
			@itemRightClick="onItemRightClick"
			@closeMenu="onCloseMenu"
		>
			<template #before-scroll>
				<ActiveCallList :listIsScrolled="listIsScrolled" @onCallClick="onCallClick" />
			</template>
			<template #empty-state>
				<EmptyState :folderId="folderId" />
			</template>
		</BaseRecentList>
	`,
};
