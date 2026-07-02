import { RadioButtonSize } from './const';

import './radiobutton.css';

export * from './const';
export * from './types';

// @vue/component
export const RadioButton = {
	name: 'UiRadioButton',
	inheritAttrs: false,
	props: {
		modelValue: {
			type: Boolean,
			default: false,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		group: {
			type: String,
			required: true,
		},
		size: {
			type: String,
			default: RadioButtonSize.Md,
			validator: (value: string): boolean => (Object.values(RadioButtonSize) as string[]).includes(value),
		},
	},
	emits: ['update:modelValue'],
	computed: {
		rootClasses(this: any): Array<string | { [key: string]: boolean }>
		{
			return [
				'ui-radio-button',
				`--size-${this.size}`,
				{
					'--checked': this.modelValue,
					'--disabled': this.disabled,
				},
			];
		},
	},
	methods: {
		handleChange(this: any, event: Event): void
		{
			const input = event.target as HTMLInputElement;
			this.$emit('update:modelValue', input.checked);
		},
	},
	template: `
		<label :class="rootClasses">
			<input
				v-bind="$attrs"
				type="radio"
				class="ui-radio-button__input"
				:name="group"
				:checked="modelValue"
				:disabled="disabled"
				@change="handleChange"
			/>
			<span class="ui-radio-button__box" aria-hidden="true">
				<span v-if="modelValue" class="ui-radio-button__dot"/>
			</span>
		</label>
	`,
};
