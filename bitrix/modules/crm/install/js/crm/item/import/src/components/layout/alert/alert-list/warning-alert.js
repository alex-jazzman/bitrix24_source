import { BitrixVueComponentProps } from 'ui.vue3';
import { Alert } from '../alert';

export const WarningAlert: BitrixVueComponentProps = {
	name: 'WarningAlert',
	components: {
		Alert,
	},

	template: `
		<Alert class="--warning"><slot/></Alert>
	`,
};
