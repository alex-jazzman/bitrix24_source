import Type from '../../type';
import { HttpError, NetworkError, TimeoutError } from '../errors';
import type { NormalizedRetryPolicy, RetryConfig, RetryContext } from '../types';

/**
 * Statuses a response is retried on by default: the request either did not
 * reach the handler (408, 425, 429) or the server reported a temporary
 * failure of its own (5xx of the proxy and gateway family).
 */
const retryableStatuses = new Set([408, 425, 429, 500, 502, 503, 504]);

/** The single place the policy defaults live in. */
const defaultPolicy: NormalizedRetryPolicy = {
	retries: 0,
	idempotent: false,
	delay: 300,
	maxDelay: 10000,
	respectRetryAfter: true,
	totalTimeout: 0,
};

/**
 * The ceiling of the attempt budget. A series longer than this is a mistake of
 * the calling code rather than a policy — nothing in the product retries a
 * request a hundred times — and without a ceiling `retries: Infinity` never
 * ends: the loop compares the attempt number against it and never wins.
 */
const maxRetries = 100;

/**
 * Takes a number the policy can actually run on. A value of the wrong type, a
 * `NaN` or an infinity carries no usable intent and falls back to the default;
 * a finite number outside the range is a sign or unit slip of the calling code
 * and is clamped, which keeps the intent readable and the series finite.
 *
 * Without this a negative `delay` produces a negative pause, `setTimeout` reads
 * it as zero and the retries run back to back — exactly the synchronous flood
 * the jitter exists to prevent.
 */
function pickNumber(value: unknown, fallback: number, upperBound: number = Number.MAX_SAFE_INTEGER): number
{
	if (!Type.isNumber(value) || !Number.isFinite(value))
	{
		return fallback;
	}

	return Math.min(Math.max(0, value), upperBound);
}

/**
 * The same as `pickNumber` for a field where zero is not a usable value but a
 * broken one. Clamping a negative `maxDelay` to zero would cap every pause at
 * zero and run the retries back to back — the flood the jitter exists to
 * prevent — so a non-positive value falls back to the default instead.
 */
function pickPositiveNumber(value: unknown, fallback: number): number
{
	if (!Type.isNumber(value) || !Number.isFinite(value) || value <= 0)
	{
		return fallback;
	}

	return value;
}

function pickBoolean(value: unknown, fallback: boolean): boolean
{
	return Type.isBoolean(value) ? value : fallback;
}

/**
 * Turns the retry config of a request into a full set of values. The config
 * arrives already merged level by level (instance -> call), so normalization
 * only applies the defaults and never merges anything itself.
 */
export function normalizeRetryPolicy(config: RetryConfig | undefined): NormalizedRetryPolicy
{
	if (!Type.isPlainObject(config))
	{
		return { ...defaultPolicy };
	}

	return {
		retries: pickNumber(config.retries, defaultPolicy.retries, maxRetries),
		idempotent: pickBoolean(config.idempotent, defaultPolicy.idempotent),
		delay: pickNumber(config.delay, defaultPolicy.delay),
		maxDelay: pickPositiveNumber(config.maxDelay, defaultPolicy.maxDelay),
		respectRetryAfter: pickBoolean(config.respectRetryAfter, defaultPolicy.respectRetryAfter),
		totalTimeout: pickNumber(config.totalTimeout, defaultPolicy.totalTimeout),
	};
}

/**
 * The built-in eligibility predicate: the error is retryable when the response
 * was never received or the server declared the failure temporary.
 *
 * It answers that question alone. The invariants of the layer — the caller
 * abort, a non-reusable body, the attempt and time budgets — are checked by the
 * retry loop before the predicate, so an own predicate cannot override them.
 * A native AbortError never reaches the classifier for the same reason.
 */
export function isRetryableError(context: RetryContext): boolean
{
	const { error } = context;

	if (error instanceof NetworkError)
	{
		return true;
	}

	if (error instanceof TimeoutError)
	{
		return true;
	}

	if (error instanceof HttpError)
	{
		return retryableStatuses.has(error.status);
	}

	// ControllerError, ParseError, AssetLoadError, TypeError and everything else
	return false;
}
