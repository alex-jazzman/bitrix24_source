import { currencyFormat } from 'booking.lib.currency-format';

import './sku-item.css';

// @vue/component
export const SkuItem = {
	name: 'BookingDetailSkuItem',
	props: {
		sku: {
			type: Object,
			required: true,
		},
		withPrice: {
			type: Boolean,
			default: false,
		},
	},
	computed: {
		formattedPrice(): string
		{
			return currencyFormat.format(this.sku.currencyId, this.sku.price);
		},
	},
	template: `
		<div class="booking-confirm-page__booking-detail_sku-container">
			<div class="booking-confirm-page__booking-detail_sku-item">
				<div class="booking-confirm-page__booking-detail_sku-item-summary">
					<div 
						class="booking-confirm-page__booking-detail_sku-item-summary-title"
						:title="sku.name"
					>
						{{ sku.name }}
					</div>
				</div>
				<div v-if="withPrice" class="booking-confirm-page__booking-detail_sku-item-price">
					<span v-html="formattedPrice"></span>
				</div>
			</div>
		</div>
	`,
};
