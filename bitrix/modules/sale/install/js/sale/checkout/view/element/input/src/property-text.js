import { BitrixVue } from 'ui.vue';
import { Property as Const } from 'sale.checkout.const';

import { MixinPropertyField } from './property-field';

BitrixVue.component('sale-checkout-view-element-input-property-text', {
	mixins: [MixinPropertyField],
	props: ['item', 'index', 'autocomplete'],
	data()
	{
		return {
			showAsterisk: this.showAsterisk,
		}
	},
	methods: {
		onKeyUp(e)
		{
			if (['Esc', 'Tab'].indexOf(e.key) >= 0)
			{
				return;
			}
			if (e.ctrlKey || e.metaKey)
			{
				return;
			}
			if (this.isKeyAndroidChrome(e.key))
			{
				this.hideAsteriskAndroid();
				return;
			}
			this.validate();
		},
		isKeyAndroidChrome(key)
		{
			return key === 'Unidentified';
		},
		hideAsteriskAndroid()
		{
			const asterisk = this.$el.getElementsByTagName('span')[0];
			asterisk.style.display = 'none';
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
		<div class="form-wrap form-asterisk" :class="checkedClassObject" data-testid="sale-checkout-property-text">
			<input
				class="form-control form-control-lg"
				:class="checkedClassObject"
				@blur="validate"
				type="text"
				:aria-label="item.name"
				:aria-required="ariaRequired"
				:aria-invalid="ariaInvalid"
				:aria-describedby="errorDescribedBy"
				:placeholder="item.name"
				:autocomplete="autocomplete"
				v-model="item.value"
				@keyup="onKeyUp"
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
