/**
 * Auto-close policy of a call hint: the single owner of the "hide after N ms" timer.
 *
 * The policy knows nothing about the popup or the DOM - it takes a delay and an expiration
 * callback, and exposes control methods. That is what makes it testable without a browser.
 *
 * Pausing is taken by reason (`hover`, `focus`) and released only when the last reason is gone:
 * a popup that is both under the cursor and holding focus must not close when one of the two ends.
 * After the last pause is released the countdown starts over rather than resuming the remainder.
 *
 * Two states are terminal, and both stand for a real scenario:
 *  - EXPIRED - after the hint has auto-closed the user still moves the mouse over the place where
 *    it used to be; a `hold`/`release` pair there must not fire the callback a second time;
 *  - DESTROYED - the owner may call `close()` on an instance that is already gone.
 */

const State = Object.freeze({
	Idle: 'IDLE',
	Running: 'RUNNING',
	Paused: 'PAUSED',
	Expired: 'EXPIRED',
	Destroyed: 'DESTROYED',
});

/**
 * Reasons a countdown can be held. Names are normative.
 * @readonly
 */
export const AutoClosePauseReason = Object.freeze({
	Hover: 'hover',
	Focus: 'focus',
});

export class AutoClosePolicy
{
	#delayMs;
	#onExpire;
	#state = State.Idle;
	#holds = new Set();
	#timer = null;

	/**
	 * @param {number} delayMs - countdown length; zero or less means there is no auto-close at all
	 * @param {Function} onExpire - called once the countdown runs out
	 */
	constructor(delayMs, onExpire)
	{
		this.#delayMs = delayMs;
		this.#onExpire = onExpire;
	}

	/**
	 * Starts the countdown from the beginning. Showing a hint the cursor already rests on
	 * does not start it: taken pauses are respected.
	 */
	start()
	{
		if (this.#state === State.Destroyed)
		{
			return;
		}

		this.#clearTimer();

		if (this.#delayMs <= 0)
		{
			this.#state = State.Idle;

			return;
		}

		if (this.#holds.size > 0)
		{
			this.#state = State.Paused;

			return;
		}

		this.#arm();
	}

	/**
	 * @param {string} reason - one of AutoClosePauseReason
	 */
	hold(reason)
	{
		if (this.#state === State.Destroyed)
		{
			return;
		}

		this.#holds.add(reason);

		if (this.#state !== State.Running)
		{
			return;
		}

		this.#clearTimer();
		this.#state = State.Paused;
	}

	/**
	 * @param {string} reason - one of AutoClosePauseReason
	 */
	release(reason)
	{
		if (!this.#holds.delete(reason))
		{
			return;
		}

		// neither IDLE nor EXPIRED resumes the countdown
		if (this.#holds.size > 0 || this.#state !== State.Paused)
		{
			return;
		}

		this.#arm();
	}

	/**
	 * Drops the timer unconditionally, including from a paused countdown. Terminal:
	 * start() does not bring the policy back to life afterwards.
	 */
	destroy()
	{
		this.#clearTimer();
		this.#holds.clear();
		this.#state = State.Destroyed;
	}

	#arm()
	{
		this.#state = State.Running;
		this.#timer = setTimeout(() => this.#expire(), this.#delayMs);
	}

	#expire()
	{
		this.#timer = null;
		this.#state = State.Expired;
		this.#onExpire();
	}

	#clearTimer()
	{
		if (this.#timer !== null)
		{
			clearTimeout(this.#timer);
			this.#timer = null;
		}
	}
}
