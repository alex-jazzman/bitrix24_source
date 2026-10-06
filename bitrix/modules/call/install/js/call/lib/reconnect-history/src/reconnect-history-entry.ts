import { type ReconnectTargetType } from './consts';

export type ReconnectHistoryEntry = {
	started: number;
	ended: number | null;
	initial: boolean;
	last: boolean;
	reason: string | null;
	target: ReconnectTargetType;
};
