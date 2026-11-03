import { ListLoadingState as LoadingState } from 'im.v2.component.elements.list-loading-state';
import { HotkeyCombination } from 'im.v2.const';
import { RecentManager } from 'im.v2.lib.recent';
import { Utils } from 'im.v2.lib.utils';
import { type ImModelRecentItem } from 'im.v2.model';
import { FadeAnimation } from 'im.v2.component.animation';

import { BaseRecentItem } from './recent-item/recent-item';
import { FixedItemContainer } from './fixed-item-container/fixed-item-container';
import { KeyboardNavigation } from './keyboard-navigation/keyboard-navigation';

import '../css/base-list.css';

// @vue/component
export const BaseRecentList = {
	name: 'BaseRecentList',
	components: { LoadingState, BaseRecentItem, FixedItemContainer, KeyboardNavigation, FadeAnimation },
	props: {
		collection: {
			type: Array,
			required: true,
		},
		withPinnedItems: {
			type: Boolean,
			default: true,
		},
		showMainLoader: {
			type: Boolean,
			default: false,
		},
		showBottomLoader: {
			type: Boolean,
			default: false,
		},
		// Owner of the row context menu; Shift+F10 / ContextMenu open it right from here, anchored
		// to the focused row with focus returned on close. Hosts pass a markRaw-ed instance
		// (a class must not become reactive).
		contextMenuManager: {
			/** @type ?BaseMenu */
			type: Object,
			default: null,
		},
	},
	emits: ['listScroll', 'loadNextPage', 'selectChat', 'itemRightClick', 'closeMenu'],
	computed: {
		preparedItems(): ImModelRecentItem[]
		{
			return this.collection.filter((item) => RecentManager.needToShowItem(item));
		},
		pinnedItems(): ImModelRecentItem[]
		{
			return this.preparedItems.filter((item) => item.pinned === true);
		},
		generalItems(): ImModelRecentItem[]
		{
			if (!this.withPinnedItems)
			{
				return this.preparedItems;
			}

			return this.preparedItems.filter((item) => item.pinned === false);
		},
		isEmptyCollection(): boolean
		{
			return this.preparedItems.length === 0;
		},
		showPinnedItems(): boolean
		{
			return this.withPinnedItems && this.pinnedItems.length > 0;
		},
	},
	methods: {
		async onScroll(event: Event)
		{
			const listIsScrolled = event.target.scrollTop > 0;
			this.$emit('listScroll', listIsScrolled);

			this.$emit('closeMenu');
			if (!Utils.dom.isOneScreenRemaining(event.target))
			{
				return;
			}

			this.$emit('loadNextPage');
		},
		onClick(item: ImModelRecentItem)
		{
			this.$emit('selectChat', item.dialogId);
		},
		onRightClick(item: ImModelRecentItem, event: PointerEvent)
		{
			this.$emit('itemRightClick', { item, event });
		},
		onRowKeydown(event: KeyboardEvent)
		{
			const isOpenKey = event.key === 'Enter' || event.key === ' ';
			const isContextMenuKey = Utils.key.isCombination(event, HotkeyCombination.list.contextMenu);
			if (!isOpenKey && !isContextMenuKey)
			{
				return;
			}

			const row = event.target?.closest?.('[data-id]');
			const item = this.preparedItems.find((current: ImModelRecentItem) => {
				return String(current.dialogId) === row?.dataset.id;
			});
			if (!item)
			{
				return;
			}

			event.preventDefault();

			if (isContextMenuKey)
			{
				// Open the menu anchored to the focused row (keyboard path); the manager returns
				// focus to the row on close.
				this.contextMenuManager?.openMenuFromKeyboard(
					{ dialogId: item.dialogId, recentItem: item },
					row,
				);

				return;
			}

			this.onClick(item);
		},
		onListShown()
		{
			this.$refs.keyboardNavigation?.refreshFocusZone();
		},
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-list-base__container">
			<slot name="before-scroll"></slot>
			<LoadingState v-if="showMainLoader" />
			<FadeAnimation :duration="200" @afterEnter="onListShown">
				<KeyboardNavigation v-if="!showMainLoader" ref="keyboardNavigation" @scroll="onScroll" @keydown="onRowKeydown">
					<slot name="before-list"></slot>
					<slot v-if="isEmptyCollection" name="empty-state" />
					<FixedItemContainer v-if="showPinnedItems" class="bx-im-list-base__pinned_container">
						<template v-for="item in pinnedItems" :key="item.dialogId">
							<slot name="item" :item="item" :onClick="onClick" :onRightClick="onRightClick">
								<BaseRecentItem
									:item="item"
									@click="onClick(item)"
									@click.right="onRightClick(item, $event)"
								/>
							</slot>
						</template>
					</FixedItemContainer>
					<div class="bx-im-list-base__general_container">
						<template v-for="item in generalItems" :key="item.dialogId">
							<slot name="item" :item="item" :onClick="onClick" :onRightClick="onRightClick">
								<BaseRecentItem
									:item="item"
									@click="onClick(item)"
									@click.right="onRightClick(item, $event)"
								/>
							</slot>
						</template>
					</div>
					<LoadingState v-if="showBottomLoader" />
				</KeyboardNavigation>
			</FadeAnimation>
		</div>
	`,
};
