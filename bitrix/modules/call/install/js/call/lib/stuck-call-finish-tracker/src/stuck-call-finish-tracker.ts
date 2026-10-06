/**
 * Per-tab tracker for stuck-call recovery finish requests. When the media room
 * is gone, every "/v2/join?mustCreate=false" attempt for the same call triggers
 * a CallManager.finish REST call (see the auto-finish branch in
 * `getCallConnectionData` and the mobile controller). Without this guard the
 * same tab / app instance can fire several recovery finishes for one zombie
 * call (multiple retries from incoming notifications, recent list, manual
 * joins) — each one is a 22-30s PHP-FPM worker on the server.
 *
 * The tracker does two things:
 *   1. Dedup — the same (callId, callUuid) is scheduled at most once
 *      concurrently.
 *   2. Debounce — REST request is delayed by `DEBOUNCE_MS`; if the Pull
 *      `Call::finish` event arrives within that window the engine layer is
 *      expected to call `cancelPending(...)` so the REST request is skipped
 *      entirely. This avoids a server round-trip when the backend already
 *      finished the call on its own.
 *
 * The dedup marker is released only when the REST promise returned from
 * `fire()` settles (or immediately, on `cancelPending`) — so a follow-up
 * `scheduleFinish` while the original REST is still in flight is correctly
 * suppressed, and a transient failure of the REST does not permanently block
 * recovery for the same call in this tab.
 *
 * Backend has its own rate-limit on recovery broadcasts (`FINISH_RECOVERY_TTL`
 * in `Signaling.php`); this client tracker is the first line of defence so
 * that no-op finish requests don't even reach the server.
 */
export class StuckCallFinishTracker
{
	static DEBOUNCE_MS = 3000;
	static MAX_CLOSED_UUIDS = 100;

	_scheduledKeys: Set<string> = new Set();
	_pendingTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
	_closedUuids: Set<string> = new Set();

	_keyOf(callId: number | string | null, callUuid: string | null): string
	{
		return `${callUuid || ''}|${callId || ''}`;
	}

	/**
	 * Schedules a recovery finish after `DEBOUNCE_MS`. If a Pull
	 * `Call::finish` arrives before the timer fires, `cancelPending()` must
	 * be called to skip the REST request. Returns `true` if this is the
	 * first scheduling for the given call (caller can stop), `false` if a
	 * finish is already pending or in flight from this tab.
	 *
	 * `fire` is expected to return the REST Promise so the dedup marker is
	 * held until the REST settles. Synchronous throws and non-Promise
	 * returns also degrade safely thanks to `Promise.resolve().then(...)`.
	 */
	scheduleFinish(callId: number | string | null, callUuid: string | null, fire: () => unknown): boolean
	{
		const key = this._keyOf(callId, callUuid);
		if (this._scheduledKeys.has(key))
		{
			return false;
		}
		this._scheduledKeys.add(key);
		const timer = setTimeout(() => {
			this._pendingTimers.delete(key);
			// Release the dedupe marker only when the REST request actually
			// completes. Until .finally() fires, any repeat user action in
			// the same call (e.g. another "Join" click 3+ seconds later)
			// still sees `_scheduledKeys` occupied and is correctly
			// suppressed — closing the anti-storm hole on the long
			// finish-path. The cancelPending() path covers the legitimate
			// "Pull Call::finish arrived first" case.
			Promise.resolve()
				.then(() => fire())
				.finally(() => this._scheduledKeys.delete(key));
		}, StuckCallFinishTracker.DEBOUNCE_MS);
		this._pendingTimers.set(key, timer);
		return true;
	}

	/**
	 * Cancels a pending recovery finish — typically invoked from the engine
	 * layer when Pull `Call::finish` arrives for the same callUuid before
	 * the debounce window expires. Idempotent.
	 */
	cancelPending(callId: number | string | null, callUuid: string | null): void
	{
		const key = this._keyOf(callId, callUuid);
		const timer = this._pendingTimers.get(key);
		if (timer !== undefined)
		{
			clearTimeout(timer);
			this._pendingTimers.delete(key);
		}
		// Drop the dedupe marker too — without this `_scheduledKeys` grows
		// monotonically over the lifetime of the tab and blocks any future
		// recovery scheduling for the same call.
		this._scheduledKeys.delete(key);
	}

	/**
	 * Records a callUuid whose room the server just confirmed gone, so a repeat
	 * join attempt for it can be short-circuited without another 500 round-trip.
	 * Bounded FIFO (Set keeps insertion order): the oldest entry is evicted past
	 * MAX_CLOSED_UUIDS. Re-marking refreshes recency.
	 */
	markClosed(callUuid: string | null): void
	{
		if (!callUuid)
		{
			return;
		}
		this._closedUuids.delete(callUuid);
		this._closedUuids.add(callUuid);
		while (this._closedUuids.size > StuckCallFinishTracker.MAX_CLOSED_UUIDS)
		{
			const oldest = this._closedUuids.values().next().value;
			if (oldest === undefined)
			{
				break;
			}
			this._closedUuids.delete(oldest);
		}
	}

	/**
	 * True if this callUuid was recently confirmed closed via markClosed().
	 */
	isRecentlyClosed(callUuid: string | null): boolean
	{
		return callUuid ? this._closedUuids.has(callUuid) : false;
	}
}

/**
 * Process-wide singleton: shared by the engine pull dispatch and the various
 * call-site schedulers (util.js getCallConnectionData and the controllers).
 */
export const stuckCallFinishTracker = new StuckCallFinishTracker();
