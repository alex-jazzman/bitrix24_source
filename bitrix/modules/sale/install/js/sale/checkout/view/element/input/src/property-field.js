import { EventEmitter } from 'main.core.events';
import { EventType, Property as Const } from 'sale.checkout.const';

const caretKeys = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']);

/**
 * A field that filters what the buyer types still has to let the caret move.
 */
export function isCaretKey(key)
{
	return caretKeys.has(key);
}

/**
 * Shared by the contact form fields. The ids come from the property index, so the error block
 * the property list renders can point at the same field.
 */
export const MixinPropertyField = {
	props: ['item', 'index'],
	computed:
	{
		fieldId()
		{
			return `sale-checkout-property-field-${this.index}`;
		},
		fieldErrorId()
		{
			return `sale-checkout-property-error-${this.index}`;
		},
		isRequired()
		{
			return this.item.required === 'Y';
		},
		isInvalid()
		{
			return this.item.validated === Const.validate.failure;
		},
		// strings: Vue 2 drops an attribute bound to false
		ariaRequired()
		{
			return this.isRequired ? 'true' : 'false';
		},
		ariaInvalid()
		{
			return this.isInvalid ? 'true' : 'false';
		},
		errorDescribedBy()
		{
			return this.isInvalid ? this.fieldErrorId : null;
		},
	},
	methods:
	{
		validate()
		{
			EventEmitter.emit(EventType.property.validate, { index: this.index });
		},
	},
};
