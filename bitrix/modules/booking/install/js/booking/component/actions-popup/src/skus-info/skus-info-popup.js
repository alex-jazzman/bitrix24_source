import { PopupOptions } from 'main.popup';

import { Popup } from 'booking.component.popup';
import { currencyFormat } from 'booking.lib.currency-format';

import { SkusInfoPopupItem } from './skus-info-popup-item';

// @vue/component
export const SkusInfoPopup = {
	name: 'SkusInfoPopup',
	components: {
		Popup,
		SkusInfoPopupItem,
	},
	props: {
		visible: {
			type: Boolean,
			default: false,
		},
		bindElement: {
			type: HTMLElement,
			required: true,
		},
		skus: {
			type: Array,
			required: true,
		},
	},
	emits: ['update:visible'],
	computed: {
		config(): PopupOptions
		{
			return {
				bindElement: this.bindElement,
				offsetTop: 10,
				offsetLeft: -65,
				padding: 14,
				contentPadding: 30,
				height: 300,
				width: 340,
				minWidth: 340,
				maxWidth: 400,
				bindOptions: {
					forceBindPosition: true,
					position: 'bottom',
				},
			};
		},
		totalSumFormatted(): string
		{
			return currencyFormat.format(this.currencyId(), this.total());
		},
	},
	methods: {
		closePopup(): void
		{
			this.$emit('update:visible', false);
		},
		total(): number
		{
			return this.skus.map((sku) => sku.price).reduce((acc, price) => acc + price, 0);
		},
		currencyId(): string
		{
			if (this.skus.length === 0)
			{
				return '';
			}

			return this.skus[0].currencyId;
		},
	},
	template: `
		<Popup
			id="booking--booking--skus-info"
			:config
			@close="closePopup"
		>
			<div class="booking__actions-popup-info_container">
				<div class="booking__actions-popup-info_content">
					<template v-for="sku in skus" :key="sku.id">
						<SkusInfoPopupItem
							:title="sku.name"
							:price="sku.price"
							:currencyId="sku.currencyId"
						/>
					</template>
				</div>
				<div class="booking__actions-popup-info_footer">
					<div class="booking__actions-popup-info_footer-label">
						{{ loc('BOOKING_ACTIONS_POPUP_SKUS_INFO_SELECTOR_TOTAL') }}
					</div>
					<div
						class="booking__actions-popup-info_footer-total"
						v-html="totalSumFormatted"
					></div>
				</div>
			</div>
		</Popup>
	`,
};
