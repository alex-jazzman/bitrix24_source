import { Checkbox as UiCheckbox } from 'tasks.v2.component.elements.checkbox';

import './check-list-checkbox.css';

// @vue/component
export const CheckListCheckbox = {
	name: 'CheckListCheckbox',
	components: {
		UiCheckbox,
	},
	props: {
		important: {
			type: Boolean,
			default: false,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		checked: {
			type: Boolean,
			default: false,
		},
		highlight: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['click'],
	template: `
		<UiCheckbox
			:checked
			:important
			:disabled
			:highlight
			class="check-list-widget-checkbox"
			@click="$emit('click', $event)"
		/>
	`,
};
