export const CallRadioSizes = new Set(['sm', 'md', 'lg'] as const);

export type CallRadioSize = typeof CallRadioSizes extends Set<infer T> ? T : never;

export const CallRadioColors = new Set([null, 'green'] as const);

export type CallRadioColor = typeof CallRadioColors extends Set<infer T> ? T : never;