import './style.css';

import { useBlockDiagram } from 'ui.block-diagram';

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
	emits: ['addPort'],
	setup(): { newConnection: Function }
	{
		const { newConnection } = useBlockDiagram();

		return {
			newConnection,
		};
	},
	methods:
	{
		onMouseUp(): void
		{
			if (!this.newConnection || this.isOutput)
			{
				return;
			}

			this.$emit('addPort', this.title);
		},
	},
	template: `
		<div
			class="ui-block-diagram-port"
			@mouseup="onMouseUp"
		></div>
		<span
			class="complex-block-port-placeholder-title"
			:class="{ '--output': isOutput }"
		>
			{{ title }}
		</span>
	`,
};
