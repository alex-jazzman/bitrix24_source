import { formatPrice } from '../../lib/price-formatter';
import type { Sku } from '../../types';
import './sku-selector.css';

// @vue/component
export const SkuSelector = {
	name: 'SkuSelector',
	props: {
		skus: {
			type: Array,
			required: true,
		},
	},
	emits: ['select'],
	methods: {
		formatPrice(sku: Sku): string
		{
			return formatPrice(sku);
		},
	},
	template: `
		<div class="booking--crm-forms--resource-selector">
			<div
				v-for="(sku) in skus"
				:key="sku.id"
				class="b24-form-control-list-selector-item booking--crm-forms--resource-selector-resource"
				@click="$emit('select', sku)"
			>
				<div class="booking--crm-forms--skus-selector-sku">
					<div class="booking--crm-forms--skus-selector-sku-name">
						{{ sku.name }}
					</div>
					<div class="booking--crm-forms--skus-selector-sku-price" v-html="formatPrice(sku)"></div>
				</div>
			</div>
		</div>
	`,
};
