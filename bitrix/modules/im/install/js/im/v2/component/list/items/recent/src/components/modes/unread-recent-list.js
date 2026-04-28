import { type JsonObject } from 'main.core';
import { type EventEmitter } from 'main.core.events';

import { ListLoadingState as LoadingState } from 'im.v2.component.elements.list-loading-state';
import { RecentEmptyState } from 'im.v2.component.list.items.elements.empty-state';
import { RecentType } from 'im.v2.const';
import { DraftManager } from 'im.v2.lib.draft';
import { RecentMenu } from 'im.v2.lib.menu';
import { Utils } from 'im.v2.lib.utils';
import { type ImModelCallItem, ImModelRecentItem } from 'im.v2.model';
import { UnreadRecentService } from 'im.v2.provider.service.recent';

import { LikeManager } from '../../classes/like-manager';
import { RecentItem } from '../recent-item/recent-item';

// @vue/component
export const RecentUnreadList = {
	name: 'RecentUnreadList',
	components: {
		LoadingState,
		RecentItem,
		RecentEmptyState,
	},
	emits: ['chatClick'],
	data(): JsonObject {
		return {
			isLoading: false,
			isLoadingNextPage: false,
		};
	},
	computed: {
		isEmptyCollection(): boolean
		{
			return this.preparedItems.length === 0;
		},
		preparedItems(): ImModelRecentItem[]
		{
			return this.$store.getters['recent/getSortedUnreadCollection']({ type: RecentType.default });
		},
		activeCalls(): ImModelCallItem[]
		{
			return this.$store.getters['recent/calls/get'];
		},
		pinnedItems(): ImModelRecentItem[]
		{
			return this.preparedItems.filter((item) => item.pinned === true);
		},
		generalItems(): ImModelRecentItem[]
		{
			return this.preparedItems.filter((item) => item.pinned === false);
		},
	},
	async created() {
		this.contextMenuManager = new RecentMenu({ emitter: this.getEmitter() });

		this.initLikeManager();

		this.isLoading = true;
		await this.getUnreadRecentService().loadFirstPage({ ignorePreloadedItems: true });
		this.isLoading = false;

		void DraftManager.getInstance().initDraftHistory();
	},
	beforeUnmount() {
		this.contextMenuManager.destroy();
		this.destroyLikeManager();
	},
	methods: {
		async onScroll(event: Event)
		{
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
				left: event.pageX,
				top: event.pageY,
			};

			this.contextMenuManager.openMenu(context, positionTarget);

			event.preventDefault();
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
