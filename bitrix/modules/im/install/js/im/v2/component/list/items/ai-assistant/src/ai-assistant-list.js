import { DraftManager } from 'im.v2.lib.draft';
import { Utils } from 'im.v2.lib.utils';
import { ListLoadingState as LoadingState } from 'im.v2.component.elements.list-loading-state';
import { RecentItem } from 'im.v2.component.list.items.recent';

import { AiAssistantRecentService } from './classes/recent-service';
import { AiAssistantRecentMenu } from './classes/context-menu-manager';

import './css/ai-assistant-list.css';

import type { JsonObject } from 'main.core';
import type { ImModelRecentItem } from 'im.v2.model';

// @vue/component
export const AiAssistantList = {
	name: 'AiAssistantList',
	components: { RecentItem, LoadingState },
	emits: ['chatClick'],
	data(): JsonObject
	{
		return {
			isLoading: false,
			isLoadingNextPage: false,
		};
	},
	computed: {
		collection(): ImModelRecentItem[]
		{
			return this.$store.getters['recent/getAiAssistantCollection'];
		},
		sortedItems(): ImModelRecentItem[]
		{
			return [...this.collection].sort((a, b) => {
				const firstDate = this.$store.getters['recent/getSortDate'](a.dialogId);
				const secondDate = this.$store.getters['recent/getSortDate'](b.dialogId);

				return secondDate - firstDate;
			});
		},
		pinnedItems(): ImModelRecentItem[]
		{
			return this.sortedItems.filter((item) => {
				return item.pinned === true;
			});
		},
		generalItems(): ImModelRecentItem[]
		{
			return this.sortedItems.filter((item) => {
				return item.pinned === false;
			});
		},
		isEmptyCollection(): boolean
		{
			return this.collection.length === 0;
		},
	},
	async created()
	{
		this.contextMenuManager = new AiAssistantRecentMenu();

		this.isLoading = true;
		await this.getRecentService().loadFirstPage();
		this.isLoading = false;
		void DraftManager.getInstance().initDraftHistory();
	},
	beforeUnmount()
	{
		this.contextMenuManager.destroy();
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
		onClick(item)
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
		getRecentService(): AiAssistantRecentService
		{
			if (!this.service)
			{
				this.service = new AiAssistantRecentService();
			}

			return this.service;
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-list-ai-assistant__container">
			<LoadingState v-if="isLoading && isEmptyCollection" />
			<div v-else @scroll="onScroll" class="bx-im-list-ai-assistant__scroll-container">
				<div v-if="isEmptyCollection" class="bx-im-list-ai-assistant__empty">
					<div class="bx-im-list-ai-assistant__empty_icon"></div>
					<div class="bx-im-list-ai-assistant__empty_text">
						{{ loc('IM_LIST_COPILOT_EMPTY') }}
					</div>
				</div>
				<div v-if="pinnedItems.length > 0" class="bx-im-list-ai-assistant__pinned_container">
					<RecentItem
						v-for="item in pinnedItems"
						:key="item.dialogId"
						:item="item"
						@click="onClick(item, $event)"
						@click.right="onRightClick(item, $event)"
					/>
				</div>
				<div class="bx-im-list-ai-assistant__general_container">
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
