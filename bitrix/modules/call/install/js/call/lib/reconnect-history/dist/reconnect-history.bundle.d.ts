/* eslint-disable */
type ReconnectHistoryEntry = {
	started: number;
	ended: number | null;
	initial: boolean;
	last: boolean;
	reason: string | null;
	target: ReconnectTargetType;
	userId: number | null;
};

type ReconnectTargetType = typeof BX.Call.Lib.ReconnectTarget[keyof typeof BX.Call.Lib.ReconnectTarget];

/**
 * A continuous run of attempts to restore one lost connection within one call.
 * Lives outside the ring buffer of attempts, so its counter and outcome never depend on
 * the buffer size.
 */
type ReconnectSeries = {
	target: ReconnectTargetType;
	userId: number | null;
	startedAt: number;
	reason: string | null;
	attempts: number;
	outcome: ReconnectOutcomeType | null;
	endedAt: number | null;
};

/**
 * An outcome is either one of the named values or `error_<CODE>` built by the caller
 * from a media server failure code.
 */
type ReconnectOutcomeType = typeof BX.Call.Lib.ReconnectOutcome[keyof typeof BX.Call.Lib.ReconnectOutcome] | `error_${string}`;

/**
 * Addresses one series. A series of the `peer` target belongs to one interlocutor, so its
 * user id is a part of the key; a series of the media server has no user id.
 */
type ReconnectSeriesKey = {
	target: ReconnectTargetType;
	userId?: number | null;
};

type ReconnectStartEntryParams = ReconnectSeriesKey & {
	reason?: string | null;
};

type ReconnectUpdateLastEntryParams = ReconnectSeriesKey & {
	isSuccessful?: boolean;
};

type ReconnectCloseSeriesParams = ReconnectSeriesKey & {
	outcome: ReconnectOutcomeType;
};

declare namespace BX.Call.Lib {
	const ReconnectTarget: {
		readonly MediaServer: "mediaserver";
		readonly Peer: "peer";
	};

	const ReconnectOutcome: {
		readonly Success: "success";
		readonly NotConnected: "not_connected";
		readonly NotRecovered: "not_recovered";
		readonly Escalated: "escalated";
	};

	class ReconnectHistory {
		/**
		 * Register a reconnect attempt: open a series for this key or add an attempt to the open
		 * one, and append the attempt to the journal.
		 * A peer attempt without a numeric user id is rejected loudly and changes nothing.
		 * @param params the key of the series (`target` and, for a peer, `userId`) and the reason
		 * of the attempt: a bare literal, kept out of any composed string
		 */
		startEntry(params: ReconnectStartEntryParams): void;
		/**
		 * End the last reconnect entry of this key (if it is open); a successful one also closes
		 * the series with the `success` outcome.
		 * @param params the key of the series and the reconnection status
		 * Returns true when an entry was ended, false otherwise.
		 */
		updateLastEntry(params: ReconnectUpdateLastEntryParams): boolean;
		/**
		 * Close the open series of this key with an outcome. The outcome is recorded once:
		 * a series that already has one keeps it.
		 * @param params the key of the series and the outcome to record
		 * Returns true when this call recorded the outcome, false otherwise.
		 */
		closeSeries(params: ReconnectCloseSeriesParams): boolean;
		/**
		 * Tell whether the series of this key is open, i.e. exists and has no outcome yet.
		 */
		isSeriesOpen(key: ReconnectSeriesKey): boolean;
		/**
		 * Return a copy of the series known for this key so callers can't mutate internal state.
		 */
		getSeries(key: ReconnectSeriesKey): ReconnectSeries | null;
		/**
		 * Return copies of the series that have no outcome yet. Every copy carries its own key (the
		 * target and, for a peer series, the user id), so the caller can address it back.
		 */
		getOpenSeries(): ReadonlyArray<ReconnectSeries>;
		/**
		 * Return a deep copy of the history so callers can't mutate internal state.
		 */
		getHistory(): ReadonlyArray<ReconnectHistoryEntry>;
		/**
		 * Clear history and series.
		 */
		clear(): void;
	}

	/**
	 * Build the string that addresses a series: the target alone for the media server, the target and
	 * the user id for a peer, so that both parts are recoverable from the key.
	 */
	function buildSeriesKey({ target, userId }: ReconnectSeriesKey): string;
}
