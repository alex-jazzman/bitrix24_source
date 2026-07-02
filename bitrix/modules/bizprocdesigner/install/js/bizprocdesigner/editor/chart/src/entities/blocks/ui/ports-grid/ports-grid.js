import { Type } from 'main.core';
import { PORT_TYPES } from '../../../../shared/constants';
import type { Port as TPort } from '../../../../shared/types';

import './ports-grid.css';

export const PortsGrid = {
	name: 'PortsGrid',
	props: {
		/** @type Block */
		block: {
			type: Object,
			required: true,
		},
		leftTypes: {
			type: [Array, String],
			default: () => ([]),
		},
		rightTypes: {
			type: [Array, String],
			default: () => ([]),
		},
	},
	computed: {
		portsMap(): Map<PORT_TYPES, TPort>
		{
			return this.block.ports
				.reduce((portsMap, port) => {
					if (portsMap.has(port.type))
					{
						portsMap.get(port.type).push(port);
					}
					else
					{
						portsMap.set(port.type, [port]);
					}

					return portsMap;
				}, new Map());
		},
		leftPorts(): TPort[]
		{
			if (Type.isArray(this.leftTypes))
			{
				return this.leftTypes.reduce((accPorts, portType) => {
					if (this.portsMap.has(portType))
					{
						accPorts.push(...this.portsMap.get(portType));
					}

					return accPorts;
				}, []);
			}

			return this.portsMap.get(this.leftTypes) ?? [];
		},
		rightPorts(): TPort[]
		{
			if (Type.isArray(this.rightTypes))
			{
				return this.rightTypes.reduce((accPorts, portType) => {
					if (this.portsMap.has(portType))
					{
						accPorts.push(...this.portsMap.get(portType));
					}

					return accPorts;
				}, []);
			}

			return this.portsMap.get(this.rightTypes) ?? [];
		},
	},
	template: `
		<div class="editor-chart-ports-grid">
			<div class="editor-chart-ports-grid__column">
				<div
					v-for="(port, index) in leftPorts"
					:key="port.id"
					class="editor-chart-ports-grid__line"
				>
					<div class="editor-chart-ports-grid__port-wrap --left">
						<slot
							:port="port"
							:index="index"
							name="portLeft"
						/>
					</div>
					<p class="editor-chart-ports-grid__port-title --left">{{ port.title }}</p>
				</div>
			</div>
			<div class="editor-chart-ports-grid__column">
				<div
					v-for="(port, index) in rightPorts"
					:key="port.id"
					class="editor-chart-ports-grid__line"
				>
					<div class="editor-chart-ports-grid__port-wrap --right">
						<slot
							:port="port"
							:index="index"
							name="portRight"
						/>
					</div>
					<p class="editor-chart-ports-grid__port-title --right">{{ port.title }}</p>
				</div>
			</div>
		</div>
	`,
};
