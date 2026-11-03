export const MAX_HISTORY_ENTRIES = 100;

export const ReconnectTarget = {
	MediaServer: 'mediaserver',
	Peer: 'peer',
} as const;

export type ReconnectTargetType = typeof ReconnectTarget[keyof typeof ReconnectTarget];

export const ReconnectOutcome = {
	Success: 'success',
	NotConnected: 'not_connected',
	NotRecovered: 'not_recovered',
	Escalated: 'escalated',
} as const;

/**
 * An outcome is either one of the named values or `error_<CODE>` built by the caller
 * from a media server failure code.
 */
export type ReconnectOutcomeType = typeof ReconnectOutcome[keyof typeof ReconnectOutcome] | `error_${string}`;
