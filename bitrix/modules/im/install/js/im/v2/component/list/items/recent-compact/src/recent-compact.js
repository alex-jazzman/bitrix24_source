import { type JsonObject } from 'main.core';
import { type EventEmitter } from 'main.core.events';

import { Messenger } from 'im.public';
import { Core } from 'im.v2.application.core';
import { RecentType } from 'im.v2.const';
import 'im.v2.css.tokens';
import { RecentMenu } from 'im.v2.lib.menu';
import { RecentManager } from 'im.v2.lib.recent';
import { Utils } from 'im.v2.lib.utils';
import { type ImModelRecentItem, ImModelCallItem } from 'im.v2.model';
import { LegacyRecentService } from 'im.v2.provider.service.recent';

import { CompactActiveCallList } from './components/compact-active-call-list';
import { CompactNavigation } from './components/compact-navigation';
import { EmptyState } from './components/empty-state';
import { RecentItem } from './components/recent-item';

import './css/recent-list.css';

// @vue/component
export const RecentList = {
	name: 'RecentList',
	components: { RecentItem, EmptyState, CompactNavigation, CompactActiveCallList },
	emits: ['chatClick'],
	data(): JsonObject
	{
		return {};
	},
	computed:
	{
		preparedItems(): ImModelRecentItem[]
		{
			const collection = this.$store.getters['recent/getSortedCollection']({ type: RecentType.default });

			return collection.filter((item) => RecentManager.needToShowItem(item));
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
		isEmptyCollection(): boolean
		{
			return this.preparedItems.length === 0;
		},
	},
	async created()
	{
		this.contextMenuManager = new RecentMenu({ emitter: this.getEmitter() });

		this.managePreloadedList();

		await this.getRecentService().loadFirstPage();
	},
	beforeUnmount()
	{
		this.contextMenuManager.destroy();
	},
	methods:
	{
		onClick(item)
		{
			Messenger.openChat(item.dialogId);
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
				compactMode: true,
			};

			this.contextMenuManager.openMenu(context, event.currentTarget);

			event.preventDefault();
		},
		managePreloadedList()
		{
			const { preloadedList } = Core.getApplicationData();
			if (!preloadedList)
			{
				return;
			}

			this.getRecentService().setPreloadedData(preloadedList);
		},
		getRecentService(): LegacyRecentService
		{
			if (!this.service)
			{
				this.service = LegacyRecentService.getInstance();
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
		<div class="bx-im-messenger__scope bx-im-list-recent-compact__container">
			<CompactNavigation />
			<CompactActiveCallList @click="onClick" />
			<div class="bx-im-list-recent-compact__scroll-container">
				<div v-if="pinnedItems.length > 0" class="bx-im-list-recent-compact__pinned_container">
					<RecentItem
						v-for="item in pinnedItems"
						:key="item.dialogId"
						:item="item"
						@click="onClick(item)"
						@click.right="onRightClick(item, $event)"
					/>
				</div>
				<div class="bx-im-list-recent-compact__general_container">
					<RecentItem
						v-for="item in generalItems"
						:key="item.dialogId"
						:item="item"
						@click="onClick(item)"
						@click.right="onRightClick(item, $event)"
					/>
				</div>	
				<EmptyState v-if="isEmptyCollection" />
			</div>
		</div>
	`,
};
