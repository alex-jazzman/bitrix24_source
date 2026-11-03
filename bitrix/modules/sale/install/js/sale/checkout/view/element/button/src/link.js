import { BitrixVue } from 'ui.vue';

BitrixVue.component('sale-checkout-view-element-button-shipping-link', {
	props: ['url'],
	// language=Vue
	template: `
		<a class="btn btn-checkout-order-status-link" :href="url" data-testid="sale-checkout-shipping-link">
			<slot name="link-title"/>
		</a>
	`
});
