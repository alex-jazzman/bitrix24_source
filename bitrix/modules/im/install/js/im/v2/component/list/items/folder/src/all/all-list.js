import { type JsonObject } from 'main.core';
import { type BaseEvent, EventEmitter } from 'main.core.events';
import { markRaw } from 'ui.vue3';

import { BaseRecentList } from 'im.v2.component.list.items.base';
import { ActiveCallList } from 'im.v2.component.list.items.elements.active-call-list';
import { CreateChatStatus } from 'im.v2.component.list.items.elements.create-chat-status';
import { ChatsEmptyState, LikeManager } from 'im.v2.component.list.items.recent';
import { EventType } from 'im.v2.const';
import { CreateChatManager } from 'im.v2.lib.create-chat';
import { DraftManager } from 'im.v2.lib.draft';
import { RecentMenu } from 'im.v2.lib.menu';
import { type ImModelCallItem, type ImModelRecentItem } from 'im.v2.model';

import { AllFolderRecentService } from './classes/all-folder-recent-service';

// @vue/component
export const AllFolderList = {
	name: 'AllFolderList',
	components: { BaseRecentList, ActiveCallList, CreateChatStatus, ChatsEmptyState },
	props: {
		// Read once when the service is built: a later value does not re-target the loaded pages.
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
			isCreatingChat: false,
		};
	},
	computed: {
		collection(): ImModelRecentItem[]
		{
			return this.service.getCollection();
		},
	},
	async created()
	{
		// The service owns the page cursor, so it is built once per list and never lazily in a computed:
		// a rebuilt service would lose the cursor and show the union uncut.
		this.service = new AllFolderRecentService({ folderId: this.folderId });
		// Full row menu, as in the "Chats" list: "All" is the main section and holds every chat type,
		// so the trimmed FolderRecentMenu (personal folders only) would cost it "Hide" and "Leave".
		this.contextMenuManager = markRaw(new RecentMenu({ emitter: this.getEmitter() }));
		this.initLikeManager();
		this.initCreateChatManager();
		EventEmitter.subscribe(EventType.recent.dayChanged, this.onDayChanged);
		// Lists live under KeepAlive, so a hidden one stays subscribed; only the visible one reacts.
		this.isOnScreen = true;
		this.missedDayChange = false;

		await this.loadInitialItems();

		void DraftManager.getInstance().initDraftHistory();
	},
	activated()
	{
		this.isOnScreen = true;
		if (this.missedDayChange)
		{
			this.missedDayChange = false;
			void this.service.loadFirstPage();
		}
	},
	deactivated()
	{
		this.isOnScreen = false;
	},
	beforeUnmount()
	{
		EventEmitter.unsubscribe(EventType.recent.dayChanged, this.onDayChanged);
		this.contextMenuManager.destroy();
		this.destroyLikeManager();
		this.destroyCreateChatManager();
	},
	methods: {
		async loadInitialItems()
		{
			if (this.firstPageLoaded || this.isLoading)
			{
				return;
			}

			this.isLoading = true;
			await this.service.loadFirstPage();
			this.firstPageLoaded = true;
			this.isLoading = false;
		},
		onListScroll(isScrolled: boolean)
		{
			this.listIsScrolled = isScrolled;
		},
		async onLoadNextPage()
		{
			if (this.isLoadingNextPage || !this.service.hasMoreItemsToLoad())
			{
				return;
			}

			this.isLoadingNextPage = true;
			await this.service.loadNextPage();
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
		onCallClick({ item }: { item: ImModelCallItem })
		{
			this.onSelectChat(item.dialogId);
		},
		initLikeManager()
		{
			this.likeManager = new LikeManager();
			this.likeManager.init();
		},
		destroyLikeManager()
		{
			this.likeManager.destroy();
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
		},
		// Birthday marks are computed for the current day and go stale once it turns over. A hidden
		// list defers the reload to the moment it comes back: reloading it now costs a page request
		// for a list nobody is looking at.
		onDayChanged()
		{
			if (!this.isOnScreen)
			{
				this.missedDayChange = true;

				return;
			}

			void this.service.loadFirstPage();
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
			:contextMenuManager="contextMenuManager"
			data-testid="folder-all-chat-list"
			@listScroll="onListScroll"
			@selectChat="onSelectChat"
			@itemRightClick="onItemRightClick"
			@closeMenu="onCloseMenu"
			@loadNextPage="onLoadNextPage"
		>
			<template #before-scroll>
				<ActiveCallList :listIsScrolled="listIsScrolled" @onCallClick="onCallClick" />
			</template>
			<template #before-list>
				<CreateChatStatus v-if="isCreatingChat" />
			</template>
			<template #empty-state>
				<!-- An empty "All" means an empty messenger, so the "Chats" wording with its invite
				button works here unchanged. data-testid falls through to the state's root element. -->
				<ChatsEmptyState data-testid="folder-all-empty-state" />
			</template>
		</BaseRecentList>
	`,
};
