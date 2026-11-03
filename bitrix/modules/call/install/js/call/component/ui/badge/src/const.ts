export const CallBadgeSizes = new Set(['sm', 'md', 'lg'] as const);

export type CallBadgeSize = typeof CallBadgeSizes extends Set<infer T> ? T : never;

export const CallBadgeColors = new Set(['blue', 'red', 'yellow', 'green', 'gray'] as const);

export type CallBadgeColor = typeof CallBadgeColors extends Set<infer T> ? T : never;
