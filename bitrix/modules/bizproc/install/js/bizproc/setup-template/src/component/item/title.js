// eslint-disable-next-line no-unused-vars
import type { TitleItem } from '../../types';

// @vue/component
export const TitleComponent = {
	name: 'TitleComponent',
	props: {
		/** @type TitleItem */
		item: {
			type: Object,
			required: true,
		},
	},
	template: `
		<div class="bizproc-setup-template__heading">
			{{ item.text }}
		</div>
	`,
};
