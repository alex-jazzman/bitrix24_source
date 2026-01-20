import type { SkuModel } from 'booking.model.bookings';
import { currencyFormat } from 'booking.lib.currency-format';
import './profit.css';

// @vue/component
export const Profit = {
	name: 'Profit',
	props: {
		/** @type {SkuModel[]} */
		skus: {
			type: Array,
			default: Array,
		},
		className: {
			type: [Object, String, Array],
			default: '',
		},
		dataAttributes: {
			type: Object,
			default: null,
		},
	},
	computed: {
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
			class="booking--booking-base-profit"
			:class="className"
			:dataProfit="totalPrice"
			v-bind="$props.dataAttributes"
			v-html="formattedTotalPrice"
		></div>
	`,
};
