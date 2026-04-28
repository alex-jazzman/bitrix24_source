import { BitrixVueComponentProps } from 'ui.vue3';

import './page.css';

export const Page: BitrixVueComponentProps = {
	name: 'Page',

	template: `
		<div class="crm-item-import__page">
			<slot />
		</div>
	`,
};
