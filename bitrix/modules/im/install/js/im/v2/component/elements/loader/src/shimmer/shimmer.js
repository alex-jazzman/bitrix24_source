import './shimmer.css';

// @vue/component
export const Shimmer = {
	name: 'ShimmerLoader',
	props: {
		width: {
			type: Number,
			required: true,
		},
		height: {
			type: Number,
			required: true,
		},
	},
	computed: {
		containerStyles(): { width: string, height: string }
		{
			return {
				width: `${this.width}px`,
				height: `${this.height}px`,
			};
		},
	},
	template: `
		<div class="bx-im-elements-loader-shimmer__container" :style="containerStyles"></div>
	`,
};
