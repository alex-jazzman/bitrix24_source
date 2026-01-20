import './block-top-title.css';

// @vue/component
export const BlockTopTitle = {
	name: 'block-top-title',
	props:
	{
		title:
		{
			type: String,
			required: true,
		},
	},
	template: `
		<h3 class="editor-chart-block-top-title">{{ title }}</h3>
	`,
};
