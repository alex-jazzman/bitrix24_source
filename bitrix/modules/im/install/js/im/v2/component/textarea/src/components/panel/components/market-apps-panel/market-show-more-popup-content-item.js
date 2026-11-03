import { type ImModelMarketApplication } from 'im.v2.model';

import '../../css/market-apps-panel/market-show-more-popup-content-item.css';

// @vue/component
export const MarketShowMorePopupContentItem = {
	name: 'MarketShowMorePopupContentItem',
	props: {
		item: {
			type: Object,
			required: true,
		},
		dialogId: {
			type: String,
			required: true,
		},
	},
	emits: ['appClick'],
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
			this.$emit('appClick');
		},
	},
	template: `
		<div
			class="bx-im-market-show-more-popup-content-item__container"
			:class="{'--opened': isOpened}"
			:title="marketItem.title"
			@click="onAppClick"
		>
			<div class="bx-im-market-show-more-popup-content-item__icon-container" :style="{backgroundColor: iconColor}">
				<i :class="iconClass" aria-hidden="true"></i>
			</div>
			<div class="bx-im-market-show-more-popup-content-item__title-container">
				<div class="bx-im-market-show-more-popup-content-item__title-text">
					{{ marketItem.title }}
				</div>
			</div>
		</div>
	`,
};
