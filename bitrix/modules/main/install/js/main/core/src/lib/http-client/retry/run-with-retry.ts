import Type from '../../type';
import { HttpClientError } from '../errors';
import { calculateDelay as defaultCalculateDelay } from './delay';
import { isRetryableError as defaultShouldRetry } from './policy';
import { sleep } from './sleep';
import type { EffectiveRequestConfig, HttpMethod, NormalizedRetryPolicy, RetryConfig, RetryContext } from '../types';

/**
 * Methods safe to repeat by the semantics of HTTP alone: they are not expected
 * to change the server state, so a repeat of one of them cannot duplicate an
 * effect. Any other method needs the explicit `idempotent` statement of the
 * caller.
 */
const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);

/** The replaceable strategies of a request, exactly as the caller passed them. */
export type RetryStrategies = Pick<RetryConfig, 'shouldRetry' | 'calculateDelay' | 'onRetry'>;

/** Everything the loop reads without looking at the outcome of the operation. */
type RetryRunOptions = {
	policy: NormalizedRetryPolicy;
	strategies: RetryStrategies;
	/** The request method in upper case. */
	method: HttpMethod;
	config: EffectiveRequestConfig;
	/** The signal of the caller — the only one a pause between attempts honors. */
	userSignal: AbortSignal | null;
	/**
	 * Retries already spent on this operation by a loop that ran before this one.
	 * The action path uses it so that a request re-sent with a fresh CSRF token
	 * continues the series instead of starting a budget of its own.
	 */
	spentRetries?: number;
	/**
	 * When the operation started, in `Date.now()` terms. Set by a caller that
	 * continues an operation already begun, so that `totalTimeout` stays the
	 * budget of the whole operation rather than restarting with the new loop.
	 */
	startedAt?: number;
};

export type RunWithRetryOptions<T = unknown> = RetryRunOptions & {
	/**
	 * Publishes the spent retries on a successful outcome, the counterpart of the
	 * counter the loop stamps on an error. The loop is generic over the outcome
	 * and knows nothing about the shape of `T`, so the caller that owns that
	 * shape does the writing.
	 */
	publishRetryCount?: (result: T, retryCount: number) => void;
};

function isRetryableMethod(method: HttpMethod, policy: NormalizedRetryPolicy): boolean
{
	return policy.idempotent || safeMethods.has(method);
}

/**
 * A stream body is consumed by the first attempt, so a repeat would send an
 * empty one: such a request is never retried, whatever the policy says. A
 * `FormData` is reusable by this rule — it is passed by reference and a repeat
 * sends its current state, an accepted limitation of the layer.
 */
function isNonReusableBody(body: unknown): boolean
{
	return !Type.isUndefined(globalThis.ReadableStream) && body instanceof ReadableStream;
}

function isAbortError(error: unknown): boolean
{
	return error instanceof DOMException && error.name === 'AbortError';
}

/**
 * Publishes the number of retries the operation spent on the error it ends
 * with. Only the errors of the layer are touched: a native `AbortError` or a
 * `TypeError` of the calling code belongs to someone else and is never mutated.
 *
 * Exported for the callers that finish an operation outside this loop: the
 * action path builds errors of its own after the transport series is already
 * over (see `controller/action-runner.ts`), and they report the same counter.
 */
export function withRetryCount(error: unknown, retryCount: number): unknown
{
	if (error instanceof HttpClientError)
	{
		// the counter is published on the very object the caller catches: rebuilding
		// the error would lose its class, its own fields and its stack
		// eslint-disable-next-line no-param-reassign
		error.retryCount = retryCount;
	}

	return error;
}

/**
 * The counterpart of `withRetryCount` for an outcome that succeeded. The writing
 * itself belongs to the caller: only it knows the shape of the result, and a
 * loop that guessed the shape would touch values that are not its own.
 */
function publishRetryCount<T>(options: RunWithRetryOptions<T>, result: T, retryCount: number): T
{
	options.publishRetryCount?.(result, retryCount);

	return result;
}

/**
 * Calls the observer without letting it influence the series. `onRetry` is
 * documented as unable to change the decision, so a throwing logger must not
 * replace the transport error of the attempt with an error of its own or cut
 * the retries short.
 */
function notifyRetry(strategies: RetryStrategies, context: RetryContext & { delay: number }): void
{
	try
	{
		strategies.onRetry?.(context);
	}
	catch (error)
	{
		console.error('main.core HttpClient: the {retry.onRetry} callback has thrown, the retry goes on.', error);
	}
}

