import type { MediaDevicesPort, Result } from 'call.engine.transport';

/** Answers a call the test held back, with the outcome it hands over. */
export type HeldMediaAnswer = (result: Result<MediaStream>) => void;

/** A call being held: the promise the port answers with, and the way the test settles it. */
type HeldCapture = {
	result: Promise<Result<MediaStream>>,
	answer: HeldMediaAnswer,
};

/**
 * A promise nobody settles until the test does. The executor of a promise runs while the promise is
 * being built, so the way to settle it is in place by the time the pair is handed over.
 */
function heldCapture(): HeldCapture
{
	let settle: HeldMediaAnswer | undefined = undefined;
	const result = new Promise<Result<MediaStream>>((resolve) => {
		settle = resolve;
	});

	return { result, answer: (outcome) => settle?.(outcome) };
}

/**
 * Programmable local media. Every outcome is programmed by the test and nothing is taken from the
 * environment: the fake never touches `navigator`, so it needs neither a browser nor a permission, and
 * the streams it hands back are the ones the test put in.
 *
 * Each one-shot method reads its queue first and falls back to the standing outcome, which is what
 * covers a relaxed retry of `getUserMedia` and a device list that changes after a `devicechange`. A
 * method nobody programmed throws instead of answering - see `FakeRestPort` for the reasoning.
 *
 * A capture can also be held back instead of programmed: `holdUserMedia` and `holdDisplayMedia` take
 * precedence over both the queue and the standing outcome, and hand back the way to answer that one
 * call later. That is what makes the window a request of the system is open in observable, and lets a
 * test answer two open requests in whichever order it likes.
 */
export class FakeMediaDevicesPort implements MediaDevicesPort
{
	#userMediaCalls: MediaStreamConstraints[] = [];
	#displayMediaCalls: Array<DisplayMediaStreamOptions | undefined> = [];
	#enumerateDevicesCallCount: number = 0;
	#userMediaStanding: Result<MediaStream> | undefined = undefined;
	#userMediaQueue: Result<MediaStream>[] = [];
	#userMediaHeld: HeldCapture[] = [];
	#displayMediaStanding: Result<MediaStream> | undefined = undefined;
	#displayMediaQueue: Result<MediaStream>[] = [];
	#displayMediaHeld: HeldCapture[] = [];
	#devicesStanding: Result<MediaDeviceInfo[]> | undefined = undefined;
	#devicesQueue: Result<MediaDeviceInfo[]>[] = [];
	#deviceChangeListeners: Set<() => void> = new Set();
	#disposed: boolean = false;

	async getUserMedia(constraints: MediaStreamConstraints): Promise<Result<MediaStream>>
	{
		this.#userMediaCalls.push(constraints);

		const held = this.#userMediaHeld.shift();

		if (held !== undefined)
		{
			return held.result;
		}

		return this.#programmed(this.#userMediaQueue.shift() ?? this.#userMediaStanding, 'getUserMedia');
	}

	async getDisplayMedia(constraints?: DisplayMediaStreamOptions): Promise<Result<MediaStream>>
	{
		this.#displayMediaCalls.push(constraints);

		const held = this.#displayMediaHeld.shift();

		if (held !== undefined)
		{
			return held.result;
		}

		return this.#programmed(
			this.#displayMediaQueue.shift() ?? this.#displayMediaStanding,
			'getDisplayMedia',
		);
	}

	async enumerateDevices(): Promise<Result<MediaDeviceInfo[]>>
	{
		this.#enumerateDevicesCallCount++;

		return this.#programmed(this.#devicesQueue.shift() ?? this.#devicesStanding, 'enumerateDevices');
	}

	subscribeDeviceChange(listener: () => void): () => void
	{
		this.#deviceChangeListeners.add(listener);

		return () => {
			this.#deviceChangeListeners.delete(listener);
		};
	}

	dispose(): void
	{
		this.#disposed = true;
		this.#deviceChangeListeners.clear();
	}

	setUserMediaResult(result: Result<MediaStream>): void
	{
		this.#userMediaStanding = result;
	}

	queueUserMediaResult(result: Result<MediaStream>): void
	{
		this.#userMediaQueue.push(result);
	}

	/**
	 * Holds back the answer of the next `getUserMedia` and hands over the way to give it. Held calls are
	 * taken in the order they arrive, so a test that holds two of them answers each by its own function
	 * and decides which request of the system comes back first.
	 */
	holdUserMedia(): HeldMediaAnswer
	{
		const held = heldCapture();

		this.#userMediaHeld.push(held);

		return held.answer;
	}

	setDisplayMediaResult(result: Result<MediaStream>): void
	{
		this.#displayMediaStanding = result;
	}

	queueDisplayMediaResult(result: Result<MediaStream>): void
	{
		this.#displayMediaQueue.push(result);
	}

	/** Holds back the answer of the next `getDisplayMedia` - the picker of the system left open. */
	holdDisplayMedia(): HeldMediaAnswer
	{
		const held = heldCapture();

		this.#displayMediaHeld.push(held);

		return held.answer;
	}

	setEnumerateDevicesResult(result: Result<MediaDeviceInfo[]>): void
	{
		this.#devicesStanding = result;
	}

	queueEnumerateDevicesResult(result: Result<MediaDeviceInfo[]>): void
	{
		this.#devicesQueue.push(result);
	}

	/** Silent after `dispose()`, so a consumer that forgot to unsubscribe is not woken by the fake. */
	emitDeviceChange(): void
	{
		if (this.#disposed)
		{
			return;
		}

		[...this.#deviceChangeListeners].forEach((listener) => listener());
	}

	getUserMediaCalls(): MediaStreamConstraints[]
	{
		return [...this.#userMediaCalls];
	}

	getDisplayMediaCalls(): Array<DisplayMediaStreamOptions | undefined>
	{
		return [...this.#displayMediaCalls];
	}

	/** `enumerateDevices` takes no argument, so the count is the whole record of it. */
	getEnumerateDevicesCallCount(): number
	{
		return this.#enumerateDevicesCallCount;
	}

	/** Lets a test assert that the consumer released the port on teardown. */
	isDisposed(): boolean
	{
		return this.#disposed;
	}

	#programmed<TValue>(result: Result<TValue> | undefined, operation: string): Result<TValue>
	{
		if (result === undefined)
		{
			throw new Error(`FakeMediaDevicesPort: no result programmed for ${operation}()`);
		}

		return result;
	}
}
