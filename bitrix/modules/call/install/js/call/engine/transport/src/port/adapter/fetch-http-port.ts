import { err, ok } from '../../error/result';
import type { Result } from '../../error/result';
import type { TransportError } from '../../error/transport-error';
import type { HttpPort, HttpRequest, HttpResponse } from '../http-port';

/** What the primitive is given: the part of its init a request of this port actually carries. */
export type FetchRequestInit = {
	method: string,
	headers?: { [name: string]: string },
	body?: string,
	signal?: AbortSignal,
};

/** What the primitive answers, as this adapter reads it: the status and the body as text. */
export type FetchResponsePrimitive = {
	status: number,
	ok: boolean,
	text(): Promise<string>,
};

/**
 * The request primitive itself. Injected rather than taken from the global scope - both so the port
 * is constructible with a stand-in and so the reference cannot lose its receiver: a composition root
 * passes `(url, init) => fetch(url, init)` or an equally bound function.
 */
export type FetchPrimitive = (url: string, init: FetchRequestInit) => Promise<FetchResponsePrimitive>;

/** How the primitive reports an abort through the signal, and an abort that was a deadline. */
const ABORT_ERROR_NAME = 'AbortError';
const TIMEOUT_ERROR_NAME = 'TimeoutError';

/** Empty for a failure that names itself in no readable way; the signal then tells cancellation. */
function readFailureName(failure: unknown): string
{
	if (typeof failure !== 'object' || failure === null)
	{
		return '';
	}

	const { name } = failure as { name?: unknown };

	return typeof name === 'string' ? name : '';
}

function toTransportError(failure: unknown, signal?: AbortSignal): TransportError
{
	const name = readFailureName(failure);

	if (name === ABORT_ERROR_NAME || (name === '' && signal?.aborted === true))
	{
		return { kind: 'cancelled' };
	}

	if (name === TIMEOUT_ERROR_NAME)
	{
		return { kind: 'timeout' };
	}

	return { kind: 'network', cause: failure };
}

/**
 * `HttpPort` over the request primitive: one request by absolute URL, the answer handed over raw.
 *
 * The line it draws is between an answer and no answer, not between a good and a bad one - a 4xx or
 * a 5xx is an answer and comes back as `Ok` with `ok: false`, and what a status means is left to the
 * caller. `Err` is for having nothing to hand over: the request never reached the endpoint, the
 * signal aborted it, or the deadline of that signal ran out. Reading the body is part of the answer
 * arriving - a body that cannot be read is not a partial answer, it is none.
 *
 * Nothing else happens here: the port sets no deadline of its own, retries nothing, and cancels
 * nothing on its own initiative - the signal it aborts on is the one it was given.
 */
export class FetchHttpPort implements HttpPort
{
	#fetch: FetchPrimitive;

	constructor(fetchPrimitive: FetchPrimitive)
	{
		this.#fetch = fetchPrimitive;
	}

	async request(request: HttpRequest): Promise<Result<HttpResponse>>
	{
		try
		{
			const response = await this.#fetch(request.url, {
				method: request.method,
				headers: request.headers,
				body: request.body,
				signal: request.signal,
			});

			return ok({ status: response.status, ok: response.ok, body: await response.text() });
		}
		catch (failure)
		{
			return err(toTransportError(failure, request.signal));
		}
	}
}
