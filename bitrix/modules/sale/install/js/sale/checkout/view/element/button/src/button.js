import { BitrixVue } from 'ui.vue';
import { MixinButtonWait } from 'sale.checkout.view.mixins';

BitrixVue.component('sale-checkout-view-element-button-shipping-button', {
	props: ['url'],
	mixins:[MixinButtonWait],
	methods:
	{
		clickAction()
		{
			this.setWait();
			document.location.href = this.url
		}
	},
	// language=Vue
	template: `
		<div class="checkout-order-status-btn-container">
			<button :class="getObjectClass" :aria-busy="ariaBusy" type="button" data-testid="sale-checkout-shipping-btn" @click="clickAction">
				<slot name="button-title"/>
			</button>
		</div>
	`
});