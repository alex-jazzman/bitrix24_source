import './style.css';

// @vue/component
export const BlockComplexPortPlaceholder = {
	name: 'block-complex-port-placeholder',
	props:
	{
		title:
		{
			type: String,
			required: true,
		},
		isOutput:
		{
			type: Boolean,
			default: false,
		},
	},
	template: `
		<div
			class="ui-block-diagram-port"
			:data-test-id="$testId('complexNodePortPlaceholder', title)"
		></div>
		<span
			class="complex-block-port-placeholder-title"
			:class="{ '--output': isOutput }"
		>
			{{ title }}
		</span>
	`,
};
