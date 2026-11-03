export const BLOCK_TYPES: { [string]: string } = {
	SIMPLE: 'simple',
	TRIGGER: 'trigger',
	COMPLEX: 'complex',
	FRAME: 'frame',
	TOOL: 'tool',
	SERVICES: 'services',
	OPERATORS: 'operators',
};

export const BLOCK_SLOT_NAMES: { [string]: string } = {
	SIMPLE: `block:${BLOCK_TYPES.SIMPLE}`,
	TRIGGER: `block:${BLOCK_TYPES.TRIGGER}`,
	COMPLEX: `block:${BLOCK_TYPES.COMPLEX}`,
	FRAME: `block:${BLOCK_TYPES.FRAME}`,
	TOOL: `block:${BLOCK_TYPES.TOOL}`,
	SERVICES: `block:${BLOCK_TYPES.SERVICES}`,
	OPERATORS: `block:${BLOCK_TYPES.OPERATORS}`,
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

export const FRAME_TEXT_ALIGN_OPTIONS = {
	NONE: 'none',
	LEFT: 'left',
	TOP: 'top',
	BOTTOM: 'bottom',
	RIGHT: 'right',
};

export const FRAME_COLOR_NAMES = {
	GREY: 'grey',
	ORANGE: 'orange',
	GREEN: 'green',
	BLUE: 'blue',
	PURPLE: 'purple',
	PINK: 'pink',
};

// Consumed by the canvas map as the palette of its frames, the same way ICON_BG_COLORS is: the
// literal written inside var() is what a theme leaving the token undeclared falls back to, and
// without it every frame would collapse onto the neutral color of the map.
export const FRAME_BG_COLORS = {
	[FRAME_COLOR_NAMES.GREY]: 'var(--designer-bp-frame-grey-bg, #F2F6F7)',
	[FRAME_COLOR_NAMES.ORANGE]: 'var(--designer-bp-frame-orange-bg, #FCF8E8)',
	[FRAME_COLOR_NAMES.GREEN]: 'var(--designer-bp-frame-green-bg, #DDFFEF)',
	[FRAME_COLOR_NAMES.BLUE]: 'var(--designer-bp-frame-blue-bg, #E7F4FF)',
	[FRAME_COLOR_NAMES.PURPLE]: 'var(--designer-bp-frame-purple-bg, #F6ECFF)',
	[FRAME_COLOR_NAMES.PINK]: 'var(--designer-bp-frame-pink-bg, #FFE8E8)',
};

export const FRAME_BORDER_COLORS = {
	[FRAME_COLOR_NAMES.GREY]: 'var(--designer-bp-frame-grey-br)',
	[FRAME_COLOR_NAMES.ORANGE]: 'var(--designer-bp-frame-orange-br)',
	[FRAME_COLOR_NAMES.GREEN]: 'var(--designer-bp-frame-green-br)',
	[FRAME_COLOR_NAMES.BLUE]: 'var(--designer-bp-frame-blue-br)',
	[FRAME_COLOR_NAMES.PURPLE]: 'var(--designer-bp-frame-purple-br)',
	[FRAME_COLOR_NAMES.PINK]: 'var(--designer-bp-frame-pink-br)',
};

export const BLOCK_TOAST_TYPES: { [string]: string } = Object.freeze({
	ACTIVITY_PUBLIC_ERROR: 'activity-public-error',
	// The summary of one insertion from the library: what was skipped and what is left to tune.
	FRAGMENT_INSERT_OUTCOME: 'fragment-insert-outcome',
});

// Consumed by the canvas map as the palette of its blocks. The map resolves each reference
// against the cascade, so the palette follows the theme; the literal written inside var() is
// what a theme leaving the token undeclared falls back to.
export const ICON_BG_COLORS: { [number]: string } = {
	0: 'var(--designer-bp-ai-bg, #ECDFFF)',
	1: 'var(--designer-bp-entities-bg, #E5F1FF)',
	2: 'var(--designer-bp-employe-bg, #FFEECC)',
	3: 'var(--designer-bp-technical-bg, #EAEEF4)',
	4: 'var(--designer-bp-communication-bg, #D8FFCB)',
	5: 'var(--designer-bp-storage-bg, #E3F5ED)',
	6: 'var(--designer-bp-afiliate-bg, #F2F8D8)',
	7: 'var(--designer-bp-ai-bg, #ECDFFF)',
	8: 'var(--designer-bp-ai-bg, #ECDFFF)',
};

export const BLOCK_TOP_CONTEXT_MENU_PREFIX_NAME = 'block_top_menu_';

/**
 * The graph in the editor was replaced by another one — a load, a reload, a version snapshot — so
 * whatever was read from the previous graph belongs to no graph now.
 */
export const DIAGRAM_EVENTS: { [string]: string } = Object.freeze({
	GRAPH_REPLACED: 'BizprocDesigner.Diagram.GraphReplaced',
});
