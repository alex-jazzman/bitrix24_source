// eslint-disable-next-line no-unused-vars
import type { DescriptionItem } from '../../types';

// @vue/component
export const DescriptionComponent = {
	name: 'DescriptionComponent',
	props: {
		/** @type DescriptionItem */
		item: {
			type: Object,
			required: true,
		},
	},
	template: `
		<div class="bizproc-setup-template__text --with-linebreak">
			{{ item.text }}
		</div>
	`,
};
