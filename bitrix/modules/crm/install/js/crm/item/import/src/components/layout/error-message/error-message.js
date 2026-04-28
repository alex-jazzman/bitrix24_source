import { BitrixVueComponentProps } from 'ui.vue3';

import './error-message.css';

export const ErrorMessage: BitrixVueComponentProps = {
	name: 'ErrorMessage',

	props: {
		error: {
			type: String,
			default: () => null,
		},
	},

	template: `
		<span class="crm-item-import__error-message" v-if="error">{{ error }}</span>
	`,
};
