export const BLOCK_TYPES: { [string]: string } = {
	SIMPLE: 'simple',
	TRIGGER: 'trigger',
	COMPLEX: 'complex',
	TOOL: 'tool',
	FRAME: 'frame',
};

export const PORT_TYPES: { [string]: string } = Object.freeze({
	input: 'input',
	output: 'output',
	aux: 'aux',
	topAux: 'topAux',
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
	connection: 'NG',
});
