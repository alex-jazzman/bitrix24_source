import { BitrixVue } from 'ui.vue';
import { Property as Const } from 'sale.checkout.const';

import { isCaretKey, MixinPropertyField } from './property-field';

BitrixVue.component('sale-checkout-view-element-input-property-number', {
	mixins: [MixinPropertyField],
	props: ['item', 'index'],
	methods: {
		onKeyDown(e)
		{
			if (
				!isNaN(Number(e.key))
				&& e.key !== ' '
			)
			{
				return;
			}
			if (e.ctrlKey
				|| e.metaKey
				|| isCaretKey(e.key)
				|| ['Esc', 'Tab', 'Backspace', 'Delete', '.'].indexOf(e.key) >= 0
			)
			{
				return;
			}
			e.preventDefault();
		},
		onPaste(e)
		{
			e.preventDefault();
			const pastedText = e.clipboardData.getData('Text');
			if (!isNaN(Number(pastedText)))
			{
				this.item.value = pastedText.trim();
			}
			this.validate();
		},
	},
	computed: {
		checkedClassObject()
		{
			return {
				'is-invalid': this.item.validated === Const.validate.failure,
				'is-valid': this.item.validated === Const.validate.successful
			}
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
		<div class="form-wrap form-asterisk" :class="checkedClassObject" data-testid="sale-checkout-property-number">
			<input
				class="form-control form-control-lg"
				:class="checkedClassObject"
				@blur="validate"
				@keydown="onKeyDown"
				@keyup="validate"
				@paste="onPaste"
				type="text"
				inputmode="numeric"
				:aria-label="item.name"
				:aria-required="ariaRequired"
				:aria-invalid="ariaInvalid"
				:aria-describedby="errorDescribedBy"
				:placeholder="item.name"
				v-model="item.value"
			/>
			<span
				class="asterisk-item"
				aria-hidden="true"
				v-if="isAsteriskShown"
			>
				{{item.name}}
			</span>
		</div>
	`
});
