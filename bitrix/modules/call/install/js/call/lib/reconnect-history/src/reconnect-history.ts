import { type ReconnectHistoryEntry } from './reconnect-history-entry';
import {
	buildSeriesKey,
	normalizeSeriesUserId,
	type ReconnectSeries,
	type ReconnectSeriesKey,
} from './reconnect-series';
import {
	MAX_HISTORY_ENTRIES,
	ReconnectOutcome,
	type ReconnectOutcomeType,
	ReconnectTarget,
} from './consts';

export type ReconnectStartEntryParams = ReconnectSeriesKey & {
	reason?: string | null;
};

export type ReconnectUpdateLastEntryParams = ReconnectSeriesKey & {
	isSuccessful?: boolean;
};

export type ReconnectCloseSeriesParams = ReconnectSeriesKey & {
	outcome: ReconnectOutcomeType;
};

export class ReconnectHistory
{
	#history: ReconnectHistoryEntry[] = [];
	#series: Map<string, ReconnectSeries> = new Map();

	/**
	 * Register a reconnect attempt: open a series for this key or add an attempt to the open
	 * one, and append the attempt to the journal.
	 * A peer attempt without a numeric user id is rejected loudly and changes nothing.
	 * @param params the key of the series (`target` and, for a peer, `userId`) and the reason
	 * of the attempt: a bare literal, kept out of any composed string
	 */
	startEntry(params: ReconnectStartEntryParams): void
	{
		const { target, userId, reason = null }: Partial<ReconnectStartEntryParams> = params ?? {};
		if (!target)
		{
			return;
		}

		if (target === ReconnectTarget.Peer && !Number.isFinite(userId))
		{
			console.error(
				'[reconnect-history] startEntry for a peer target requires a numeric userId, got '
				+ `${String(userId)}: the attempt is dropped. Without the id every interlocutor shares one series, `
				+ 'so their reconnects would be counted and closed together.',
			);

			return;
		}

		const key: ReconnectSeriesKey = { target, userId };
		this.#endOpenEntry(key, false);

		const series: ReconnectSeries = this.#startAttempt(key, reason);

		this.#history.push({
			target,
			userId: series.userId,
			initial: series.attempts === 1,
			reason,
			started: Date.now(),
			ended: null,
			last: false,
		});

		this.#trimIfNeeded();
	}

	/**
	 * End the last reconnect entry of this key (if it is open); a successful one also closes
	 * the series with the `success` outcome.
	 * @param params the key of the series and the reconnection status
	 * Returns true when an entry was ended, false otherwise.
	 */
	updateLastEntry(params: ReconnectUpdateLastEntryParams): boolean
	{
		const { target, userId, isSuccessful = false }: Partial<ReconnectUpdateLastEntryParams> = params ?? {};
		if (!target)
		{
			return false;
		}

		const key: ReconnectSeriesKey = { target, userId };
		const ended: boolean = this.#endOpenEntry(key, isSuccessful);

		if (isSuccessful)
		{
			this.#recordOutcome(key, ReconnectOutcome.Success);
		}

		return ended;
	}

	/**
	 * Close the open series of this key with an outcome. The outcome is recorded once:
	 * a series that already has one keeps it.
	 * @param params the key of the series and the outcome to record
	 * Returns true when this call recorded the outcome, false otherwise.
	 */
	closeSeries(params: ReconnectCloseSeriesParams): boolean
	{
		const { target, userId, outcome }: Partial<ReconnectCloseSeriesParams> = params ?? {};
		if (!target || !outcome)
		{
			return false;
		}

		const key: ReconnectSeriesKey = { target, userId };

		if (!this.#recordOutcome(key, outcome))
		{
			return false;
		}

		this.#endOpenEntry(key, outcome === ReconnectOutcome.Success);

		return true;
	}

	/**
	 * Tell whether the series of this key is open, i.e. exists and has no outcome yet.
	 */
	isSeriesOpen(key: ReconnectSeriesKey): boolean
	{
		const series: ReconnectSeries | null = this.#findSeries(key);

		return series !== null && series.outcome === null;
	}

	/**
	 * Return a copy of the series known for this key so callers can't mutate internal state.
	 */
	getSeries(key: ReconnectSeriesKey): ReconnectSeries | null
	{
		const series: ReconnectSeries | null = this.#findSeries(key);

		return series ? { ...series } : null;
	}

	/**
	 * Return copies of the series that have no outcome yet. Every copy carries its own key (the
	 * target and, for a peer series, the user id), so the caller can address it back.
	 */
	getOpenSeries(): ReadonlyArray<ReconnectSeries>
	{
		const openSeries: ReconnectSeries[] = [];

		this.#series.forEach((series: ReconnectSeries): void => {
			if (series.outcome === null)
			{
				openSeries.push({ ...series });
			}
		});

		return openSeries;
	}

	/**
	 * Return a deep copy of the history so callers can't mutate internal state.
	 */
	getHistory(): ReadonlyArray<ReconnectHistoryEntry>
	{
		return this.#history.map((entry: ReconnectHistoryEntry): ReconnectHistoryEntry => ({ ...entry }));
	}

	/**
	 * Clear history and series.
	 */
	clear(): void
	{
		this.#history.length = 0;
		this.#series.clear();
	}

	#findSeries(key: ReconnectSeriesKey): ReconnectSeries | null
	{
		const { target, userId }: Partial<ReconnectSeriesKey> = key ?? {};
		if (!target)
		{
			return null;
		}

		return this.#series.get(buildSeriesKey({ target, userId })) ?? null;
	}

	/**
	 * Continue the open series of this key, or open a new one when the previous is closed.
	 */
	#startAttempt(key: ReconnectSeriesKey, reason: string | null): ReconnectSeries
	{
		const openSeries: ReconnectSeries | null = this.#findSeries(key);
		if (openSeries && openSeries.outcome === null)
		{
			openSeries.attempts++;

			return openSeries;
		}

		const series: ReconnectSeries = {
			target: key.target,
			userId: normalizeSeriesUserId(key.userId),
			reason,
			startedAt: Date.now(),
			attempts: 1,
			outcome: null,
			endedAt: null,
		};
		this.#series.set(buildSeriesKey(key), series);

		return series;
	}

	#recordOutcome(key: ReconnectSeriesKey, outcome: ReconnectOutcomeType): boolean
	{
		const series: ReconnectSeries | null = this.#findSeries(key);
		if (!series || series.outcome !== null)
		{
			return false;
		}

		series.outcome = outcome;
		series.endedAt = Date.now();

		return true;
	}

	/**
	 * End the newest journal entry of this key when it is still open.
	 */
	#endOpenEntry(key: ReconnectSeriesKey, isSuccessful: boolean): boolean
	{
		const userId: number | null = normalizeSeriesUserId(key.userId);

		for (let i = this.#history.length - 1; i >= 0; i--)
		{
			const entry: ReconnectHistoryEntry = this.#history[i];
			if (entry.target !== key.target || entry.userId !== userId)
			{
				continue;
			}

			if (entry.ended !== null)
			{
				return false;
			}

			entry.ended = Date.now();
			entry.last = isSuccessful;

			return true;
		}

		return false;
	}

	/**
	 * Trim the journal to MAX_HISTORY_ENTRIES. Series state is not affected.
	 */
	#trimIfNeeded(): void
	{
		while (this.#history.length > MAX_HISTORY_ENTRIES)
		{
			this.#history.shift();
		}
	}
}
