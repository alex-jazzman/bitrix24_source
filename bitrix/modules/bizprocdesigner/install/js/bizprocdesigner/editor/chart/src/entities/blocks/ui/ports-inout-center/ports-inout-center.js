import { Port } from 'ui.block-diagram';
import { PORT_TYPES } from '../../../../shared/constants';
import {
	validationInputOutputRule,
	normalyzeInputOutputConnection,
	validationAuxRule,
	normalyzeAuxConnection,
} from '../../utils';
import './ports-inout-center.css';
import type { Port as TPort } from '.../../../../shared/types';

// @vue/component
export const PortsInOutCenter = {
	name: 'PortsInOutCenter',
	components: {
		Port,
	},
	props: {
		/** @type Block */
		block: {
			type: Object,
			required: true,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		hideInputPorts: {
			type: Boolean,
			default: false,
		},
	},
	setup(): {...}
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
		inPort(): TPort | null
		{
			if (this.hideInputPorts)
			{
				return null;
			}

			return this.portsMap.get(PORT_TYPES.input)?.[0] ?? null;
		},
		outPort(): TPort | null
		{
			return this.portsMap.get(PORT_TYPES.output)?.[0] ?? null;
		},
		auxPort(): TPort | null
		{
			return this.portsMap.get(PORT_TYPES.aux)?.[0] ?? null;
		},
		topAuxPort(): TPort | null
		{
			return this.portsMap.get(PORT_TYPES.topAux)?.[0] ?? null;
		},
	},
	template: `
		<div class="editor-chart-ports-inout-center">
			<slot/>

			<div
				v-if="inPort"
				class="editor-chart-ports-inout-center__port --input"
			>
				<Port
					:block="block"
					:port="inPort"
					:disabled="disabled"
					:styled="false"
					:validationRules="[validationInputOutputRule]"
					:normalyzeConnectionFn="normalyzeInputOutputConnection"
					position="left"
				/>
			</div>

			<div
				v-if="outPort"
				class="editor-chart-ports-inout-center__port --output"
			>
				<Port
					:block="block"
					:port="outPort"
					:disabled="disabled"
					:styled="false"
					:validationRules="[validationInputOutputRule]"
					:normalyzeConnectionFn="normalyzeInputOutputConnection"
					position="right"
				/>
			</div>
			<div
				v-if="auxPort"
				class="editor-chart-ports-bottom-center__port --bottom"
			>
				<Port
					:block="block"
					:port="auxPort"
					:disabled="disabled"
					:styled="false"
					:validationRules="[validationAuxRule]"
					:normalyzeConnectionFn="normalyzeAuxConnection"
					position="bottom"
				/>
			</div>
			<div
				v-if="topAuxPort"
				class="editor-chart-ports-top-center__port --top"
			>
				<Port
					:block="block"
					:port="topAuxPort"
					:disabled="disabled"
					:styled="false"
					:validationRules="[validationAuxRule]"
					:normalyzeConnectionFn="normalyzeAuxConnection"
					position="top"
				/>
			</div>
		</div>
	`,
};
