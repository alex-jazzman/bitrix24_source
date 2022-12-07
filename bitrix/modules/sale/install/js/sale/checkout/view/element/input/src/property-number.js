import { BitrixVue } from 'ui.vue';
import { EventEmitter } from 'main.core.events'
import { Property as Const, EventType} from 'sale.checkout.const';

BitrixVue.component('sale-checkout-view-element-input-property-number', {
	props: ['item', 'index'],
	methods: {
		validate()
		{
			EventEmitter.emit(EventType.property.validate, {index: this.index});
		},
		onKeyDown(e)
		{
			if (
				!isNaN(Number(e.key))
				&& e.key !== ' '
				|| ['Esc', 'Tab', 'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', '.'].indexOf(e.key) >= 0
			)
			{
				return;
			}
			if (e.ctrlKey || e.metaKey)
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
		},
	},
	computed: {
		checkedClassObject()
		{
			return {
				'is-invalid': this.item.validated === Const.validate.failure,
				'is-valid': this.item.validated === Const.validate.successful
			}
		}
	},
	// language=Vue
	template: `
		<input
			class="form-control form-control-lg"
			:class="checkedClassObject"
			@blur="validate"
			@keydown="onKeyDown"
			@paste="onPaste"
			type="text"
			inputmode="numeric"
			:placeholder="item.name"
			v-model="item.value"
		/>
	`
});