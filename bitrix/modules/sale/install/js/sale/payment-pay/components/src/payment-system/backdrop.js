import { BitrixVue } from 'ui.vue';

import { MixinPaymentDialog } from './dialog';

BitrixVue.component('sale-payment_pay-components-payment_system-backdrop', {
	mixins: [MixinPaymentDialog],
	computed:
		{
			getObjectClass()
			{
				let result = [
					'checkout-basket-item'
				];
				if(this.isShow === true)
				{
					result.push('active-backdrop-open-change-sku active-popup-open')
				}

				return result
			},
			title()
			{
				return BX.util.htmlspecialchars(this.paySystem.NAME)
			},
			logoStyle()
			{
				const defaultLogo = '/bitrix/js/sale/payment-pay/images/default_logo.png';
				const src = this.paySystem.LOGOTIP || defaultLogo;

				return `background-image: url("${BX.util.htmlspecialchars(src)}")`;
			}
		},
	// language=Vue
	template: `
		<div :class=getObjectClass>
			<div
				class="checkout-basket-item-backdrop-wrapper js-backdrop-open-change-sku"
				data-testid="sale-payment-backdrop"
				role="dialog"
				aria-modal="true"
				:aria-label="dialogName"
				ref="dialog"
				@keydown.esc="close()"
			>
				<div class="checkout-basket-item-backdrop-overlay js-backdrop-open-change-sku"></div>
				<div class="checkout-basket-item-backdrop-container js-backdrop-open-change-sku">
					<div class="checkout-basket-item-detail-header justify-content-between align-items-center">
						<div id="bx_3966226736_424_7e1b8e3524755c391129a9d7e6f2d206_prebuy_swipe_btn"
							 class="checkout-basket-item-detail-swipe-btn-container">
							<div class="checkout-basket-item-detail-swipe-btn"></div>
						</div>
						<button type="button" class="checkout-order-payment-close" data-testid="sale-payment-backdrop-close-btn" @click="close()">{{ localize.PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_12 }}</button>
					</div>
					<div class="checkout-basket-item-backdrop-inner">
						<div class="checkout-basket-item-backdrop-main">
							<div class="checkout-order-payment-title">
								<div class="checkout-basket-pay-method-item-logo-block" aria-hidden="true">
									<div
										:style=logoStyle
										class="checkout-basket-pay-method-logo"/>
								</div>
								<div class="checkout-order-payment-title-text">{{title}}</div>
							</div>
							<slot name="main-content"></slot>
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
});
