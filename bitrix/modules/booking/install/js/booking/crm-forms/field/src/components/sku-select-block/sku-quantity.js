import { formatPrice } from '../../lib/price-formatter';
import './sku-quantity.css';

// @vue/component
export const SkuQuantity = {
	name: 'SkuQuantity',
	props: {
		sku: {
			type: Object,
			required: true,
		},
	},
	methods: {
		formatPrice(): string
		{
			return formatPrice(this.sku);
		},
	},
	template: `
		<div class="booking-crm-forms-field-sku-selector-quantity">
			<div class="b24-form-control-product-price booking-crm-forms-field-sku-selector-quantity-price">
				<div class="b24-form-control-product-price-current" v-html="formatPrice()"></div>
			</div>
		</div>
	`,
};
