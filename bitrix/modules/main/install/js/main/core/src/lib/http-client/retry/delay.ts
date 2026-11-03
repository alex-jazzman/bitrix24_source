import Type from '../../type';
import { HttpError } from '../errors';
import type { RetryContext } from '../types';

const secondsPattern = /^\d+$/;

function parseRetryAfter(value: string, now: number): number | null
{
	const header = value.trim();
	if (header === '')
	{
		return null;
	}

	if (secondsPattern.test(header))
	{
		return Number(header) * 1000;
	}

	const date = Date.parse(header);
	if (Number.isNaN(date))
	{
		return null;
	}

	// the http-date form names a point in time, so a moment already in the past
	// means "retry now", not a negative pause
	return Math.max(0, date - now);
}

function getRetryAfter(error: unknown): number | null
{
	if (!(error instanceof HttpError))
	{
		return null;
	}

	const header = error.response?.headers?.get('Retry-After') ?? null;

	return Type.isString(header) ? parseRetryAfter(header, Date.now()) : null;
}

/**
 * The pause before the next attempt: the server directive when the response
 * carries a parsable `Retry-After` and the policy honors it, otherwise an
 * exponential backoff from the base pause with full jitter.
 *
 * The jitter is not switchable: without it every tab that got the same 503
 * retries at the same moment and finishes off the backend that is already
 * recovering. The cap applies to the server directive as well — a server may
 * ask to wait, but may not occupy the tab for an hour.
 */
export function calculateDelay(context: RetryContext): number
{
	const { error, policy, retryCount } = context;

	if (policy.respectRetryAfter)
	{
		const retryAfter = getRetryAfter(error);
		if (!Type.isNull(retryAfter))
		{
			return Math.min(retryAfter, policy.maxDelay);
		}
	}

	const exponential = policy.delay * (2 ** retryCount);

	return Math.round(Math.random() * Math.min(exponential, policy.maxDelay));
}
