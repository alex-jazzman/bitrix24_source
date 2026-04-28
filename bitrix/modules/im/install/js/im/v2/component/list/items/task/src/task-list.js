import { type JsonObject } from 'main.core';
import { type EventEmitter } from 'main.core.events';

import { ListLoadingState as LoadingState } from 'im.v2.component.elements.list-loading-state';
import { RecentItem } from 'im.v2.component.list.items.recent';
import { RecentType } from 'im.v2.const';
import { DraftManager } from 'im.v2.lib.draft';
import { Utils } from 'im.v2.lib.utils';
import { type ImModelRecentItem } from 'im.v2.model';

import { TaskRecentMenu } from './classes/context-menu-manager';
import { TaskService } from './classes/task-service';
import { EmptyState } from './components/empty-state';

import './css/task-list.css';

// @vue/component
export const TaskList = {
	name: 'TaskList',
	components: { EmptyState, LoadingState, RecentItem },
	emits: ['chatClick'],
	data(): JsonObject
	{
		return {
			isLoading: false,
			isLoadingNextPage: false,
			firstPageLoaded: false,
		};
	},
	computed: {
		preparedItems(): ImModelRecentItem[]
		{
			return this.$store.getters['recent/getSortedCollection']({ type: RecentType.taskComments });
		},
		pinnedItems(): ImModelRecentItem[]
		{
			return this.preparedItems.filter((item) => item.pinned === true);
		},
		generalItems(): ImModelRecentItem[]
		{
			return this.preparedItems.filter((item) => item.pinned === false);
		},
		isEmptyCollection(): boolean
		{
			return this.preparedItems.length === 0;
		},
	},
	created()
	{
		this.contextMenuManager = new TaskRecentMenu({ emitter: this.getEmitter() });
	},
	beforeUnmount()
	{
		this.contextMenuManager.destroy();
	},
	async activated()
	{
		this.isLoading = true;
		await this.getRecentService().loadFirstPage();
		if (!this.firstPageLoaded)
		{
			void DraftManager.getInstance().initDraftHistory();
		}
		this.firstPageLoaded = true;
		this.isLoading = false;
	},
	methods: {
		async onScroll(event: Event)
		{
			this.contextMenuManager.close();
			if (!Utils.dom.isOneScreenRemaining(event.target) || !this.getRecentService().hasMoreItemsToLoad())
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

			const context = {
				dialogId: item.dialogId,
				recentItem: item,
			};
			this.contextMenuManager.openMenu(context, event.currentTarget);
		},
		getRecentService(): TaskService
		{
			if (!this.service)
			{
				this.service = new TaskService();
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
		<div class="bx-im-list-task__container">
			<LoadingState v-if="isLoading && !firstPageLoaded" />
			<div v-else @scroll="onScroll" class="bx-im-list-task__scroll-container">
				<EmptyState v-if="isEmptyCollection" />
				<div v-if="pinnedItems.length > 0" class="bx-im-list-task__pinned_container">
					<RecentItem
						v-for="item in pinnedItems"
						:key="item.dialogId"
						:item="item"
						@click="onClick(item)"
						@click.right="onRightClick(item, $event)"
					/>
				</div>
				<div class="bx-im-list-task__general_container">
					<RecentItem
						v-for="item in generalItems"
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
