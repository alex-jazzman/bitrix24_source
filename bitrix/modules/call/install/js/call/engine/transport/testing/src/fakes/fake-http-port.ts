import { err } from 'call.engine.transport';
import type { Cancelled, HttpPort, HttpRequest, HttpResponse, Result } from 'call.engine.transport';

/**
 * Programmable channel of requests by absolute URL. It answers with the fixtures a test programmed -
 * the body stays a string, exactly as the port promises, so a consumer keeps parsing it itself.
 *
 * A status outside 2xx is still an answer and comes back as `Ok`; only having no answer at all is an
 * `Err`. A request carrying an already aborted signal is cancelled before any fixture is taken: the
 * request is recorded, and the programmed answer stays for the next call.
 *
 * A call nobody programmed throws instead of answering - see `FakeRestPort` for the reasoning.
 */
export class FakeHttpPort implements HttpPort
{
	#requests: HttpRequest[] = [];
	#standing: Result<HttpResponse> | undefined = undefined;
	#queued: Result<HttpResponse>[] = [];

	/** Builds a fixture answer with `ok` derived from the status, so a 5xx cannot claim success. */
	static response(status: number, body: string): HttpResponse
	{
		return { status, ok: status >= 200 && status < 300, body };
	}

	async request(request: HttpRequest): Promise<Result<HttpResponse>>
	{
		this.#requests.push(request);

		if (request.signal?.aborted === true)
		{
			const cancelled: Cancelled = { kind: 'cancelled' };

			return err(cancelled);
		}

		const result = this.#queued.shift() ?? this.#standing;

		if (result === undefined)
		{
			throw new Error(`FakeHttpPort: no result programmed for ${request.method} ${request.url}`);
		}

		return result;
	}

	/** The answer to every request, taken once the queue has run out. */
	setResult(result: Result<HttpResponse>): void
	{
		this.#standing = result;
	}

	/** The answer to the next request, ahead of the standing one: a sequence, a retry after a 5xx. */
	queueResult(result: Result<HttpResponse>): void
	{
		this.#queued.push(result);
	}

	getRequests(): HttpRequest[]
	{
		return [...this.#requests];
	}
}
