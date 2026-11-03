import { BitrixVue } from 'ui.vue';
import { EventEmitter } from 'main.core.events'
import { EventType } from 'sale.checkout.const';

BitrixVue.component('sale-checkout-view-element-button-restore', {
	props: ['index', 'describedBy'],
	computed:
	{
		localize() {
			return Object.freeze(
				BitrixVue.getFilteredPhrases('CHECKOUT_VIEW_ELEMENT_BUTTON_RESTORE_'))
		},
	},
	methods:
	{
		restore()
		{
			EventEmitter.emit(EventType.basket.buttonRestoreProduct, {index: this.index});
		}
	},
	// language=Vue
	template: `
		<button
			class="checkout-resotre-btn btn btn-sm border rounded-pill"
			type="button"
			:aria-describedby="describedBy"
			data-testid="sale-checkout-restore-btn"
			@click="restore"
		>{{localize.CHECKOUT_VIEW_ELEMENT_BUTTON_RESTORE_NAME}}</button>
	`
});