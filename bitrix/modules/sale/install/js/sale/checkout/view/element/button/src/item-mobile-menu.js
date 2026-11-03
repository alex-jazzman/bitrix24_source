import { BitrixVue } from 'ui.vue';
import { EventEmitter } from 'main.core.events'
import { EventType } from 'sale.checkout.const';

BitrixVue.component('sale-checkout-view-element-button-item_mobile_menu', {
	props: ['index'],
	computed:
	{
		localize() {
			return BitrixVue.getFilteredPhrases('CHECKOUT_VIEW_ELEMENT_BUTTON_ITEM_MOBILE_MENU_')
		},
	},
	methods:
	{
		backdropOpen()
		{
			EventEmitter.emit(EventType.basket.backdropOpenMobileMenu, {index: this.index})
		}
	},
	// language=Vue
	template: `
		<button
			class="checkout-basket-item-remove-dots-btn checkout-basket-mobile-only"
			type="button"
			data-testid="sale-checkout-item-menu-btn"
			:aria-label="localize.CHECKOUT_VIEW_ELEMENT_BUTTON_ITEM_MOBILE_MENU_NAME"
			@click="backdropOpen"
		/>
	`
});
