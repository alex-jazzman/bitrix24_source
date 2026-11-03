/**
 * Time and timers behind one seam. It exists for determinism: a fake gives fully virtual time advanced
 * by hand, so a ping, a reconnect budget or a debounce is tested without a real `setTimeout` and
 * without waiting for one. The port measures and schedules, nothing else - how long to wait, how many
 * times and whether the delay grows is the policy of the caller, so no backoff lives here.
 */
export interface ClockPort
{
	/**
	 * Milliseconds for measuring how much time has passed. Non-decreasing and comparable only with
	 * other readings of the same port: it is neither a wall clock nor a date, which is what lets a fake
	 * start at zero and move only when a test says so.
	 */
	now(): number;

	/**
	 * Runs the callback once after the delay and returns the cancel function - the shape a subscription
	 * of the other ports already has, so the caller keeps one function instead of a handle it would
	 * have to store and hand back. Cancelling twice changes nothing, and cancelling after the callback
	 * has run does nothing.
	 */
	scheduleOnce(callback: () => void, delayMs: number): () => void;

	/**
	 * Runs the callback on every interval until cancelled; cancelling behaves as in `scheduleOnce` and
	 * no callback follows it.
	 */
	scheduleRepeating(callback: () => void, intervalMs: number): () => void;
}
