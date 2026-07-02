import { Type } from 'main.core';
import { Port } from 'ui.block-diagram';
import { PORT_TYPES } from '../../../../shared/constants';
import {
	validationInputOutputRule,
	normalyzeInputOutputConnection,
	validationAuxRule,
	normalyzeAuxConnection,
} from '../../utils';
import type { Port as TPort } from '.../../../../shared/types';
import type {
	DiagramValidationPortRuleFn,
	DiagramNormalyzeNewConnectionFn,
} from 'ui.block-diagram';

import './ports-layout.css';

export type PortsLayoutSetup = {
	validationInputOutputRule: DiagramValidationPortRuleFn,
	normalyzeInputOutputConnection: DiagramNormalyzeNewConnectionFn,
	validationAuxRule: DiagramValidationPortRuleFn,
	normalyzeAuxConnection: DiagramNormalyzeNewConnectionFn,
};

// @vue/component
export const PortsLayout = {
	name: 'PortsLayout',
	components: {
		Port,
	},
	props: {
		/** @type Block */
		block: {
			type: Object,
			required: true,
		},
		topPortTypes: {
			type: [Array, String],
			default: () => ([]),
		},
		bottomPortTypes: {
			type: [Array, String],
			default: () => ([]),
		},
		leftPortTypes: {
			type: [Array, String],
			default: () => ([]),
		},
		rightPortTypes: {
			type: [Array, String],
			default: () => ([]),
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	setup(): PortsLayoutSetup
	{
		return {
			validationInputOutputRule,
			normalyzeInputOutputConnection,
			validationAuxRule,
			normalyzeAuxConnection,
		};
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
		topPorts(): TPort[]
		{
			if (Type.isArray(this.topPortTypes))
			{
				return this.topPortTypes.reduce((accPorts, portType) => {
					if (this.portsMap.has(portType))
					{
						accPorts.push(...this.portsMap.get(portType));
					}

					return accPorts;
				}, []);
			}

			return this.portsMap.get(this.topPortTypes) ?? [];
		},
		hasTopPorts(): boolean
		{
			return this.topPorts.length > 0;
		},
		bottomPorts(): TPort[]
		{
			if (Type.isArray(this.bottomPortTypes))
			{
				return this.bottomPortTypes.reduce((accPorts, portType) => {
					if (this.portsMap.has(portType))
					{
						accPorts.push(...this.portsMap.get(portType));
					}

					return accPorts;
				}, []);
			}

			return this.portsMap.get(this.bottomPortTypes) ?? [];
		},
		hasBottomPorts(): boolean
		{
			return this.bottomPorts.length > 0;
		},
		leftPorts(): TPort[]
		{
			if (Type.isArray(this.leftPortTypes))
			{
				return this.leftPortTypes.reduce((accPorts, portType) => {
					if (this.portsMap.has(portType))
					{
						accPorts.push(...this.portsMap.get(portType));
					}

					return accPorts;
				}, []);
			}

			return this.portsMap.get(this.leftPortTypes) ?? [];
		},
		hasLeftPorts(): boolean
		{
			return this.leftPorts.length > 0;
		},
		rightPorts(): TPort[]
		{
			if (Type.isArray(this.rightPortTypes))
			{
				return this.rightPortTypes.reduce((accPorts, portType) => {
					if (this.portsMap.has(portType))
					{
						accPorts.push(...this.portsMap.get(portType));
					}

					return accPorts;
				}, []);
			}

			return this.portsMap.get(this.rightPortTypes) ?? [];
		},
		hasRightPorts(): boolean
		{
			return this.rightPorts.length > 0;
		},
	},
	template: `
		<div class="editor-chart-ports-inout-center">
			<slot/>

			<div
				v-if="hasTopPorts"
				class="editor-chart-ports-inout-center__ports-container --top"
			>
				<div
					v-for="(topPort, index) in topPorts"
					:key="topPort.id"
					class="editor-chart-ports-inout-center__port-wrap"
				>
					<slot
						:port="topPort"
						:index="index"
						name="top"
					>
						<Port
							:block="block"
							:port="topPort"
							:disabled="disabled"
							:styled="false"
							:validationRules="[validationInputOutputRule]"
							:normalyzeConnectionFn="normalyzeInputOutputConnection"
							:index="index"
							position="top"
						/>
					</slot>
				</div>
			</div>

			<div
				v-if="hasBottomPorts"
				class="editor-chart-ports-inout-center__ports-container --bottom"
			>
				<div
					v-for="(bottomPort, index) in bottomPorts"
					:key="bottomPort.id"
					class="editor-chart-ports-inout-center__port-wrap"
				>
					<slot
						:port="bottomPort"
						:index="index"
						name="bottom"
					>
						<Port
							:block="block"
							:port="bottomPort"
							:disabled="disabled"
							:styled="false"
							:validationRules="[validationInputOutputRule]"
							:normalyzeConnectionFn="normalyzeInputOutputConnection"
							:index="index"
							position="bottom"
						/>
					</slot>
				</div>
			</div>

			<div
				v-if="hasLeftPorts"
				class="editor-chart-ports-inout-center__ports-container --left"
			>
				<div
					v-for="(leftPort, index) in leftPorts"
					:key="leftPort.id"
					class="editor-chart-ports-inout-center__port-wrap"
				>
					<slot
						:port="leftPort"
						:index="index"
						name="left"
					>
						<Port
							:block="block"
							:port="leftPort"
							:disabled="disabled"
							:styled="false"
							:validationRules="[validationInputOutputRule]"
							:normalyzeConnectionFn="normalyzeInputOutputConnection"
							:index="index"
							position="left"
						/>
					</slot>
				</div>
			</div>


			<div
				v-if="hasRightPorts"
				class="editor-chart-ports-inout-center__ports-container --right"
			>
				<div
					v-for="(rightPort, index) in rightPorts"
					:key="rightPort.id"
					class="editor-chart-ports-inout-center__port-wrap"
				>
					<slot
						:port="rightPort"
						:index="index"
						name="right"
					>
						<Port
							:block="block"
							:port="rightPort"
							:disabled="disabled"
							:styled="false"
							:validationRules="[validationInputOutputRule]"
							:normalyzeConnectionFn="normalyzeInputOutputConnection"
							:index="index"
							position="right"
						/>
					</slot>
				</div>
			</div>
		</div>
	`,
};
