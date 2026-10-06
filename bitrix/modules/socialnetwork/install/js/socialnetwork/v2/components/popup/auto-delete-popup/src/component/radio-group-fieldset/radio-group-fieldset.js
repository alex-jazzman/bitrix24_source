import { defineComponent } from 'ui.vue3';
import { Vue as RadioButtonVue } from 'ui.system.radiobutton';

import './radio-group-fieldset.css';

// @vue/component
export const RadioGroupFieldset = defineComponent({
	name: 'RadioGroupFieldset',
	components:
	{
		RadioButton: RadioButtonVue.RadioButton,
	},
	props:
	{
		items: {
			type: Array,
			required: true,
		},
		ariaLabel: {
			type: String,
			default: '',
		},
	},
	emits: ['change'],
	computed:
	{
		selectedValue(): ?number
		{
			return this.items.find((option) => option.selected)?.value;
		},
	},
	methods: {
		handleOptionClick(value: number, event: MouseEvent): void
		{
			if (event.target instanceof HTMLElement && event.target.closest('label'))
			{
				return;
			}

			this.$emit('change', value);
		},
	},
	template: `
		<fieldset
			class="socialnetwork--auto-delete-popup-radio__container"
			role="radiogroup"
			:aria-label="ariaLabel || null"
			data-testid="auto-delete-popup-radio-group"
		>
			<div
				v-for="option in items"
				:key="option.value"
				class="socialnetwork--auto-delete-popup-radio__option"
				:data-testid="'auto-delete-popup-radio-option-' + option.value"
				@click="handleOptionClick(option.value, $event)"
			>
				<RadioButton
					group="socialnetwork-auto-delete-popup-radio"
					:modelValue="selectedValue === option.value"
					:aria-label="option.text"
					:data-testid="'auto-delete-popup-radio-' + option.value"
					@update:modelValue="$emit('change', option.value)"
				/>
				<span class="socialnetwork--auto-delete-popup-radio__label">{{ option.text }}</span>
			</div>
		</fieldset>
	`,
});
