import type { ClockPort } from 'call.engine.transport';

/**
 * One recorded schedule, taken when it was asked for: a test reads the delay a consumer chose, which
 * is the only place a growing backoff or a debounce window is visible from outside. A snapshot, so
 * the record never moves with the timer it came from.
 */
export type ScheduledTimer = {
	kind: 'once' | 'repeating',
	delayMs: number,
};

type PendingTimer = {
	id: number,
	dueAt: number,
	/** Absent for a one-shot timer; the interval to re-arm with for a repeating one. */
	intervalMs?: number,
	callback: () => void,
};

/** A tick that runs this many callbacks is a timer re-arming itself with no delay, not a test. */
const MAX_CALLBACKS_PER_TICK = 10000;

/**
 * Fully virtual time. It starts at zero and moves only through `tick()`: nothing here reaches a real
 * `setTimeout`, so a ping, a debounce window or a reconnect budget is exercised at once instead of
 * being waited out, and a test that forgets to advance time sees a timer that simply never fired.
 *
 * The rules a consumer can rely on:
 *
 * - a `tick` fires everything due on the way in chronological order, ties in the order the timers
 *   were scheduled;
 * - inside a callback `now()` reads the due time of that timer, not the end of the tick, so a
 *   consumer measuring an interval sees the time it was promised; the clock lands on the target once
 *   nothing is due any more;
 * - a timer scheduled from inside a callback counts from that due time and still fires within the
 *   same tick when it lands inside it - which is what makes a self-rescheduling ping advance by one
 *   `tick(interval)` per round instead of collapsing into it;
 * - cancelling is idempotent: before the callback it disarms the timer, twice or after it does
 *   nothing, and a repeating timer may cancel itself from its own callback and is then not re-armed.
 *
 * An exception thrown by a callback propagates out of `tick()`: the consumer is under test, and a
 * clock that swallowed it would turn a failure into a silent pass.
 */
export class FakeClockPort implements ClockPort
{
	#now: number = 0;
	#nextTimerId: number = 1;
	#pending: Map<number, PendingTimer> = new Map();
	#scheduled: ScheduledTimer[] = [];
	#firedCallbackCount: number = 0;

	now(): number
	{
		return this.#now;
	}

	scheduleOnce(callback: () => void, delayMs: number): () => void
	{
		return this.#schedule(callback, delayMs, false);
	}

	scheduleRepeating(callback: () => void, intervalMs: number): () => void
	{
		return this.#schedule(callback, intervalMs, true);
	}

	/** Advances virtual time by `ms`, firing what is due; see the class comment for the ordering rules. */
	tick(ms: number): void
	{
		if (ms < 0)
		{
			throw new Error(`FakeClockPort: tick(${ms}) would move time backwards`);
		}

		const target = this.#now + ms;
		let fired = 0;

		for (let timer = this.#nextDue(target); timer !== undefined; timer = this.#nextDue(target))
		{
			fired++;

			if (fired > MAX_CALLBACKS_PER_TICK)
			{
				throw new Error(
					`FakeClockPort: tick(${ms}) ran ${MAX_CALLBACKS_PER_TICK} callbacks and is still not done`
					+ ' - a timer re-arms itself with a non-positive delay',
				);
			}

			this.#now = timer.dueAt;
			this.#fire(timer);
		}

		this.#now = target;
	}

	/** Every schedule in the order it was asked for: the record a backoff sequence is asserted on. */
	getScheduledTimers(): ScheduledTimer[]
	{
		return [...this.#scheduled];
	}

	/** Timers still waiting - zero once a consumer has cancelled everything it armed. */
	getPendingTimerCount(): number
	{
		return this.#pending.size;
	}

	/** Callbacks that have run; a repeating timer counts once per run. */
	getFiredCallbackCount(): number
	{
		return this.#firedCallbackCount;
	}

	#schedule(callback: () => void, delayMs: number, isRepeating: boolean): () => void
	{
		const id = this.#nextTimerId++;

		this.#scheduled.push({ kind: isRepeating ? 'repeating' : 'once', delayMs });
		this.#pending.set(id, {
			id,
			dueAt: this.#now + delayMs,
			intervalMs: isRepeating ? delayMs : undefined,
			callback,
		});

		return () => {
			this.#pending.delete(id);
		};
	}

	#fire(timer: PendingTimer): void
	{
		if (timer.intervalMs === undefined)
		{
			this.#pending.delete(timer.id);
		}

		this.#firedCallbackCount++;
		timer.callback();

		// a repeating callback that cancelled itself is gone from the map by now, so it is not re-armed
		if (timer.intervalMs !== undefined && this.#pending.has(timer.id))
		{
			timer.dueAt += timer.intervalMs;
		}
	}

	/** Earliest timer due at or before `target`; ties go to the one scheduled first. */
	#nextDue(target: number): PendingTimer | undefined
	{
		let next: PendingTimer | undefined = undefined;

		for (const timer of this.#pending.values())
		{
			if (timer.dueAt > target)
			{
				continue;
			}

			const isEarlier = next === undefined
				|| timer.dueAt < next.dueAt
				|| (timer.dueAt === next.dueAt && timer.id < next.id);

			if (isEarlier)
			{
				next = timer;
			}
		}

		return next;
	}
}
