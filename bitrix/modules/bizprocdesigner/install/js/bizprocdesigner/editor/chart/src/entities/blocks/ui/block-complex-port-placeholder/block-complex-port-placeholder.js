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
		isNextDroppable:
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
			if (!this.isNextDroppable || !this.newConnection || this.isOutput)
			{
				return;
			}

			// Snapshot the connection synchronously: the document-level mouseup
			// handler nullifies newConnection before the input-ports watcher runs.
			const connection = { ...this.newConnection };
			this.$emit('addPort', { title: this.title, connection });
		},
	},
	template: `
		<div
			class="ui-block-diagram-port"
			:data-test-id="$testId('complexNodePortPlaceholder', title)"
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
