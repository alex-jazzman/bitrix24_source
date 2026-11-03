import { BitrixVue } from 'ui.vue';
import { EventEmitter } from 'main.core.events'
import { EventType } from 'sale.checkout.const';

BitrixVue.component('sale-checkout-view-element-button-minus', {
	props: ['index', 'disabled'],
	computed:
	{
		localize() {
			return BitrixVue.getFilteredPhrases('CHECKOUT_VIEW_ELEMENT_BUTTON_MINUS_')
		},
	},
	methods:
	{
		minus()
		{
			EventEmitter.emit(EventType.basket.buttonMinusProduct, {index: this.index});
		}
	},
	// language=Vue
	template: `
		<button
			class="checkout-item-quantity-btn-minus no-select"
			type="button"
			:aria-label="localize.CHECKOUT_VIEW_ELEMENT_BUTTON_MINUS_NAME"
			:aria-disabled="disabled"
			@click="minus"
		/>
	`
});
