/* eslint-disable */
type ReconnectHistoryEntry = {
	started: number;
	ended: number | null;
	initial: boolean;
	last: boolean;
	reason: string | null;
	target: ReconnectTargetType;
};

type ReconnectTargetType = typeof BX.Call.Lib.ReconnectTarget[keyof typeof BX.Call.Lib.ReconnectTarget];

declare namespace BX.Call.Lib {
	const ReconnectTarget: {
		readonly Sdk: "sdk";
		readonly Provider: "provider";
	};

	class ReconnectHistory {
		/**
		 * Close the last open entry for this target (if any), then add a new one.
		 * @param reason textual reason (null is allowed)
		 * @param target the target of the reconnect entry
		 * @param userId optional user ID to append to the reason string
		 */
		startEntry(reason: string | null, target: ReconnectTargetType, userId?: number): void;
		/**
		 * End the last reconnect entry (if it is open).
		 * @param target the target of the reconnect entry
		 * @param isSuccessful reflects the reconnection status
		 * Returns true when an entry was ended, false otherwise.
		 */
		updateLastEntry(target: ReconnectTargetType, isSuccessful?: boolean): boolean;
		/**
		 * Return a deep copy of the history so callers can't mutate internal state.
		 */
		getHistory(): ReadonlyArray<ReconnectHistoryEntry>;
		/**
		 * Clear history.
		 */
		clear(): void;
	}
}
