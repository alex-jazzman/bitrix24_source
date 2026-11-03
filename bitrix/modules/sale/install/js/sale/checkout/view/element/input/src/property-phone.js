import { BitrixVue } from 'ui.vue';
import { PhoneFilter as Filter, PhoneFormatter as Formatter } from 'ui.type';
import { Property as Const } from 'sale.checkout.const';

import { isCaretKey, MixinPropertyField } from './property-field';

BitrixVue.component('sale-checkout-view-element-input-property-phone', {
	mixins: [MixinPropertyField],
	props: ['item', 'index'],
	methods: {
		onKeyDown(e)
		{
			let value = e.key;

			if (Filter.replace(value) !== '')
			{
				return;
			}

			if (isCaretKey(e.key) || ['Esc', 'Delete', 'Backspace', 'Tab'].indexOf(e.key) >= 0)
			{
				return;
			}
			if (e.ctrlKey || e.metaKey)
			{
				return;
			}

			e.preventDefault();
		},
		onInput()
		{
			let value = Formatter.formatValue(this.value);
			if (this.value !== value)
			{
				this.validate();
				this.value = value;
			}
		},
	},
	computed: {
		checkedClassObject()
		{
			return {
				'is-invalid': this.item.validated === Const.validate.failure,
				'is-valid': this.item.validated === Const.validate.successful,
			};
		},
		value: {
			get()
			{
				return this.item.value;
			},
			set(newValue)
			{
				this.item.value = newValue;
			},
		},
		isEmpty()
		{
			return this.item.value === '';
		},
		isAsteriskShown()
		{
			return this.isEmpty && this.isRequired;
		},
	},
	// language=Vue
	template: `
		<div class="form-wrap form-asterisk" :class="checkedClassObject" data-testid="sale-checkout-property-phone">
			<input
				class="form-control form-control-lg"
				:class="checkedClassObject"
				@blur="validate"
				@input="onInput"
				@keydown="onKeyDown"
				v-model="value"
				autocomplete="tel"
				inputmode="tel"
				:aria-label="item.name"
				:aria-required="ariaRequired"
				:aria-invalid="ariaInvalid"
				:aria-describedby="errorDescribedBy"
				:placeholder="item.name"
			/>
			<span
				class="asterisk-item"
				aria-hidden="true"
				v-if="isAsteriskShown"
			>
				{{item.name}}
			</span>
		</div>
	`,
});
