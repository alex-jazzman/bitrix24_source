import { BitrixVue } from 'ui.vue';

let errorTextIdCounter = 0;

BitrixVue.component('salescenter-payment_pay-components-payment_system-error_box', {
	// the panel in the slot describes its button by the text of the plate
	provide()
	{
		return {
			paymentErrorTextId: this.errorTextId,
		};
	},
	props:
	{
		errors: Array,
	},
	data()
	{
		errorTextIdCounter++;

		return {
			errorTextId: `salescenter-payment-error-text-${errorTextIdCounter}`,
		};
	},
	computed:
	{
		localize()
		{
			return BitrixVue.getFilteredPhrases('PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_');
		},
	},
	// language=Vue
	template: `
		<div data-payment-stage="errors" data-testid="salescenter-payment-errors" tabindex="-1">
			<div class="alert alert-danger" :id="errorTextId" data-payment-error-text>
				<slot name="errors-header">
					<div>{{ localize.PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_8 }}</div>
				</slot>
				<slot name="errors-footer">
					<div>{{ localize.PAYMENT_PAY_PAYMENT_SYSTEM_COMPONENTS_9 }}</div>
				</slot>
			</div>
			<slot></slot>
		</div>
	`,
});