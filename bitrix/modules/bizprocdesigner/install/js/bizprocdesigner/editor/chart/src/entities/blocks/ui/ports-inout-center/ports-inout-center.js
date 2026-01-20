import { computed } from 'ui.vue3';
import { Port } from 'ui.block-diagram';
import {
	validationInputOutputRule,
	validationAuxRule,
	normalyzeInputOutputConnection,
	normalyzeAuxConnection,
} from '../../utils';
import './ports-inout-center.css';
import type { Port as TPort } from '../../../shared/types';

type PortsInOutCenterSetup = {
	inPort: TPort | null;
	outPort: TPort | null;
	auxPort: TPort | null;
	topAuxPort: TPort | null;
};

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
	setup(props): PortsInOutCenterSetup
	{
		const inPort = computed((): TPort | null => {
			if (props.hideInputPorts)
			{
				return null;
			}

			return props.block.ports?.input?.[0] ?? null;
		});
		const outPort = computed((): TPort | null => {
			return props.block.ports?.output?.[0] ?? null;
		});
		const auxPort = computed((): TPort | null => {
			return props.block.ports?.aux?.[0] ?? null;
		});
		const topAuxPort = computed((): TPort | null => {
			return props.block.ports?.topAux?.[0] ?? null;
		});

		return {
			inPort,
			outPort,
			auxPort,
			topAuxPort,
			validationInputOutputRule,
			validationAuxRule,
			normalyzeInputOutputConnection,
			normalyzeAuxConnection,
		};
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
