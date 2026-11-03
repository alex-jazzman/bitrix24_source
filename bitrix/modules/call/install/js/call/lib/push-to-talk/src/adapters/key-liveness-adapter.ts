import { type ClockPort, type TimerId } from '../port/clock-port';

// three intervals of the repeat stream leave the page room to skip a beat under load
const GRACE_INTERVALS = 3;

// a half-second freeze of the page must not cut the speech off, while a microphone left open
// for that long past the release is not audible as a defect
const MIN_GRACE_MS = 750;

export interface KeyLivenessConfig {
	onKeyLivenessLost: () => void;
	clock: ClockPort;
}

/**
 * Watches the stream of key auto-repeats: once repeats have been flowing and then stop while no
 * release arrives, the release counts as lost. The sensor arms on the first actual repeat only -
 * a system that repeats nothing must never be read as a release.
 */
export class KeyLivenessAdapter
{
	readonly #onKeyLivenessLost: () => void;
	readonly #clock: ClockPort;

	#lastRepeatAt: number | null = null;
	#scheduled: TimerId | null = null;

	constructor(config: KeyLivenessConfig)
	{
		this.#onKeyLivenessLost = config.onKeyLivenessLost;
		this.#clock = config.clock;
	}

	stop(): void
	{
		this.#disarm();
	}

	onKeyDown(repeat: boolean): void
	{
		if (!repeat)
		{
			// a fresh press opens a new cycle, and the pace of the previous one says nothing about it
			this.#disarm();

			return;
		}

		const now = this.#clock.now();
		const grace = this.#lastRepeatAt === null
			? MIN_GRACE_MS
			: Math.max(GRACE_INTERVALS * (now - this.#lastRepeatAt), MIN_GRACE_MS);

		this.#lastRepeatAt = now;
		this.#cancelScheduled();
		this.#scheduled = this.#clock.after(grace, () => {
			this.#scheduled = null;
			this.#lastRepeatAt = null;
			this.#onKeyLivenessLost();
		});
	}

	onKeyUp(): void
	{
		this.#disarm();
	}

	#disarm(): void
	{
		this.#cancelScheduled();
		this.#lastRepeatAt = null;
	}

	#cancelScheduled(): void
	{
		if (this.#scheduled !== null)
		{
			this.#clock.cancel(this.#scheduled);
			this.#scheduled = null;
		}
	}
}
