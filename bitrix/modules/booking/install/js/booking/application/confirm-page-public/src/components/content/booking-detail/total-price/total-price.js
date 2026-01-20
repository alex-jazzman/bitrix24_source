import { currencyFormat } from 'booking.lib.currency-format';

import './total-price.css';

// @vue/component
export const TotalPrice = {
	name: 'BookingDetailTotalPrice',
	props: {
		skuList: {
			type: Array,
			required: true,
		},
	},
	computed: {
		totalPrice(): number
		{
			return this.skuList.reduce((total, sku) => total + sku.price, 0);
		},
		formattedTotalPrice(): string
		{
			const currencyId = this.skuList[0]?.currencyId;
			if (!currencyId)
			{
				return String(this.totalPrice);
			}

			return currencyFormat.format(currencyId, this.totalPrice);
		},
	},
	template: `
		<div class="booking-confirm-page__booking-detail_total-price-container">
			<div class="booking-confirm-page__booking-detail_total-price-title">
				{{ loc('BOOKING_CONFIRM_PAGE_TOTAL_PRICE_TITLE') }}
			</div>
			<div class="booking-confirm-page__booking-detail_total-price">
				<span v-html="formattedTotalPrice"></span>
			</div>
		</div>
	`,
};
