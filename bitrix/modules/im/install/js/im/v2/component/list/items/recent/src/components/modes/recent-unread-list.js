import { BaseEvent } from 'main.core.events';

import { ListLoadingState as LoadingState } from 'im.v2.component.elements.list-loading-state';
import { CreateChatManager } from 'im.v2.lib.create-chat';
import { DraftManager } from 'im.v2.lib.draft';
import { RecentMenu } from 'im.v2.lib.menu';
import { Utils } from 'im.v2.lib.utils';
import { UnreadRecentService } from 'im.v2.provider.service.recent';
import { RecentEmptyState } from 'im.v2.component.list.items.elements.empty-state';

import { LikeManager } from '../../classes/like-manager';
import { ActiveCallList } from '../active-call-list';
import { CreateChat } from '../create-chat';
import { EmptyState } from '../empty-state';
import { RecentItem } from '../recent-item/recent-item';

import type { JsonObject } from 'main.core';
import type { EventEmitter } from 'main.core.events';
import type { ImModelCallItem, ImModelRecentItem } from 'im.v2.model';

// @vue/component
export const RecentUnreadList = {
	name: 'RecentUnreadList',
	components: {
		LoadingState,
		RecentItem,
		ActiveCallList,
		CreateChat,
		EmptyState,
		RecentEmptyState,
	},
	emits: ['chatClick'],
	data(): JsonObject {
		return {
			isLoading: false,
			isLoadingNextPage: false,
			listIsScrolled: false,
			isCreatingChat: false,
		};
	},
	computed: {
		collection(): ImModelRecentItem[]
		{
			return this.getUnreadRecentService().getCollection();
		},
		isEmptyCollection(): boolean
		{
			return this.collection.length === 0;
		},
		preparedItems(): ImModelRecentItem[]
		{
			return [...this.collection].sort((a, b) => {
				const firstDate = this.$store.getters['recent/getSortDate'](a.dialogId);
				const secondDate = this.$store.getters['recent/getSortDate'](b.dialogId);

				return secondDate - firstDate;
			});
		},
		activeCalls(): ImModelCallItem[]
		{
			return this.$store.getters['recent/calls/get'];
		},
		pinnedItems(): ImModelRecentItem[]
		{
			return this.preparedItems.filter((item) => {
				return item.pinned === true;
			});
		},
		generalItems(): ImModelRecentItem[]
		{
			return this.preparedItems.filter((item) => {
				return item.pinned === false;
			});
		},
	},
	async created() {
		this.contextMenuManager = new RecentMenu({ emitter: this.getEmitter() });

		this.initLikeManager();
		this.initCreateChatManager();

		this.isLoading = true;
		await this.getUnreadRecentService().loadFirstPage({ ignorePreloadedItems: true });
		this.isLoading = false;

		void DraftManager.getInstance().initDraftHistory();
	},
	beforeUnmount() {
		this.contextMenuManager.destroy();
		this.destroyLikeManager();
		this.destroyCreateChatManager();
	},
	methods: {
		async onScroll(event: Event)
		{
			this.listIsScrolled = event.target.scrollTop > 0;

			this.getUnreadRecentService().hasMoreItemsToLoad = true;

			this.contextMenuManager.close();
			if (!Utils.dom.isOneScreenRemaining(event.target) || !this.getUnreadRecentService().hasMoreItemsToLoad)
			{
				return;
			}

			this.isLoadingNextPage = true;
			await this.getUnreadRecentService().loadNextPage();
			this.isLoadingNextPage = false;
		},
		onClick(item)
		{
			this.$emit('chatClick', item.dialogId);
		},
		onRightClick(item, event)
		{
			if (Utils.key.isCombination(event, 'Alt+Shift'))
			{
				return;
			}

			const context = {
				dialogId: item.dialogId,
				recentItem: item,
				compactMode: false,
			};

			const positionTarget = {
				left: event.clientX,
				top: event.clientY,
			};

			this.contextMenuManager.openMenu(context, positionTarget);

			event.preventDefault();
		},
		onCallClick({ item, $event })
		{
			this.onClick(item, $event);
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
		getUnreadRecentService(): UnreadRecentService
		{
			if (!this.service)
			{
				this.service = UnreadRecentService.getInstance();
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
		<div class="bx-im-list-recent__container">
			<ActiveCallList :listIsScrolled="listIsScrolled" @onCallClick="onCallClick"/>
			<CreateChat v-if="isCreatingChat" />
			<LoadingState v-if="isLoading" />
			<div v-else @scroll="onScroll" class="bx-im-list-recent__scroll-container">
				<RecentEmptyState
					v-if="isEmptyCollection" 
					:title="loc('IM_LIST_UNREAD_RECENT_EMPTY_STATE_TITLE')"
				/>
				<div v-if="pinnedItems.length > 0" class="bx-im-list-recent__pinned_container">
					<RecentItem
						v-for="item in pinnedItems"
						:key="item.dialogId"
						:item="item"
						@click="onClick(item, $event)"
						@click.right="onRightClick(item, $event)"
					/>
				</div>
				<div class="bx-im-list-recent__general_container">
					<RecentItem
						v-for="item in generalItems"
						:key="item.dialogId"
						:item="item"
						@click="onClick(item, $event)"
						@click.right="onRightClick(item, $event)"
					/>
				</div>
				<LoadingState v-if="isLoadingNextPage" />
			</div>
		</div>
	`,
};
