import type { BufferContentType } from '../../../shared/types';

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

export const FRAME_COLOR_NAMES = {
	GREY: 'grey',
	ORANGE: 'orange',
	GREEN: 'green',
	BLUE: 'blue',
	PURPLE: 'purple',
	PINK: 'pink',
};

export const FRAME_BG_COLORS = {
	[FRAME_COLOR_NAMES.GREY]: 'var(--designer-bp-frame-grey-bg)',
	[FRAME_COLOR_NAMES.ORANGE]: 'var(--designer-bp-frame-orange-bg)',
	[FRAME_COLOR_NAMES.GREEN]: 'var(--designer-bp-frame-green-bg)',
	[FRAME_COLOR_NAMES.BLUE]: 'var(--designer-bp-frame-blue-bg)',
	[FRAME_COLOR_NAMES.PURPLE]: 'var(--designer-bp-frame-purple-bg)',
	[FRAME_COLOR_NAMES.PINK]: 'var(--designer-bp-frame-pink-bg)',
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
});

export const BUFFER_CONTENT_TYPES: { [string]: BufferContentType } = {
	BLOCK: 'block',
	SELECTION: 'selection',
};

export const ICON_BG_COLORS: { [number]: string } = {
	0: 'var(--designer-bp-ai-bg)',
	1: 'var(--designer-bp-entities-bg)',
	2: 'var(--designer-bp-employe-bg)',
	3: 'var(--designer-bp-technical-bg)',
	4: 'var(--designer-bp-communication-bg)',
	5: 'var(--designer-bp-storage-bg)',
	6: 'var(--designer-bp-afiliate-bg)',
	7: 'var(--designer-bp-ai-bg)',
	8: 'var(--designer-bp-ai-bg)',
};
