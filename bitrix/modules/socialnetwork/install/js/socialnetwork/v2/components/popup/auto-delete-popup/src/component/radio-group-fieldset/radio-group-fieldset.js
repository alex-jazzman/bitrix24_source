import { UiRadio } from 'socialnetwork.v2.components.elements.ui-radio';

import './radio-group-fieldset.css';

// @vue/component
export const RadioGroupFieldset = {
	name: 'RadioGroupFieldset',
	components:
	{
		UiRadio,
	},
	props:
	{
		items: {
			type: Array,
			required: true,
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
	template: `
		<div class="socialnetwork--auto-delete-popup-radio__container">
			<label v-for="option in items" :key="option.value" class="socialnetwork--auto-delete-popup-radio__option">
				<UiRadio
					:modelValue="selectedValue"
					:value="option.value"
					inputClassName="socialnetwork--auto-delete-popup-radio__input"
					@update:modelValue="this.$emit('change', option.value)"
				/>
				<span class="socialnetwork--auto-delete-popup-radio__label">{{ option.text }}</span>
			</label>
		</div>
	`,
};
