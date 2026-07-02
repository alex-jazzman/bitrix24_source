import {
	Port,
	PORT_POSITION,
	SOURCE_PORT_STUB_SLOT_NAME,
	TARGET_PORT_STUB_SLOT_NAME,
} from 'ui.block-diagram';
import type {
	DiagramValidationPortRuleFn,
	DiagramNormalyzeConnectionFn,
} from 'ui.block-diagram';

import {
	validationAuxRule,
	normalyzeAuxConnection,
} from '../../utils';

import './port-aux.css';

const PORT_AUX_CLASS_NAMES = {
	base: 'editor-chart-port-aux',
	active: '--active',
	disabled: '--disabled',
	inactive: '--inactive',
};

type PortAuxSetup = {
	SOURCE_PORT_STUB_SLOT_NAME: string;
	TARGET_PORT_STUB_SLOT_NAME: string;
	validationAuxRule: DiagramValidationPortRuleFn;
	normalyzeAuxConnection: DiagramNormalyzeConnectionFn;
};

export const PortAux = {
	name: 'PortAux',
	components: {
		Port,
	},
	props: {
		/** @type DiagramBlock */
		block: {
			type: Object,
			required: true,
		},
		/** @type DiagramPort */
		port: {
			type: Object,
			required: true,
		},
		/** @type DiagramPortPosition */
		position: {
			type: String,
			required: true,
			validator(position): boolean
			{
				return Object.values(PORT_POSITION).includes(position);
			},
		},
		index: {
			type: Number,
			required: true,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		inactive: {
			type: Boolean,
			default: false,
		},
	},
	setup(): PortAuxSetup
	{
		return {
			SOURCE_PORT_STUB_SLOT_NAME,
			TARGET_PORT_STUB_SLOT_NAME,
			validationAuxRule,
			normalyzeAuxConnection,
		};
	},
	methods: {
		getPortAuxClassNames(isActive: boolean, isDisabled: boolean): { [string]: boolean }
		{
			return {
				[PORT_AUX_CLASS_NAMES.base]: true,
				[PORT_AUX_CLASS_NAMES.active]: isActive,
				[PORT_AUX_CLASS_NAMES.disabled]: isDisabled,
				[PORT_AUX_CLASS_NAMES.inactive]: this.inactive,
			};
		},
	},
	template: `
		<Port
			:block="block"
			:port="port"
			:disabled="disabled"
			:validationRules="[validationAuxRule]"
			:normalyzeConnectionFn="normalyzeAuxConnection"
			:index="index"
			:position="position"
		>
			<template #port="{ isActive, isDisabled }">
				<div :class="getPortAuxClassNames(isActive, isDisabled)"/>
			</template>

			<template #[SOURCE_PORT_STUB_SLOT_NAME]>
				<div class="editor-chart-port-aux__stub"/>
			</template>

			<template #[TARGET_PORT_STUB_SLOT_NAME]>
				<div class="editor-chart-port-aux__stub"/>
			</template>
		</Port>
	`,
};
