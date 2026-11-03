import type { Result } from '../error/result';

/** Methods a request by absolute URL needs here; widen it when a consumer needs more. */
export type HttpMethod = 'GET' | 'POST';

/**
 * Request by an absolute URL - the case `RestPort` deliberately does not cover. `signal` is injected
 * rather than created inside: the port owns no cancellation of its own, so whoever started the
 * operation aborts it, and an abort comes back as the `Cancelled` variant.
 */
export type HttpRequest = {
	url: string,
	method: HttpMethod,
	headers?: { [name: string]: string },
	body?: string,
	signal?: AbortSignal,
};

/**
 * Raw answer, mirroring the primitive one to one. The body stays a string: deciding that it holds
 * JSON, and what a status outside 2xx means, belongs to the caller and not to the port.
 */
export type HttpResponse = {
	status: number,
	ok: boolean,
	body: string,
};

export interface HttpPort
{
	/**
	 * An answer that arrived is `Ok` whatever its status - a 4xx or a 5xx is an answer, not a
	 * transport failure. `Err` covers having no answer at all: the request never reached the
	 * endpoint, ran out of time, or was aborted through the signal.
	 */
	request(request: HttpRequest): Promise<Result<HttpResponse>>;
}
