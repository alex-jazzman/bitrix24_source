import { Runtime } from 'main.core';

const DebounceDelay = 1500;

export type TakenBatch = {
	checkListIds: ?Set<number>,
	originalStates: Map<number, boolean>,
	promise: ?Promise<void>,
};

/**
 * Per-task queue of checklist items waiting for one status endpoint (complete or renew).
 * Keeps the pending ids, the states to roll back to and the promise callers await, so that
 * the two opposite operations do not have to juggle parallel maps.
 */
export class StatusBatch
{
	#flush: (taskId: number) => Promise<void>;
	#checkListIds: { [taskId: number]: Set<number> } = {};
	#originalStates: { [taskId: number]: Map<number, boolean> } = {};
	#promises: { [taskId: number]: Promise<void> } = {};
	#inFlightPromises: { [taskId: number]: Promise<void> } = {};
	#debounced: { [taskId: number]: Function } = {};

	constructor(flush: (taskId: number) => Promise<void>)
	{
		this.#flush = flush;
	}

	add(taskId: number, checkListId: number, originalState: boolean): Promise<void>
	{
		this.#checkListIds[taskId] ??= new Set();
		this.#checkListIds[taskId].add(checkListId);

		this.#originalStates[taskId] ??= new Map();
		this.#originalStates[taskId].set(checkListId, originalState);

		this.#promises[taskId] ??= new Resolvable();

		this.#debounced[taskId] ??= Runtime.debounce(this.#flush, DebounceDelay);
		this.#debounced[taskId](taskId);

		return this.#promises[taskId];
	}

	remove(taskId: number, checkListId: number): void
	{
		const checkListIds = this.#checkListIds[taskId];
		if (!checkListIds?.delete(checkListId))
		{
			return;
		}

		this.#originalStates[taskId]?.delete(checkListId);
		if (this.#originalStates[taskId]?.size === 0)
		{
			delete this.#originalStates[taskId];
		}

		if (checkListIds.size > 0)
		{
			return;
		}

		delete this.#checkListIds[taskId];
		const promise = this.#promises[taskId];
		delete this.#promises[taskId];
		promise?.resolve();
	}

	takePending(taskId: number): TakenBatch
	{
		const checkListIds = this.#checkListIds[taskId];
		delete this.#checkListIds[taskId];

		const originalStates = this.#originalStates[taskId] ?? new Map();
		delete this.#originalStates[taskId];

		const promise = this.#promises[taskId];
		delete this.#promises[taskId];

		return { checkListIds, originalStates, promise };
	}

	getOriginalState(taskId: number, checkListId: number): ?boolean
	{
		return this.#originalStates[taskId]?.get(checkListId);
	}

	getPendingSize(taskId: number): number
	{
		return this.#checkListIds[taskId]?.size ?? 0;
	}

	getPromise(taskId: number): ?Promise<void>
	{
		return this.#promises[taskId];
	}

	markInFlight(taskId: number, promise: ?Promise<void>): void
	{
		this.#inFlightPromises[taskId] = promise;
	}

	clearInFlight(taskId: number, promise: ?Promise<void>): void
	{
		if (this.#inFlightPromises[taskId] === promise)
		{
			delete this.#inFlightPromises[taskId];
		}
	}

	getInFlight(taskId: number): ?Promise<void>
	{
		return this.#inFlightPromises[taskId];
	}

	getTaskIds(): number[]
	{
		return Object.keys(this.#checkListIds).map(Number);
	}
}

function Resolvable(): Promise
{
	const promise = new Promise((resolve, reject) => {
		this.resolve = resolve;
		this.reject = reject;
	});

	promise.resolve = this.resolve;
	promise.reject = this.reject;

	return promise;
}
