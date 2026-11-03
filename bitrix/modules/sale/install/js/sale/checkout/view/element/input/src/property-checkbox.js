import { BitrixVue } from 'ui.vue';
import { Property as Const } from 'sale.checkout.const';

import { MixinPropertyField } from './property-field';

BitrixVue.component('sale-checkout-view-element-input-property-checkbox', {
	mixins: [MixinPropertyField],
	props: ['item', 'index'],
	data()
	{
		return {'showValue': this.item.value === 'Y'}
	},
	computed: {
		checkedClassObject()
		{
			return {
				'is-invalid': this.item.validated === Const.validate.failure,
				'is-valid': this.item.validated === Const.validate.successful,
			};
		},
		switchValue: {
			get()
			{
				this.showValue = this.item.value === 'Y';
				return this.item.value === 'Y';
			},
			set(value)
			{
				if (value)
				{
					this.item.value = 'Y';
					this.showValue = true;
				}
				else
				{
					this.item.value = 'N';
					this.showValue = false;
				}
				this.validate();
			}
		},
	},
	// language=Vue
	template: `
		<div class="form-wrap form-control form-control-lg border-0 pl-0 form-asterisk" :class="checkedClassObject" data-testid="sale-checkout-property-checkbox">
			<input
				@blur="validate"
				type="checkbox"
				:id="fieldId"
				:value="showValue"
				:aria-required="ariaRequired"
				:aria-invalid="ariaInvalid"
				:aria-describedby="errorDescribedBy"
				v-model="switchValue"
			/>
			<label :for="fieldId" class="ml-2">{{item.name}}</label>
			<div
				class="asterisk-item"
				v-if="isRequired"
			>
			</div>
		</div>
	`,
});
