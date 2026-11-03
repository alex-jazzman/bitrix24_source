export const CallButtonSizes = new Set([20, 24, 28, 34, 38, 46, 54] as const);

export type CallButtonSize = typeof CallButtonSizes extends Set<infer T> ? T : never;

export const CallButtonColors = new Set([
	'blue',
	'red',
	'green',
	'purple',
	'transparent',
	'transparent-blue',
	'transparent-yellow',
	'transparent-red',
	'transparent-black',
	'gradient',
	'copilot',
	'hangup',
	'none',
] as const);

export type CallButtonColor = typeof CallButtonColors extends Set<infer T> ? T : never;

export const CallButtonVariants = new Set(['primary', 'tine', 'outline'] as const);

export type CallButtonVariant = typeof CallButtonVariants extends Set<infer T> ? T : never;

export const CallButtonLabelPositions = new Set(['inline', 'bottom', 'bottom-block'] as const);

export type CallButtonLabelPosition = typeof CallButtonLabelPositions extends Set<infer T> ? T : never;
