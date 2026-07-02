import { currencyFormat } from 'booking.lib.currency-format';
import type { SkuModel } from 'booking.model.bookings';

import './profit.css';

// @vue/component
export const Profit = {
	name: 'BookingCardProfit',
	inject: {
		/** @type{ AbstractCardDataService } */
		cardDataService: {},
	},
	computed: {
		dataAttributes(): Object
		{
			return this.cardDataService.buildDataAttributes('booking-booking-card-profit');
		},
		skus(): SkuModel[]
		{
			return this.cardDataService.skus;
		},
		totalPrice(): number
		{
			return this.skus.reduce((acc: number, sku: SkuModel) => {
				const priceNum = Number(sku?.price);

				return acc + (Number.isFinite(priceNum) ? priceNum : 0);
			}, 0);
		},
		hasSkus(): boolean
		{
			return this.skus.length > 0;
		},
		currencyId(): string
		{
			return this.hasSkus ? this.skus[0]?.currencyId : '';
		},
		formattedTotalPrice(): string
		{
			return this.currencyId ? currencyFormat.format(this.currencyId, this.totalPrice) : '';
		},
	},
	template: `
		<div
			v-if="hasSkus"
			class="booking-booking-card__profit"
			:data-profit="totalPrice"
			v-bind="dataAttributes"
			v-html="formattedTotalPrice"
		></div>
	`,
};
