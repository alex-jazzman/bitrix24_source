import { MarketManager } from 'im.v2.lib.market';
import { type ImModelMarketApplication } from 'im.v2.model';

import '../../css/market-apps-panel/market-app-item.css';

// @vue/component
export const MarketAppItem = {
	name: 'MarketAppItem',
	props: {
		item: {
			type: Object,
			required: true,
		},
		hideTitle: {
			type: Boolean,
			default: false,
		},
		dialogId: {
			type: String,
			required: true,
		},
	},
	computed:
	{
		marketItem(): ImModelMarketApplication
		{
			return this.item;
		},
		iconClass(): string
		{
			return `fa ${this.marketItem.options.iconName}`;
		},
		iconColor(): string
		{
			return this.marketItem.options.color;
		},
		isOpened(): boolean
		{
			return this.$store.getters['market/getOpenedAppId'](this.dialogId) === this.marketItem.id;
		},
	},
	methods:
	{
		onAppClick()
		{
			if (this.isOpened)
			{
				MarketManager.getInstance().closePlacement(this.dialogId, this.marketItem.id);

				return;
			}

			this.showPlacement();
		},
		showPlacement()
		{
			MarketManager.getInstance().showPlacement({
				dialogId: this.dialogId,
				appId: this.marketItem.id,
				bindElement: this.$refs['market-app'],
				width: this.marketItem.options.width,
				height: this.marketItem.options.height,
			});
		},
	},
	template: `
		<div
			class="bx-im-market-app-item__container"
			:class="{'--short': hideTitle, '--opened': isOpened}"
			:title="marketItem.title"
			@click="onAppClick"
			ref="market-app"
		>
			<div class="bx-im-market-app-item__icon-container" :style="{backgroundColor: iconColor}">
				<i :class="iconClass" aria-hidden="true"></i>
			</div>
			<div v-if="!hideTitle" class="bx-im-market-app-item__title-container" :title="marketItem.title">
				<div class="bx-im-market-app-item__title-text">
					{{ marketItem.title }}
				</div>
			</div>
		</div>
	`,
};
