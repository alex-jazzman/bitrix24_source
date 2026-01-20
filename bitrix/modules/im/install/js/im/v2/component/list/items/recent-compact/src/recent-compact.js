import 'im.v2.css.tokens';

import { Core } from 'im.v2.application.core';
import { ChatType, Settings } from 'im.v2.const';
import { Utils } from 'im.v2.lib.utils';
import { LegacyRecentService } from 'im.v2.provider.service.recent';
import { RecentMenu } from 'im.v2.lib.menu';
import { Messenger } from 'im.public';

import { CompactNavigation } from './components/compact-navigation';
import { RecentItem } from './components/recent-item';
import { EmptyState } from './components/empty-state';
import { CompactActiveCallList } from './components/compact-active-call-list';

import './css/recent-list.css';

import type { JsonObject } from 'main.core';
import type { EventEmitter } from 'main.core.events';
import type { ImModelRecentItem, ImModelCallItem } from 'im.v2.model';

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
		collection(): ImModelRecentItem[]
		{
			return this.getRecentService().getCollection();
		},
		preparedItems(): ImModelRecentItem[]
		{
			const filteredCollection = this.collection.filter((item) => {
				let result = true;
				if (!this.showBirthdays && item.isBirthdayPlaceholder)
				{
					result = false;
				}

				if (item.isFakeElement && !this.isFakeItemNeeded(item))
				{
					result = false;
				}

				return result;
			});

			return [...filteredCollection].sort((a, b) => {
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
		showBirthdays(): boolean
		{
			return this.$store.getters['application/settings/get'](Settings.recent.showBirthday);
		},
		showInvited(): boolean
		{
			return this.$store.getters['application/settings/get'](Settings.recent.showInvited);
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
		isFakeItemNeeded(item: ImModelRecentItem): boolean
		{
			const dialog = this.$store.getters['chats/get'](item.dialogId, true);
			const isUser = dialog.type === ChatType.user;
			const hasBirthday = isUser && this.showBirthdays && this.$store.getters['users/hasBirthday'](item.dialogId);

			return this.showInvited || hasBirthday;
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
				<EmptyState v-if="collection.length === 0" />
			</div>
		</div>
	`,
};
