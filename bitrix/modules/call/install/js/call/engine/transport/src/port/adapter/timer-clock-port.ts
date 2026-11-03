import type { ClockPort } from '../clock-port';

/**
 * The timers of the host, declared here and injected for the same reason as every other primitive of
 * this directory: nothing global is captured, so the port is constructible with a stand-in. A handle
 * is whatever the primitive gave out - the adapter keeps it and hands it back, never reads it.
 *
 * Both pairs are called as methods of the injected object, so a primitive whose timers need their
 * receiver - `window` is one - works when passed as it is.
 */
export type TimerPrimitive = {
	setTimeout(callback: () => void, delayMs: number): number,
	clearTimeout(handle: number): void,
	setInterval(callback: () => void, intervalMs: number): number,
	clearInterval(handle: number): void,
};

/**
 * Source of what `now()` reports. Separate from the timers because the port promises a non-decreasing
 * reading for measuring elapsed time: that is `performance`, not a wall clock that may be corrected
 * backwards under a running measurement.
 */
export type MonotonicClockPrimitive = {
	now(): number,
};

export type TimerClockPortOptions = {
	timers: TimerPrimitive,
	clock: MonotonicClockPrimitive,
};

/**
 * `ClockPort` over the timers of the host. It measures and schedules, and that is all: no default
 * delay, no growing interval, no budget - how long to wait and how many times is the policy of the
 * caller.
 *
 * Cancelling is safe to do unconditionally, as the port promises. The handle is forgotten both when
 * the cancel function runs and when a one-shot callback fires, so a second cancel - or a cancel after
 * the callback - reaches no timer at all, not even one that has since been given the same handle.
 */
export class TimerClockPort implements ClockPort
{
	#timers: TimerPrimitive;
	#clock: MonotonicClockPrimitive;

	constructor(options: TimerClockPortOptions)
	{
		this.#timers = options.timers;
		this.#clock = options.clock;
	}

	now(): number
	{
		return this.#clock.now();
	}

	scheduleOnce(callback: () => void, delayMs: number): () => void
	{
		let handle: number | undefined = undefined;

		const cancel = (): void => {
			if (handle !== undefined)
			{
				this.#timers.clearTimeout(handle);
				handle = undefined;
			}
		};

		handle = this.#timers.setTimeout(() => {
			handle = undefined;
			callback();
		}, delayMs);

		return cancel;
	}

	scheduleRepeating(callback: () => void, intervalMs: number): () => void
	{
		let handle: number | undefined = this.#timers.setInterval(callback, intervalMs);

		return () => {
			if (handle !== undefined)
			{
				this.#timers.clearInterval(handle);
				handle = undefined;
			}
		};
	}
}
