import { ListLoadingState as LoadingState } from 'im.v2.component.elements.list-loading-state';
import { RecentManager } from 'im.v2.lib.recent';
import { Utils } from 'im.v2.lib.utils';
import { type ImModelRecentItem } from 'im.v2.model';

import { BaseRecentItem } from './recent-item/recent-item';

import '../css/base-list.css';

// @vue/component
export const BaseRecentList = {
	name: 'BaseRecentList',
	components: { LoadingState, BaseRecentItem },
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
		loc(phraseCode: string): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode);
		},
	},
	template: `
		<div class="bx-im-list-base__container">
			<slot name="before-list"></slot>
			<LoadingState v-if="showMainLoader" />
			<div v-else @scroll="onScroll" class="bx-im-list-base__scroll-container">
				<slot v-if="isEmptyCollection" name="empty-state" />
				<div v-if="showPinnedItems" class="bx-im-list-base__pinned_container">
					<template v-for="item in pinnedItems" :key="item.dialogId">
						<slot name="item" :item="item" :onClick="onClick" :onRightClick="onRightClick">
							<BaseRecentItem
								:item="item"
								@click="onClick(item)"
								@click.right="onRightClick(item, $event)"
							/>
						</slot>
					</template>
				</div>
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
			</div>
		</div>
	`,
};
