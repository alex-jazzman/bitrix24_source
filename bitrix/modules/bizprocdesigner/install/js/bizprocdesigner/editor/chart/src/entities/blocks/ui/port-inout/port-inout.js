import { Port, PORT_POSITION } from 'ui.block-diagram';

import {
	validationInputOutputRule,
	normalyzeInputOutputConnection,
} from '../../utils';

import type {
	DiagramValidationPortRuleFn,
	DiagramNormalyzeConnectionFn,
} from 'ui.block-diagram';

type PortInoutSetup = {
	validationInputOutputRule: DiagramValidationPortRuleFn;
	normalyzeInputOutputConnection: DiagramNormalyzeConnectionFn;
};

export const PortInout = {
	name: 'PortInout',
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
	},
	setup(): PortInoutSetup
	{
		return {
			validationInputOutputRule,
			normalyzeInputOutputConnection,
		};
	},
	template: `
		<Port
			:block="block"
			:port="port"
			:disabled="disabled"
			:validationRules="[validationInputOutputRule]"
			:normalyzeConnectionFn="normalyzeInputOutputConnection"
			:index="index"
			:position="position"
		/>
	`,
};
