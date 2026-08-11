import { type PortTypes } from '../types';

export const BLOCK_TYPES: { [string]: string } = Object.freeze({

	SIMPLE: 'simple',
	TRIGGER: 'trigger',
	COMPLEX: 'complex',
	TOOL: 'tool',
	FRAME: 'frame',
	SERVICES: 'services',
	OPERATORS: 'operators',
});

export const BLOCK_TYPES_WITHOUT_SETTINGS = [
	BLOCK_TYPES.FRAME,
];

export const PORT_TYPES: Record<string, PortTypes> = Object.freeze({
	input: 'input',
	output: 'output',
	aux: 'aux',
	topAux: 'topAux',
	inputRelation: 'inputRelation',
	outputRelation: 'outputRelation',
});

export const ACTIVATION_STATUS = Object.freeze({
	ACTIVE: 'Y',
	INACTIVE: 'N',
});

export const PROPERTY_TYPES: { [string]: string } = Object.freeze({
	DOCUMENT: 'document',
});

export const SHARED_TOAST_TYPES = Object.freeze({
	WARNING: 'warning',
});

export const COMPLEX_NODE_PORT_LABELS: { [string]: string } = Object.freeze({
	inputRule: 'G',
	outputRule: 'E',
	relation: 'NG',
	aux: 'T',
});

export const BX_FLAG_YES = 'Y';
export const BX_FLAG_NO = 'N';

export const TEMPLATE_DATA_TEMPLATE_SOURCE_TYPE = Object.freeze({
	CONSTANT: 'template_constant',
	VARIABLE: 'template_variable',
});

export const TEMPLATE_DEFAULT_DATA_TYPE = 'string';

export const COMPUTE_VALUE_PREFIXES: Record<string, string> = Object.freeze({
	CONSTANT: 'Constant',
	VARIABLE: 'Variable',
});

export const NODE_SETTINGS_TABS = Object.freeze({
	basic: 'basic',
	rules: 'rules',
});
