import './style.css';

import { useBlockDiagram } from 'ui.block-diagram';

// @vue/component
export const BlockComplexPortPlaceholder = {
	name: 'block-complex-port-placeholder',
	props:
	{
		blockId:
		{
			type: String,
			required: true,
		},
		/** @type Array<Port> */
		ports:
		{
			type: Array,
			required: true,
		},
	},
	emits: ['addPort'],
	setup(): { newConnection: Function, addConnection: Function }
	{
		const { newConnection, addConnection } = useBlockDiagram();

		return {
			newConnection,
			addConnection,
		};
	},
	computed:
	{
		title(): string
		{
			if (!this.ports)
			{
				return '';
			}

			const lastPort = this.ports[this.ports.length - 1];
			const [label, num] = lastPort?.title.split(/(\d+)/) ?? ['G', 0];

			return `${label}${Number(num) + 1}`;
		},
	},
	methods:
	{
		onMouseUp(): void
		{
			if (!this.newConnection)
			{
				return;
			}

			this.$emit('addPort', this.title);
			this.$nextTick(() => {
				const addedPort = this.ports[this.ports.length - 1];
				this.addConnection({
					...this.newConnection,
					targetBlockId: this.blockId,
					targetPort: addedPort,
					targetPortId: addedPort.id,
				});
			});
		},
	},
	template: `
		<div
			class="complex-block-port-placeholder"
			@mouseup="onMouseUp"
		>
			<svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="#B1BBC7" xmlns="http://www.w3.org/2000/svg">
				<circle cx="4.5" cy="4.5" r="4" fill="white" />
				<rect x="4.25" y="2.25" width="0.5" height="4.5" rx="0.25" stroke-width="0.5"/>
				<rect x="2.25" y="4.75" width="0.5" height="4.5" rx="0.25" transform="rotate(-90 2.25 4.75)" stroke-width="0.5"/>
			</svg>
			<span class="complex-block-port-placeholder__title">
				{{ title }}
			</span>
		</div>
	`,
};
