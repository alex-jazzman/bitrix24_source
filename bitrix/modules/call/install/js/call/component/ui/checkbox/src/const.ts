export const CallCheckboxSizes = new Set(['sm', 'md', 'lg'] as const);

export type CallCheckboxSize = typeof CallCheckboxSizes extends Set<infer T> ? T : never;

export const CallCheckboxColors = new Set([null, 'green'] as const);

export type CallCheckboxColor = typeof CallCheckboxColors extends Set<infer T> ? T : never;