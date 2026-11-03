import { BitrixVue } from 'ui.vue';
import { EventEmitter } from 'main.core.events'
import { EventType } from 'sale.checkout.const';

BitrixVue.component('sale-checkout-view-element-button-checkout', {
	props: ['title', 'wait'],
	methods:
		{
			checkout()
			{
				EventEmitter.emit(EventType.element.buttonCheckout);
			}
		},
	computed:
		{
			// a string: Vue 2 drops an attribute bound to false
			ariaBusy()
			{
				return this.wait ? 'true' : 'false';
			},
			getObjectClass()
			{
				const classes = [
					'btn',
					'btn-primary',
					'product-item-buy-button',
					'rounded-pill'
				];

				if(this.wait)
				{
					classes.push('btn-wait')
				}
				return classes;
			}
		},
	// language=Vue
	template: `
		<div class="checkout-btn-container">
			<button :class="getObjectClass" :aria-busy="ariaBusy" type="button" data-testid="sale-checkout-submit-btn" @click="checkout">{{title}}</button>
		</div>
	`
});