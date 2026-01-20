// eslint-disable-next-line no-unused-vars
import type { DelimiterItem } from '../../types';

// @vue/component
export const DelimiterComponent = {
	name: 'DelimiterComponent',
	props: {
		/** @type DelimiterItem */
		item: {
			type: Object,
			required: true,
		},
	},
	template: `
		<div class="bizproc-setup-template__delimiter"></div>
	`,
};
