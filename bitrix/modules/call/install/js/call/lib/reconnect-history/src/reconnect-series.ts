import { type ReconnectOutcomeType, type ReconnectTargetType } from './consts';

/**
 * Addresses one series. A series of the `peer` target belongs to one interlocutor, so its
 * user id is a part of the key; a series of the media server has no user id.
 */
export type ReconnectSeriesKey = {
	target: ReconnectTargetType;
	userId?: number | null;
};

/**
 * A continuous run of attempts to restore one lost connection within one call.
 * Lives outside the ring buffer of attempts, so its counter and outcome never depend on
 * the buffer size.
 */
export type ReconnectSeries = {
	target: ReconnectTargetType;
	userId: number | null;
	startedAt: number;
	reason: string | null;
	attempts: number;
	outcome: ReconnectOutcomeType | null;
	endedAt: number | null;
};

/**
 * The user id a series is addressed by, or null when it has none: the media server target has no
 * user id, and a value that is not a number is not one either.
 */
export function normalizeSeriesUserId(userId?: number | null): number | null
{
	return Number.isFinite(userId) ? Number(userId) : null;
}

/**
 * Build the string that addresses a series: the target alone for the media server, the target and
 * the user id for a peer, so that both parts are recoverable from the key.
 */
export function buildSeriesKey({ target, userId }: ReconnectSeriesKey): string
{
	const seriesUserId: number | null = normalizeSeriesUserId(userId);

	return seriesUserId === null ? target : `${target}:${seriesUserId}`;
}
