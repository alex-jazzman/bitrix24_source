import type {
	InterceptorChain as InterceptorChainContract,
	InterceptorErrorHandler,
	InterceptorHandler,
} from './types';

type InterceptorRecord<T> = {
	id: number;
	onFulfilled: InterceptorHandler<T>;
	onRejected: InterceptorErrorHandler<T> | null;
};

/**
 * An ordered chain of interceptor handlers with axios-like semantics.
 * Handlers run in registration order: each `onFulfilled` receives the current
 * value and returns the next one (or a promise of it) without mutating the input;
 * `onRejected` observes an error thrown earlier in the chain and either
 * recovers by returning a value or rethrows to keep the chain rejected.
 */
export class InterceptorChain<T> implements InterceptorChainContract<T>
{
	#handlers: Array<InterceptorRecord<T>> = [];
	#nextId: number = 0;

	use(onFulfilled: InterceptorHandler<T>, onRejected?: InterceptorErrorHandler<T>): number
	{
		this.#nextId += 1;
		this.#handlers.push({
			id: this.#nextId,
			onFulfilled,
			onRejected: onRejected ?? null,
		});

		return this.#nextId;
	}

	eject(id: number): void
	{
		this.#handlers = this.#handlers.filter((record) => record.id !== id);
	}

	/**
	 * Passes the initial value through all registered handlers.
	 * A rejected initial promise (or an error thrown by a handler) skips
	 * the subsequent `onFulfilled` handlers until an `onRejected` handler recovers.
	 */
	run(initial: T | Promise<T>): Promise<T>
	{
		return this.#handlers.reduce<Promise<T>>(
			(promise, record) => promise.then(record.onFulfilled, record.onRejected ?? undefined),
			Promise.resolve(initial) as Promise<T>,
		);
	}
}
