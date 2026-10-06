import { type ReconnectHistoryEntry } from './reconnect-history-entry';
import { type ReconnectTargetType } from './consts';

const MAX_HISTORY_ENTRIES = 100;

export class ReconnectHistory
{
	#history: ReconnectHistoryEntry[] = [];
	#hasActiveInitialEntry: boolean = false;

	/**
	 * Close the last open entry for this target (if any), then add a new one.
	 * @param reason textual reason (null is allowed)
	 * @param target the target of the reconnect entry
	 * @param userId optional user ID to append to the reason string
	 */
	startEntry(reason: string | null, target: ReconnectTargetType, userId?: number): void
	{
		if (!target)
		{
			return;
		}

		this.updateLastEntry(target);

		let finalReason: string | null;
		if (userId !== undefined)
		{
			finalReason = reason
				? `${reason} on user ${userId}`
				: `Reconnection without a reason on user ${userId}`;
		}
		else
		{
			finalReason = reason;
		}

		let initial = false;
		if (!this.#hasActiveInitialEntry)
		{
			this.#hasActiveInitialEntry = true;
			initial = true;
		}


		this.#history.push({
			target,
			initial,
			reason: finalReason,
			started: Date.now(),
			ended: null,
			last: false,
		});

		this.#trimIfNeeded();
	}

	/**
	 * End the last reconnect entry (if it is open).
	 * @param target the target of the reconnect entry
	 * @param isSuccessful reflects the reconnection status
	 * Returns true when an entry was ended, false otherwise.
	 */
	updateLastEntry(target: ReconnectTargetType, isSuccessful: boolean = false): boolean
	{
		if (!target)
		{
			return false;
		}

		const reconnectHistoryLength: number = this.#history.length;

		if (reconnectHistoryLength === 0)
		{
			return false;
		}

		if (isSuccessful)
		{
			this.#hasActiveInitialEntry = false;
		}

		for (let i = reconnectHistoryLength - 1; i >= 0; i--)
		{
			const entry: ReconnectHistoryEntry = this.#history[i];
			if (entry.target === target && entry.ended === null)
			{
				entry.ended = Date.now();
				entry.last = isSuccessful;

				return true;
			}
			else if (entry.target === target && entry.ended !== null)
			{
				return false;
			}
		}

		return false;
	}

	/**
	 * Return a deep copy of the history so callers can't mutate internal state.
	 */
	getHistory(): ReadonlyArray<ReconnectHistoryEntry>
	{
		return this.#history.map((entry: ReconnectHistoryEntry): ReconnectHistoryEntry => ({ ...entry }));
	}

	/**
	 * Clear history.
	 */
	clear(): void
	{
		this.#history.length = 0;
		this.#hasActiveInitialEntry = false;
	}

	/**
	 * Trim history to MAX_HISTORY_ENTRIES if needed.
	 */
	#trimIfNeeded(): void
	{
		const hadActiveInitialEntry = this.#hasActiveInitialEntry;
		while (this.#history.length > MAX_HISTORY_ENTRIES)
		{
			this.#history.shift();
		}

		const hasActiveInitialEntry = this.#history.some((entry: ReconnectHistoryEntry): boolean => entry.initial);
		if (this.#history.length > 0 && hadActiveInitialEntry && !hasActiveInitialEntry)
		{
			this.#history[0].initial = true;
		}
	}
}
