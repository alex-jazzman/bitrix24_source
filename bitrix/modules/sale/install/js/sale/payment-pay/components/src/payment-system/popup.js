import { BitrixVue } from 'ui.vue';

import { MixinPaymentDialog } from './dialog';

BitrixVue.component('sale-payment_pay-components-payment_system-popup', {
	mixins: [MixinPaymentDialog],
	computed:
	{
		getObjectClass()
		{
			let result = [
				'checkout-order-payment-popup-wrap'
			];
			if(this.isShow === true)
			{
				result.push('active-popup-open')
			}

			return result
		},
		logoStyle()
		{
			const src = this.paySystem.LOGOTIP;

			return `background-image: url("${BX.util.htmlspecialchars(src)}")`;
		}
	},
	// language=Vue
	template: `
	<div
		:class=getObjectClass
		data-testid="sale-payment-popup"
		role="dialog"
		aria-modal="true"
		:aria-label="dialogName"
		ref="dialog"
		@keydown.esc="close()"
	>
			<div class="checkout-order-payment-popup-overlay" data-testid="sale-payment-popup-overlay" @click="close()"/>
			<div class="checkout-order-payment-popup">
				<div class="checkout-order-payment-popup-head">
					<button type="button" class="checkout-order-payment-close" data-testid="sale-payment-popup-close-btn" @click="close()">{{ localize.PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_12 }}</button>
				</div>
				<div class="checkout-order-payment-popup-main">
					<div class="checkout-order-payment-title">
						<div class="checkout-basket-pay-method-item-logo-block" aria-hidden="true">
							<div
								:style=logoStyle
								class="checkout-basket-pay-method-logo"/>
						</div>
					</div>
					<div class="checkout-order-payment-content">
						<slot name="main-content"></slot>
					</div>
					<div class="checkout-order-payment-btn-container">
						<button type="button" class="btn btn-primary rounded-pill" data-testid="sale-payment-popup-accept-btn" @click="close()">{{ localize.PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_13 }}</button>
					</div>
				</div>
			</div>
	</div>`
});
