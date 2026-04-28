import { BitrixVueComponentProps } from 'ui.vue3';

import './alert.css';

export const Alert: BitrixVueComponentProps = {
	name: 'Alert',

	template: `
		<div class="crm-item-import__alert">
			<slot />
		</div>
	`,
};
