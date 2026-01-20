import './header.css';

// @vue/component
export const SkuResourcesEditorHeader = {
	name: 'SkuResourcesEditorHeader',
	props: {
		title: {
			type: String,
			required: true,
		},
	},
	template: `
		<div class="booking-sre-app__header">
			{{ title }}
		</div>
	`,
};
