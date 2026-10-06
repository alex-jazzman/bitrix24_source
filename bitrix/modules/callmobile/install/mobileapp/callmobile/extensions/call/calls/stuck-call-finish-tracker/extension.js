/**
 * Per-app-instance tracker for stuck-call recovery finish requests. Mobile
 * symmetric of the web `call.lib.stuck-call-finish-tracker` extension.
 *
 * When the media room is gone, every "/v2/join?mustCreate=false" attempt for
 * the same call triggers a CallManager.finish REST call (see the auto-finish
 * branches in controller/extension.js). Without this guard the same app
 * instance can fire several recovery finishes for one zombie call (multiple
 * retries from incoming notifications, recent list, manual joins) — each one
 * is a 22-30s PHP-FPM worker on the server.
 *
 * The tracker does two things:
 *   1. Dedup — the same (callId, callUuid) is scheduled at most once
 *      concurrently.
 *   2. Debounce — REST request is delayed by DEBOUNCE_MS; if the Pull
 *      `Call::finish` event arrives within that window the engine pull
 *      dispatch is expected to call cancelPending(...) so the REST request
 *      is skipped entirely. This avoids a server round-trip when the
 *      backend already finished the call on its own.
 *
 * The dedup marker is released only when the REST promise returned from
 * `fire()` settles (or immediately, on `cancelPending`) — so a follow-up
 * `scheduleFinish` while the original REST is still in flight is correctly
 * suppressed, and a transient failure of the REST does not permanently
 * block recovery for the same call in this app instance.
 *
 * Backend has its own rate-limit on recovery broadcasts (FINISH_RECOVERY_TTL
 * in Signaling.php); this client tracker is the first line of defence so
 * that no-op finish requests don't even reach the server.
 */
jn.define('call/calls/stuck-call-finish-tracker', (require, exports, module) => {

	class StuckCallFinishTracker
	{
		static DEBOUNCE_MS = 3000;

		static MAX_CLOSED_UUIDS = 100;

		constructor()
		{
			this._scheduledKeys = new Set();
			this._pendingTimers = new Map();
			this._closedUuids = new Set();
		}

		_keyOf(callId, callUuid)
		{
			return `${callUuid || ''}|${callId || ''}`;
		}

		scheduleFinish(callId, callUuid, fire)
		{
			const key = this._keyOf(callId, callUuid);
			if (this._scheduledKeys.has(key))
			{
				return false;
			}
			this._scheduledKeys.add(key);
			const timer = setTimeout(() => {
				this._pendingTimers.delete(key);
				// Release the dedupe marker only when the REST request
				// actually completes. Until .finally() fires, any repeat
				// user action in the same call (another "Join" tap 3+ sec
				// later) still sees `_scheduledKeys` occupied and is
				// correctly suppressed — closing the anti-storm hole on
				// the long finish-path. The cancelPending path covers the
				// legitimate "Pull Call::finish arrived first" case.
				Promise.resolve()
					.then(() => fire())
					.finally(() => this._scheduledKeys.delete(key));
			}, StuckCallFinishTracker.DEBOUNCE_MS);
			this._pendingTimers.set(key, timer);
			return true;
		}

		cancelPending(callId, callUuid)
		{
			const key = this._keyOf(callId, callUuid);
			const timer = this._pendingTimers.get(key);
			if (timer !== undefined)
			{
				clearTimeout(timer);
				this._pendingTimers.delete(key);
			}
			// Drop the dedupe marker too — without this `_scheduledKeys`
			// grows monotonically over the app instance lifetime and
			// blocks any future recovery scheduling for the same call.
			this._scheduledKeys.delete(key);
		}

		/**
		 * Records a callUuid whose room the server just confirmed gone, so a
		 * repeat join-by-uuid can be short-circuited without another 500 round
		 * trip (see CallEngine.getCallConnectionDataById). Bounded FIFO (Set
		 * keeps insertion order): the oldest entry is evicted past
		 * MAX_CLOSED_UUIDS; re-marking refreshes recency.
		 */
		markClosed(callUuid)
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
				this._closedUuids.delete(oldest);
			}
		}

		/**
		 * True if this callUuid was recently confirmed closed via markClosed().
		 */
		isRecentlyClosed(callUuid)
		{
			return callUuid ? this._closedUuids.has(callUuid) : false;
		}
	}

	const stuckCallFinishTracker = new StuckCallFinishTracker();

	module.exports = {
		StuckCallFinishTracker,
		stuckCallFinishTracker,
	};

});
