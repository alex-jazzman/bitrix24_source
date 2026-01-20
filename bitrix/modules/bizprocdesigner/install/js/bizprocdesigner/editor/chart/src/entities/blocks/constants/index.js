export const BLOCK_TYPES: { [string]: string } = {
	SIMPLE: 'simple',
	TRIGGER: 'trigger',
	COMPLEX: 'complex',
	FRAME: 'frame',
	TOOL: 'tool',
};

export const BLOCK_SLOT_NAMES: { [string]: string } = {
	SIMPLE: `block:${BLOCK_TYPES.SIMPLE}`,
	TRIGGER: `block:${BLOCK_TYPES.TRIGGER}`,
	COMPLEX: `block:${BLOCK_TYPES.COMPLEX}`,
	FRAME: `block:${BLOCK_TYPES.FRAME}`,
	TOOL: `block:${BLOCK_TYPES.TOOL}`,
};

export const CONNECTION_SLOT_NAMES: { [string]: string } = {
	AUX: 'connection:aux',
};

export const TEMPLATE_PUBLISH_STATUSES = {
	MAIN: 'main',
	USER: 'user',
	FULL: 'full',
};

export const BLOCK_COLOR_NAMES = {
	WHITE: 'white',
	ORANGE: 'orange',
	BLUE: 'blue',
};
