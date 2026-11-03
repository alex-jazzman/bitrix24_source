export const CallToggleColors = new Set([null, 'green', 'sky'] as const);

export type CallToggleColor = typeof CallToggleColors extends Set<infer T> ? T : never;

export const CallToggleSizes = new Set(['xs', 'sm', 'md', 'lg', 'xl'] as const);

export type CallToggleSize = typeof CallToggleSizes extends Set<infer T> ? T : never;