import { SkuItem } from './sku-item/sku-item';

import './sku-list.css';

// @vue/component
export const SkuList = {
	name: 'BookingDetailSkuList',
	components: {
		SkuItem,
	},
	props: {
		skuList: {
			type: Array,
			required: true,
		},
		withPrice: {
			type: Boolean,
			default: false,
		},
	},
	template: `
		<div
			v-for="sku in skuList"
			:key="sku.id"
			class="booking-confirm-page__booking-detail_sku-list"
		>
			<SkuItem :sku :withPrice/>
		</div>
	`,
};
