export const IconHoverMode = Object.freeze({
	DEFAULT: 'default',
	ALT: 'alt',
} as const);

export type IconHoverModeType = typeof IconHoverMode[keyof typeof IconHoverMode];
