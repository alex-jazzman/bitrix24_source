import { BitrixVue } from 'ui.vue';
import { EventEmitter } from 'main.core.events'
import { EventType } from 'sale.checkout.const';

BitrixVue.component('sale-checkout-view-element-button-plus', {
	props: ['index', 'disabled'],
	computed:
	{
		localize() {
			return BitrixVue.getFilteredPhrases('CHECKOUT_VIEW_ELEMENT_BUTTON_PLUS_')
		},
	},
	methods:
	{
		plus()
		{
			EventEmitter.emit(EventType.basket.buttonPlusProduct, {index: this.index});
		}
	},
	// language=Vue
	template: `
		<button
			class="checkout-item-quantity-btn-plus no-select"
			type="button"
			:aria-label="localize.CHECKOUT_VIEW_ELEMENT_BUTTON_PLUS_NAME"
			:aria-disabled="disabled"
			@click="plus"
		/>
	`
});