/**
 * Retries the operation already spent before this loop started. An error that
 * arrives carrying a counter comes from an inner loop of the same operation
 * (the action path re-sends a request with a fresh CSRF token), so the series
 * continues from that number instead of restarting.
 */
function spentBefore(options: RetryRunOptions): number
{
	return Type.isNumber(options.spentRetries) ? options.spentRetries : 0;
}

/**
 * Whether the failed attempt earns another one. The invariants of the layer are
 * checked here, all of them before the eligibility predicate, so an own
 * `shouldRetry` can only narrow the retried set — never widen it past a caller
 * abort, an exhausted attempt budget, an unsafe method or a non-reusable body.
 */
function isRetryAllowed(context: RetryContext, options: RetryRunOptions): boolean
{
	const { policy, strategies, method, config, userSignal } = options;

	if (userSignal?.aborted)
	{
		// the caller gave up on the operation: repeating it would ignore the abort
		return false;
	}

	if (isAbortError(context.error))
	{
		return false;
	}

	if (context.attempt > policy.retries)
	{
		return false;
	}

	if (!isRetryableMethod(method, policy))
	{
		return false;
	}

	if (isNonReusableBody(config.body))
	{
		return false;
	}

	const shouldRetry = Type.isFunction(strategies.shouldRetry) ? strategies.shouldRetry : defaultShouldRetry;

	return shouldRetry(context);
}

async function runAttempts<T>(options: RunWithRetryOptions<T>, attemptFn: () => Promise<T>): Promise<T>
{
	const { policy, strategies, method, config, userSignal } = options;
	// the budget of time is carried over the same way the budget of attempts is:
	// a loop continuing an operation already begun measures `totalTimeout` from
	// the start of that operation, not from its own
	const startedAt = Type.isNumber(options.startedAt) ? options.startedAt : Date.now();
	// the series continues the one an inner loop of the same operation already ran,
	// so the budget is shared rather than granted anew
	let attempt = spentBefore(options);

	// the attempts are sequential by definition: the next one is decided by the
	// failure of the previous, so awaiting inside the loop is the algorithm itself
	/* eslint-disable no-await-in-loop */
	for (;;)
	{
		attempt += 1;

		try
		{
			return publishRetryCount<T>(options, await attemptFn(), attempt - 1);
		}
		catch (error)
		{
			const context: RetryContext = {
				error,
				attempt,
				retryCount: attempt - 1,
				method,
				config,
				policy,
			};

			if (!isRetryAllowed(context, options))
			{
				throw withRetryCount(error, context.retryCount);
			}

			const calculateDelay = Type.isFunction(strategies.calculateDelay)
				? strategies.calculateDelay
				: defaultCalculateDelay;
			const delay = calculateDelay(context);

			if (policy.totalTimeout > 0 && Date.now() - startedAt + delay >= policy.totalTimeout)
			{
				// the pause alone would already break the budget of the whole operation,
				// so the last error is the outcome instead of a retry that cannot finish
				throw withRetryCount(error, context.retryCount);
			}

			notifyRetry(strategies, { ...context, delay });

			// the pause honors the caller signal only: the timeout signal of the finished
			// attempt belongs to that attempt and says nothing about the series
			await sleep(delay, userSignal);
		}
	}
	/* eslint-enable no-await-in-loop */
}

/**
 * Runs one request under its retry policy: `attemptFn` performs a single
 * attempt and the loop decides whether its failure earns another one. The
 * transport stays out of here — the loop only repeats the callback, so it is
 * testable and reusable on its own.
 *
 * With the default budget of zero retries the attempt promise is returned as
 * is: a client that never configured retries keeps the execution path it had
 * before the loop existed — no extra promise, no extra listener.
 */
export function runWithRetry<T>(options: RunWithRetryOptions<T>, attemptFn: () => Promise<T>): Promise<T>
{
	const spent = spentBefore(options);
	if (options.policy.retries <= 0)
	{
		// `retryCount` already defaults to 0 on both outcomes, so an operation that
		// never retried keeps the untouched path: the promise is only decorated when
		// an inner loop of the same operation did spend retries
		if (spent === 0)
		{
			return attemptFn();
		}

		return attemptFn().then(
			(result: T) => publishRetryCount<T>(options, result, spent),
			(error: unknown) => {
				throw withRetryCount(error, spent);
			},
		);
	}

	return runAttempts<T>(options, attemptFn);
}
