import { type JsonObject } from 'main.core';
import { type EventEmitter } from 'main.core.events';

import { ListLoadingState as LoadingState } from 'im.v2.component.elements.list-loading-state';
import { RecentType } from 'im.v2.const';
import { DraftManager } from 'im.v2.lib.draft';
import { Utils } from 'im.v2.lib.utils';
import { type ImModelRecentItem } from 'im.v2.model';

import { CopilotRecentMenu } from './classes/context-menu-manager';
import { CopilotRecentService } from './classes/copilot-service';
import { CopilotItem } from './components/copilot-item';

import './css/copilot-list.css';

// @vue/component
export const CopilotList = {
	name: 'CopilotList',
	components: { CopilotItem, LoadingState },
	emits: ['chatClick'],
	data(): JsonObject
	{
		return {
			isLoading: false,
			isLoadingNextPage: false,
		};
	},
	computed:
	{
		sortedItems(): ImModelRecentItem[]
		{
			return this.$store.getters['recent/getSortedCollection']({ type: RecentType.copilot });
		},
		pinnedItems(): ImModelRecentItem[]
		{
			return this.sortedItems.filter((item) => item.pinned === true);
		},
		generalItems(): ImModelRecentItem[]
		{
			return this.sortedItems.filter((item) => item.pinned === false);
		},
		isEmptyCollection(): boolean
		{
			return this.sortedItems.length === 0;
		},
	},
	async created()
	{
		this.contextMenuManager = new CopilotRecentMenu({ emitter: this.getEmitter() });

		this.isLoading = true;
		await this.getRecentService().loadFirstPage();
		this.isLoading = false;
		void DraftManager.getInstance().initDraftHistory();
	},
	beforeUnmount()
	{
		this.contextMenuManager.destroy();
	},
	methods:
	{
		async onScroll(event: Event)
		{
			this.contextMenuManager.close();
			if (!Utils.dom.isOneScreenRemaining(event.target) || !this.getRecentService().hasMoreItemsToLoad)
			{
				return;
			}

			this.isLoadingNextPage = true;
			await this.getRecentService().loadNextPage();
			this.isLoadingNextPage = false;
		},
		onClick(item, event)
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
		getRecentService(): CopilotRecentService
		{
			if (!this.service)
			{
				this.service = new CopilotRecentService();
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
		<div class="bx-im-list-copilot__scope bx-im-list-copilot__container">
			<LoadingState v-if="isLoading && isEmptyCollection" />
			<div v-else @scroll="onScroll" class="bx-im-list-copilot__scroll-container">
				<div v-if="isEmptyCollection" class="bx-im-list-copilot__empty">
					<div class="bx-im-list-copilot__empty_icon"></div>
					<div class="bx-im-list-copilot__empty_text">{{ loc('IM_LIST_COPILOT_EMPTY') }}</div>
				</div>
				<div v-if="pinnedItems.length > 0" class="bx-im-list-copilot__pinned_container">
					<CopilotItem
						v-for="item in pinnedItems"
						:key="item.dialogId"
						:item="item"
						@click="onClick(item, $event)"
						@click.right="onRightClick(item, $event)"
					/>
				</div>
				<div class="bx-im-list-copilot__general_container">
					<CopilotItem
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
