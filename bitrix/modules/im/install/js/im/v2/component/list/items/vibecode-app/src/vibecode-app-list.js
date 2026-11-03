import { type JsonObject } from 'main.core';
import { type EventEmitter } from 'main.core.events';
import { markRaw } from 'ui.vue3';

import { BaseRecentList } from 'im.v2.component.list.items.base';
import { ActiveCallList } from 'im.v2.component.list.items.elements.active-call-list';
import { RecentEmptyState } from 'im.v2.component.list.items.elements.empty-state';
import { DraftManager } from 'im.v2.lib.draft';
import { type ImModelFolder, type ImModelRecentItem } from 'im.v2.model';

import { VibecodeAppRecentMenu } from './classes/context-menu';
import { VibecodeAppRecentService } from './classes/vibecode-app-recent-service';

export { VibecodeAppUnreadList } from './components/modes/unread-list';

// Chat list of the system "Applications" folder. Personal folders keep their own list untouched:
// their composition is stored in the folder definition, ours is a recent section, and the two
// readings have nothing in common beyond the universal wiring of BaseRecentList.
// @vue/component
export const VibecodeAppList = {
	name: 'VibecodeAppList',
	components: { ActiveCallList, BaseRecentList, RecentEmptyState },
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
			isLoadingNextPage: false,
			firstPageLoaded: false,
			listIsScrolled: false,
		};
	},
	computed: {
		folder(): ?ImModelFolder
		{
			return this.$store.getters['recent/folders/getById'](this.folderId);
		},
		collection(): ImModelRecentItem[]
		{
			// The folder definition of a system folder carries no chat list: membership is the recent
			// section, and that is exactly where the tail service writes the loaded rows.
			const recentSection = this.folder?.definition?.recentSection;
			if (!recentSection)
			{
				return [];
			}

			return this.$store.getters['recent/getSortedCollection']({ type: recentSection });
		},
	},
	async created()
	{
		this.contextMenuManager = markRaw(new VibecodeAppRecentMenu({ emitter: this.getEmitter() }));

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
			try
			{
				await this.getRecentService().loadFirstPage();
				this.firstPageLoaded = true;
			}
			finally
			{
				this.isLoading = false;
			}
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
			try
			{
				await this.getRecentService().loadNextPage();
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
		onCallClick({ item })
		{
			this.onSelectChat(item.dialogId);
		},
		getRecentService(): VibecodeAppRecentService
		{
			if (!this.service)
			{
				this.service = new VibecodeAppRecentService({ folderId: this.folderId });
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
	// The empty state carries no "add chats" button on purpose: the composition of the system folder
	// is not filled by hand, it follows the application chats the user has access to (AC-025).
	template: `
		<BaseRecentList
			:collection="collection"
			:showMainLoader="isLoading && !firstPageLoaded"
			:showBottomLoader="isLoadingNextPage"
			:contextMenuManager="contextMenuManager"
			data-testid="vibecode-app-chat-list"
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
				<RecentEmptyState
					:title="loc('IM_LIST_VIBECODE_APP_EMPTY_STATE_TITLE')"
					:subtitle="loc('IM_LIST_VIBECODE_APP_EMPTY_STATE_SUBTITLE')"
					imageModifier="folder"
				/>
			</template>
		</BaseRecentList>
	`,
};
