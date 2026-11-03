import { BitrixVue } from 'ui.vue';
import { MixinButton } from 'sale.payment-pay.mixins.payment-system';

BitrixVue.component('sale-payment_pay-components-payment_system-button', {
	props:
	{
		loading: {
			type: Boolean,
			default: false,
			required: false,
		},
		paySystemName: {
			type: String,
			default: '',
			required: false,
		},
	},
	computed:
	{
		localize()
		{
			return BitrixVue.getFilteredPhrases('PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_');
		},
		classes()
		{
			return {
				'order-payment-method-item-button': true,
				'btn': true,
				'btn-primary': true,
				'rounded-pill': true,
				'pay-mode': true,
				'order-payment-loader': this.loading,
			};
		},
		buttonClasses()
		{
			return {
				'loading-button-text': this.loading,
			};
		},
		// the caption repeats across the list, so the method name joins it; the reset panel has no method
		accessibleName()
		{
			if (this.paySystemName === '')
			{
				return null;
			}

			return this.localize.PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_PAY_BUTTON_NAME
				.replace('#PAY_SYSTEM#', () => this.paySystemName)
			;
		},
	},
	mixins:[MixinButton],
	// language=Vue
	template: `
		<button
			type="button"
			:class="classes"
			data-testid="sale-payment-pay-btn"
			:aria-label="accessibleName"
			:aria-busy="ariaBusy"
			@click="onClick($event)"
		>
			<span :class="buttonClasses"><slot></slot></span>
		</button>
	`,
});
