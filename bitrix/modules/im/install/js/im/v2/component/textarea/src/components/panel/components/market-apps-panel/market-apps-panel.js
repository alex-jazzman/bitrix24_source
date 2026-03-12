import { RichLoc } from 'ui.vue3.components.rich-loc';

import { PlacementType } from 'im.v2.const';
import { MarketManager } from 'im.v2.lib.market';

import { MarketAppItem } from './market-app-item';
import { MarketShowMorePopup } from './market-show-more-popup';

import '../../css/market-apps-panel/market-apps-panel.css';

import type { ImModelMarketApplication } from 'im.v2.model';

const MAX_EXPANDED_ITEMS = 5;
const MAX_COLLAPSED_ITEMS = 15;

// @vue/component
export const MarketAppsPanel = {
	name: 'MarketAppsPanel',
	components: { MarketAppItem, MarketShowMorePopup, RichLoc },
	props: {
		dialogId: {
			type: String,
			required: true,
		},
	},
	computed:
	{
		marketMenuItems(): ImModelMarketApplication[]
		{
			return MarketManager.getInstance().getAvailablePlacementsByType(PlacementType.textarea, this.dialogId);
		},
		marketItemsToShow(): {displayedItems: ImModelMarketApplication[], hiddenItems: ImModelMarketApplication[]}
		{
			const maxItems = this.hideTitle ? MAX_COLLAPSED_ITEMS : MAX_EXPANDED_ITEMS;

			return {
				displayedItems: this.marketMenuItems.slice(0, maxItems),
				hiddenItems: this.marketMenuItems.slice(maxItems),
			};
		},
		hideTitle(): boolean
		{
			return this.marketMenuItems.length > MAX_EXPANDED_ITEMS;
		},
		needMoreButton(): boolean
		{
			return this.marketItemsToShow.hiddenItems.length > 0;
		},
		isEmptyState(): boolean
		{
			return this.marketItemsToShow.displayedItems.length === 0;
		},
		emptyStateText(): string
		{
			return this.loc('IM_TEXTAREA_MARKET_APPS_EMPTY_STATE_MSGVER_2');
		},
	},
	methods: {
		onEmptyStateLinkClick(): void
		{
			MarketManager.openChatMarket();
		},
		loc(phraseCode: string, replacements: {[p: string]: string} = {}): string
		{
			return this.$Bitrix.Loc.getMessage(phraseCode, replacements);
		},
	},
	template: `
		<div class="bx-im-market-apps-panel__scope">
			<div v-if="isEmptyState" class="bx-im-market-apps-panel__empty-state-container">
				<div class="bx-im-market-apps-panel__empty-state-icon"></div>
				<div class="bx-im-market-apps-panel__empty-state-text">
					<RichLoc :text="emptyStateText" placeholder="[url]">
						<template #url="{ text }">
							<span class="bx-im-market-apps-panel__empty-state-link" @click="onEmptyStateLinkClick">
								{{ text }}
							</span>
						</template>
					</RichLoc>
				</div>
				<div class="bx-im-market-apps-panel__empty-state-button"></div>
			</div>
			<div v-else class="bx-im-market-apps-panel__container">
				<div class="bx-im-market-apps-panel__items-container" :class="{'--short': hideTitle}">
					<MarketAppItem
						v-for="item in marketItemsToShow.displayedItems"
						:item="item"
						:hideTitle="hideTitle"
						:dialogId="dialogId"
					/>
				</div>
				<MarketShowMorePopup 
					v-if="needMoreButton" 
					:marketApps="marketItemsToShow.hiddenItems"
					:dialogId="dialogId"
				/>
			</div>
		</div>
	`,
};
