/**
 * Runs `task` over `items` with at most `maxConcurrency` in-flight tasks. On
 * each completed item launches the next pending one until the queue drains.
 *
 * The first task error stops the pool: subsequent task completions are silently
 * ignored, `onError` is called once with the offending item and error. The
 * caller is responsible for cancelling any side effects (XHRs, timers).
 *
 * Aborts honoured cooperatively: `isAborted()` is consulted before every task
 * launch — when it returns true the pool stops spinning new tasks. In-flight
 * tasks must observe abort themselves and reject their promise to free the
 * slot back to the pool.
 *
 * @param options.items Items to process; passed to `task` one by one.
 * @param options.maxConcurrency Upper bound on simultaneously running tasks.
 * @param options.isAborted Cooperative cancellation check, called before each launch.
 * @param options.task Returns a Promise resolving when the item is done.
 * @param options.onItemDone Optional per-item completion hook.
 * @param options.onAllDone Called once when every item completed successfully.
 * @param options.onError Called on the first failure; pool stops scheduling more.
 */
type PoolOptions<T, R> = {
	items: T[];
	maxConcurrency: number;
	isAborted: () => boolean;
	task: (item: T) => Promise<R>;
	onItemDone?: (item: T, result: R) => void;
	onAllDone: () => void;
	onError: (item: T, error: any) => void;
};

export function runConcurrentPool<T, R>(options: PoolOptions<T, R>): void
{
	const { items, maxConcurrency, isAborted, task, onItemDone, onAllDone, onError } = options;
	let inFlight: number = 0;
	let index: number = 0;
	let errored: boolean = false;

	if (items.length === 0)
	{
		onAllDone();

		return;
	}

	const runItem = (item: T): void => {
		Promise.resolve(task(item))
			.then((result: R) => {
				inFlight--;
				if (errored)
				{
					return;
				}

				if (onItemDone)
				{
					onItemDone(item, result);
				}

				if (index >= items.length && inFlight === 0)
				{
					onAllDone();
				}
				else
				{
					launchNext();
				}
			})
			.catch((error) => {
				inFlight--;
				if (errored || isAborted())
				{
					return;
				}

				errored = true;
				onError(item, error);
			});
	};

	function launchNext(): void
	{
		if (errored || isAborted())
		{
			return;
		}

		while (inFlight < maxConcurrency && index < items.length)
		{
			const item: T = items[index++];
			inFlight++;
			runItem(item);
		}
	}

	launchNext();
}
