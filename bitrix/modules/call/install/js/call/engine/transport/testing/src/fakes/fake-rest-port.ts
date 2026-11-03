import type { RestActionName, RestActionPayload, RestPort, Result } from 'call.engine.transport';

/** One recorded call, so a test asserts which action was asked for, with what data, and in what order. */
export type RestActionCall = {
	action: RestActionName,
	payload?: RestActionPayload,
};

/**
 * Programmable REST channel. An outcome is programmed per action - that is what a test reads as
 * intent - and both variants of the result are equally available: a refusal of the server is an `Err`
 * here, never a thrown exception.
 *
 * An action nobody programmed throws instead of answering: a missing outcome is a mistake in the test,
 * and an invented one would let a consumer pass on data it never asked for.
 */
export class FakeRestPort implements RestPort
{
	#calls: RestActionCall[] = [];
	#standing: Map<RestActionName, Result<unknown>> = new Map();
	#queued: Map<RestActionName, Result<unknown>[]> = new Map();

	async callAction<TResult = unknown>(
		action: RestActionName,
		payload?: RestActionPayload,
	): Promise<Result<TResult>>
	{
		this.#calls.push({ action, payload });

		const result = this.#queued.get(action)?.shift() ?? this.#standing.get(action);

		if (result === undefined)
		{
			throw new Error(`FakeRestPort: no result programmed for action "${action}"`);
		}

		// the test owns the pairing of an action with the shape it programmed; the port never knows it
		return result as Result<TResult>;
	}

	/** The answer of that action to every call, taken once its queue has run out. */
	setResult(action: RestActionName, result: Result<unknown>): void
	{
		this.#standing.set(action, result);
	}

	/** The answer to the next call of that action, ahead of the standing one: a sequence, a retry. */
	queueResult(action: RestActionName, result: Result<unknown>): void
	{
		const queue = this.#queued.get(action) ?? [];

		queue.push(result);
		this.#queued.set(action, queue);
	}

	getActionCalls(): RestActionCall[]
	{
		return [...this.#calls];
	}
}
