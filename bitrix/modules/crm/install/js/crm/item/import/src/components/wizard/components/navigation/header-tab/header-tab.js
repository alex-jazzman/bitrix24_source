import { BitrixVueComponentProps } from 'ui.vue3';

import './header-tab.css';

export const HeaderTab: BitrixVueComponentProps = {
	name: 'HeaderTab',

	props: {
		isActive: {
			type: Boolean,
			default: () => false,
		},
	},

	computed: {
		tabClass(): string
		{
			return {
				'crm-item-import__wizard-header-tab': true,
				'--active': this.isActive,
			};
		},
	},

	template: `
		<div :class="tabClass">
			<slot />
		</div>
	`,
};
