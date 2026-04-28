import { BitrixVueComponentProps } from 'ui.vue3';
import { Alert } from '../alert';

export const ErrorAlert: BitrixVueComponentProps = {
	name: 'ErrorAlert',
	components: {
		Alert,
	},

	template: `
		<Alert class="--error"><slot/></Alert>
	`,
};
