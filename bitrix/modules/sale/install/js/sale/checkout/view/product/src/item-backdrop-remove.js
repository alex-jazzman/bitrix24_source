import { BitrixVue } from 'ui.vue';

import 'sale.checkout.view.element.button'

import { MixinItemDialog } from './dialog';
import { removeButtons } from './focus';

BitrixVue.component('sale-checkout-view-product-item_backdrop_remove', {
	mixins:[MixinItemDialog],
	computed:
	{
		localize()
		{
			return BitrixVue.getFilteredPhrases('CHECKOUT_VIEW_PRODUCT_ITEM_MENU_')
		},
		dialogInitiator()
		{
			return removeButtons;
		},
	},
	// language=Vue
	template: `
		<div
			class="checkout-basket-item-backdrop-wrapper js-backdrop-open-mobile-menu"
			data-testid="sale-checkout-item-menu-dialog"
			role="dialog"
			aria-modal="true"
			:aria-label="localize.CHECKOUT_VIEW_PRODUCT_ITEM_MENU_NAME"
			:inert="!opened"
			ref="dialog"
			@keydown.esc="requestDialogClose"
		>
			<sale-checkout-view-element-button-backdrop_overlay_close class="js-backdrop-open-mobile-menu" :index="index"/>
			<div class="checkout-basket-item-backdrop-container js-backdrop-open-mobile-menu">
				<div class="checkout-basket-item-detail-header justify-content-between align-items-center">
					<div class="checkout-basket-item-detail-header-separate"/>
					<div class="checkout-basket-item-detail-swipe-btn-container" id="bx_3966226736_424_7e1b8e3524755c391129a9d7e6f2d206_prebuy_swipe_btn">
						<div class="checkout-basket-item-detail-swipe-btn"/>
					</div>
					<sale-checkout-view-element-button-backdrop_close :index="index"/>
				</div>
				<div class="checkout-basket-item-backdrop-inner">
					<sale-checkout-view-element-button-backdrop_remove_remove :index="index"/>
					<sale-checkout-view-element-button-backdrop_remove_cancel :index="index"/>
				</div>
			</div>
		</div>
	`
});
