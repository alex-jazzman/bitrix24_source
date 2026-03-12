import { Outline } from 'ui.icon-set.api.core';
import { BIcon } from 'ui.icon-set.api.vue';

import './field-hover-button.css';

// @vue/component
export const FieldHoverButton = {
	components: {
		BIcon,
	},
	props: {
		icon: {
			type: String,
			required: true,
		},
		isVisible: {
			type: Boolean,
			default: true,
		},
		isLocked: {
			type: Boolean,
			default: false,
		},
	},
	setup(): Object
	{
		return {
			Outline,
		};
	},
	template: `
		<div :class="['b24-field-hover-button', { '--visible': isVisible, '--locked': isLocked }]">
			<BIcon :name="isLocked ? Outline.LOCK_L : icon" hoverable/>
		</div>
	`,
};
