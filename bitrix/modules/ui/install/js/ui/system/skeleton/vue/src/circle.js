import { BLine } from './line';

// @vue/component
export const Circle = {
	components: {
		BLine,
	},
	props: {
		size: {
			type: Number,
			default: 18,
		},
	},
	template: `
		<BLine :width="size" :height="size" :radius="99"/>
	`,
};
