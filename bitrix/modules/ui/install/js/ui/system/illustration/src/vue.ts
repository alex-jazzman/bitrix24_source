import { IllustrationName } from './const';

import './illustration.css';

export * from './const';
export * from './types';

// @vue/component
export const Illustration = {
	name: 'UiIllustration',
	props: {
		name: {
			type: String,
			required: true,
			validator: (value: string): boolean => (Object.values(IllustrationName) as string[]).includes(value),
		},
		size: {
			type: Number,
			default: 80,
		},
		ariaLabel: {
			type: String,
			default: '',
		},
	},
	template: `
		<div
			class="ui-illustration"
			:class="'--' + name"
			:style="{ '--ui-illustration-size': size + 'px' }"
			:role="ariaLabel === '' ? undefined : 'img'"
			:aria-label="ariaLabel === '' ? undefined : ariaLabel"
			:aria-hidden="ariaLabel === '' ? 'true' : undefined"
		></div>
	`,
};
