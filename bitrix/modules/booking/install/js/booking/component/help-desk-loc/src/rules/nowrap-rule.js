import './nowrap-rule.css';

// @vue/component
export const NoWrapRule = {
	name: 'NoWrapRule',
	props: {
		// default property for every rule
		text: String,
	},
	template: `
		<span class="booking--help-desk-nowrap">{{ text }}</span>
	`,
};
