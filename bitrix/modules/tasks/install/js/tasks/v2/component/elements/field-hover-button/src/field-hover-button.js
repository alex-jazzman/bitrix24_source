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
		ariaLabel: {
			type: String,
			default: '',
		},
		ariaHaspopup: {
			type: String,
			default: '',
		},
		ariaExpanded: {
			type: Boolean,
			default: null,
		},
	},
	setup(): Object
	{
		return {
			Outline,
		};
	},
	template: `
		<component
			:is="ariaLabel ? 'button' : 'div'"
			:type="ariaLabel ? 'button' : null"
			:class="['b24-field-hover-button', { '--visible': isVisible, '--locked': isLocked }]"
			:aria-label="ariaLabel || null"
			:aria-haspopup="ariaLabel && ariaHaspopup ? ariaHaspopup : null"
			:aria-expanded="ariaLabel ? ariaExpanded : null"
		>
			<BIcon :name="isLocked ? Outline.LOCK_L : icon" hoverable aria-hidden="true"/>
		</component>
	`,
};
