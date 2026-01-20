import { currencyFormat } from 'booking.lib.currency-format';

import { BIcon as Icon, Outline } from 'ui.icon-set.api.vue';

// @vue/component
export const SkusInfoPopupItem = {
	name: 'SkusInfoPopupItem',
	components: {
		Icon,
	},
	props: {
		title: {
			type: String,
			required: false,
			default: '',
		},
		price: {
			type: Number,
			required: false,
			default: 0,
		},
		currencyId: {
			type: String,
			required: false,
			default: null,
		},
	},
	data(): { Outline: typeof Outline }
	{
		return {
			Outline,
		};
	},
	computed: {
		formattedPrice(): string
		{
			return currencyFormat.format(this.currencyId, this.price);
		},
	},
	template: `
		<div class="booking__actions-popup-info_element">
			<div class="booking__actions-popup-info_element-icon —ui-context-content-light">
				<Icon :name="Outline.THREE_PERSONS" :size=16 :color="'var(--ui-color-accent-main-primary)'"/>
			</div>

			<div class="booking__actions-popup-info_element-text" :title="title">
				{{ title }}
			</div>

			<div
				v-if="price"
				class="booking__actions-popup-info_element-price"
				v-html="formattedPrice"
			></div>
		</div>
	`,
};
