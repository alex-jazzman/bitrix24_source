import './preview-block.css';

// @vue/component
export const PreviewBlock = {
	name: 'PreviewBlock',
	props: {
		isEmpty: {
			type: Boolean,
			default: false,
		},
	},
	template: `
		<div
			class="bizproc-setuptemplateactivity-preview-block"
			:class="{ '--empty': isEmpty }"
		>
			<slot/>
		</div>
	`,
};
