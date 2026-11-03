export const CallTooltipPositions = new Set(['top', 'right', 'bottom', 'left'] as const);

export type CallTooltipPosition = typeof CallTooltipPositions extends Set<infer T> ? T : never;

export const CALL_TOOLTIP_DEFAULT_POSITION: CallTooltipPosition = 'top';
