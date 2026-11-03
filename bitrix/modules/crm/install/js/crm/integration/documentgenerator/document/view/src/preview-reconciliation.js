const FIRST_WINDOW = 60 * 1000;
const SECOND_WINDOW = 5 * 60 * 1000;
const TIMEOUT = 20 * 60 * 1000;
const MAX_REQUESTS = 74;

export class PreviewReconciliation
{
	#request;
	#onReady;
	#onError;
	#onUnavailable;
	#now;
	#setTimeout;
	#clearTimeout;
	#startedAt = null;
	#requestCount = 0;
	#timer = null;
	#active = false;
	#destroyed = false;
	#generation = 0;

	constructor(options)
	{
		this.#request = options.request;
		this.#onReady = options.onReady || (() => {});
		this.#onError = options.onError || (() => {});
		this.#onUnavailable = options.onUnavailable || (() => {});
		this.#now = options.now || (() => Date.now());
		this.#setTimeout = options.setTimeout || ((callback, delay) => setTimeout(callback, delay));
		this.#clearTimeout = options.clearTimeout || ((timer) => clearTimeout(timer));
	}

	start()
	{
		this.stop();
		this.#destroyed = false;
		this.#active = true;
		this.#startedAt = this.#now();
		this.#requestCount = 0;
		this.#schedule();
	}

	stop()
	{
		this.#generation++;
		this.#active = false;
		if (this.#timer !== null)
		{
			this.#clearTimeout(this.#timer);
			this.#timer = null;
		}
	}

	destroy()
	{
		this.#destroyed = true;
		this.stop();
	}

	applyPull(snapshot)
	{
		if (this.#destroyed)
		{
			return;
		}

		this.#applyTerminalSnapshot(snapshot);
	}

	#schedule()
	{
		if (!this.#active)
		{
			return;
		}

		const elapsed = this.#now() - this.#startedAt;
		if (elapsed >= TIMEOUT || this.#requestCount >= MAX_REQUESTS)
		{
			this.stop();
			this.#onUnavailable();

			return;
		}

		const delay = this.#getDelay(elapsed);
		if (elapsed + delay > TIMEOUT)
		{
			this.stop();
			this.#onUnavailable();

			return;
		}

		const generation = this.#generation;
		this.#timer = this.#setTimeout(async () => {
			if (generation !== this.#generation || !this.#active)
			{
				return;
			}

			this.#timer = null;
			await this.#runRequest();
		}, delay);
	}

	async #runRequest()
	{
		if (!this.#active)
		{
			return;
		}

		const generation = this.#generation;
		this.#requestCount++;
		try
		{
			const snapshot = await this.#request();
			if (generation !== this.#generation || !this.#active)
			{
				return;
			}

			if (this.#applyTerminalSnapshot(snapshot))
			{
				return;
			}
		}
		catch
		{
			// Transport failures share the same bounded schedule as empty snapshots.
		}

		if (generation === this.#generation && this.#active)
		{
			this.#schedule();
		}
	}

	#applyTerminalSnapshot(snapshot)
	{
		if (snapshot?.imageUrl || snapshot?.pdfUrl)
		{
			this.stop();
			this.#onReady(snapshot);

			return true;
		}

		if (snapshot?.isTransformationError)
		{
			this.stop();
			this.#onError(snapshot);

			return true;
		}

		return false;
	}

	#getDelay(elapsed)
	{
		if (elapsed < FIRST_WINDOW)
		{
			return 3000;
		}

		if (elapsed < SECOND_WINDOW)
		{
			return 10000;
		}

		return 30000;
	}
}
