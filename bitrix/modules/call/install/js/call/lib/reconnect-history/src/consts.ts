export const ReconnectTarget = {
	Sdk: 'sdk',
	Provider: 'provider',
} as const;

export type ReconnectTargetType = typeof ReconnectTarget[keyof typeof ReconnectTarget];
