import Type from '../type';
import { ActionRunner } from './controller/action-runner';
import { portalHeaderNames } from './controller/internal/portal-headers';
import { isSameOrigin } from './controller/internal/same-origin';
import {
	AssetLoadError,
	ControllerError,
	HttpClientError,
	HttpError,
	NetworkError,
	ParseError,
	TimeoutError,
} from './errors';
import { isAjaxEnvelope, parseEnvelope } from './controller/envelope';
import { withCrossTabLock } from './cross-tab-lock';
import { InterceptorChain } from './interceptor-chain';
import { mergeConfig } from './merge-config';
import { normalizeRetryPolicy } from './retry/policy';
import { runWithRetry } from './retry/run-with-retry';
import { getBodyContentType, prepareBody, serializeQuery } from './serialize';
import type {
	ActionOptions,
	AjaxEnvelope,
	BodylessRequestConfig,
	BodyRequestConfig,
	ClientConfig,
	EffectiveRequestConfig,
	HttpClientInterceptors,
	HttpMethod,
	HttpResponse,
	HttpResponseType,
	QueryParams,
	RequestBody,
	RequestConfig,
	RetryConfig,
} from './types';

type TimeoutController = {
	signal: AbortSignal;
	cancel: () => void;
};

type PreparedRequest = {
	url: string;
	init: RequestInit;
	responseType: HttpResponseType;
	timeout: number;
	timeoutController: TimeoutController | null;
	userSignal: AbortSignal | null;
	cleanupSignals: () => void;
};

type CombinedSignal = {
	signal: AbortSignal | null;
	cleanup: () => void;
};

function createTimeoutSignal(timeout: number): TimeoutController
{
	if (Type.isFunction(AbortSignal.timeout))
	{
		return {
			signal: AbortSignal.timeout(timeout),
			cancel: () => {},
		};
	}

	const controller = new AbortController();
	const timer = window.setTimeout(() => {
		controller.abort(new DOMException(`The operation timed out after ${timeout}ms`, 'TimeoutError'));
	}, timeout);

	return {
		signal: controller.signal,
		cancel: () => window.clearTimeout(timer),
	};
}

function combineSignals(signals: AbortSignal[]): CombinedSignal
{
	if (signals.length === 0)
	{
		return { signal: null, cleanup: () => {} };
	}

	if (signals.length === 1)
	{
		return { signal: signals[0], cleanup: () => {} };
	}

	if (Type.isFunction(AbortSignal.any))
	{
		return { signal: AbortSignal.any(signals), cleanup: () => {} };
	}

	// the fallback listeners must be removed via `cleanup` when the request settles:
	// otherwise every request would leave one more listener on a long-living caller signal
	const controller = new AbortController();
	const subscriptions: Array<() => void> = [];
	signals.forEach((signal) => {
		if (controller.signal.aborted)
		{
			return;
		}

		if (signal.aborted)
		{
			controller.abort(signal.reason);

			return;
		}

		const listener = () => controller.abort(signal.reason);
		signal.addEventListener('abort', listener, { once: true });
		subscriptions.push(() => signal.removeEventListener('abort', listener));
	});

	return {
		signal: controller.signal,
		cleanup: () => subscriptions.forEach((unsubscribe) => unsubscribe()),
	};
}

function buildUrl(url: string, baseUrl: string | undefined, query: QueryParams | undefined): string
{
	const base = new URL(baseUrl ?? '', window.location.href);
	const target = new URL(url, base);
	const queryString = serializeQuery(query);
	if (queryString !== '')
	{
		target.search = target.search === '' ? queryString : `${target.search.slice(1)}&${queryString}`;
	}

	return target.toString();
}

function mergeHeaders(...inits: Array<HeadersInit | undefined>): Headers
{
	const result = new Headers();
	inits.forEach((init) => {
		if (Type.isNil(init))
		{
			return;
		}

		new Headers(init).forEach((value, name) => {
			result.set(name, value);
		});
	});

	return result;
}

/**
 * Strips the `idempotent` statement from the instance defaults, so it can only
 * ever arrive with a single call.
 *
 * The statement means "I checked, this call is safe to perform twice". An
 * instance cannot make it: it does not know which of the calls going through it
 * write, and the ones written after it are not there to be checked at all.
 * Inherited, `idempotent: true` would turn every POST of the instance into a
 * retryable one — exactly the mistake that duplicates an operation.
 *
 * The field is dropped once, at construction time, rather than at every merge:
 * from there on nothing downstream — neither the raw methods nor the action
 * runner, which rebuilds its request config from the action options — can see a
 * value that never entered the instance config. Per-field merging of the rest of
 * the policy stays untouched.
 *
 * `ClientConfig` excludes the field by type, so a typed caller is stopped by the
 * compiler; this covers the untyped one and reports the ignored setting instead
 * of silently swallowing it.
 */
function dropInstanceIdempotent(config: ClientConfig): void
{
	const retry = config.retry as RetryConfig | undefined;
	if (!Type.isPlainObject(retry) || Type.isUndefined(retry.idempotent))
	{
		return;
	}

	delete retry.idempotent;
	console.error(
		'main.core HttpClient: {retry.idempotent} of the instance config is ignored — '
		+ 'the statement that a call is safe to repeat belongs to that call, '
		+ 'declare it in the request config or the action options.',
	);
}

/**
 * The public http client of the core: a typed transport over `fetch` (raw
 * `request`/`get`/`post`/... methods) and the Engine controllers actions
 * (`action`/`actionRaw`) sharing one per-instance interceptor level.
 *
 * The raw methods are a pure transport that knows nothing about the ajax
 * envelope, sessid and other portal semantics. The action path adds the Engine
 * mechanics (portal headers on same-origin, the CSRF retry, the asset pipeline,
 * the two-level error model) as an internal detail. User interceptors run on
 * both paths over the effective request config (the instance defaults already
 * merged in); the built-in Engine steps are internal and stay out of them.
 *
 * One security invariant is enforced by the transport itself for every request
 * of every instance: the portal headers (the CSRF token, `Bx-ajax` and the site
 * id) never cross the origin — neither by a direct request nor over a redirect.
 * They are removed from the final header set of any cross-origin request —
 * whether they came from the request config, the instance `headers` or an
 * interceptor — and a request that still carries at least one of them is sent
 * with `redirect: 'error'`, so a redirecting endpoint cannot forward them to
 * another origin. Sending them to a foreign origin explicitly is not possible
 * by design.
 *
 * The static `request`/`get`/.../`action`/`actionRaw` methods and `interceptors`
 * delegate to a lazy default instance preconfigured for the current portal.
 */
export class HttpClient
{
	static #defaultInstance: HttpClient | null = null;

	/**
	 * The rest of the contract is exposed on the client itself, so a consumer
	 * reaching the global `BX.HttpClient` gets the error classes and the
	 * envelope helpers with it, instead of eight bare names in the shared `BX`
	 * root. The static request API is verbs (`request`, `get`, `action`, ...),
	 * these are nouns, so the two never collide.
	 */
	static readonly HttpClientError: typeof HttpClientError = HttpClientError;
	static readonly HttpError: typeof HttpError = HttpError;
	static readonly NetworkError: typeof NetworkError = NetworkError;
	static readonly TimeoutError: typeof TimeoutError = TimeoutError;
	static readonly ParseError: typeof ParseError = ParseError;
	static readonly ControllerError: typeof ControllerError = ControllerError;
	static readonly AssetLoadError: typeof AssetLoadError = AssetLoadError;
	static readonly isAjaxEnvelope: typeof isAjaxEnvelope = isAjaxEnvelope;
	static readonly parseEnvelope: typeof parseEnvelope = parseEnvelope;

	#config: ClientConfig;
	#requestInterceptors: InterceptorChain<EffectiveRequestConfig>;
	#responseInterceptors: InterceptorChain<HttpResponse>;
	#actionRunner: ActionRunner | null = null;

	/**
	 * Per-instance interceptors. Request handlers run in registration order
	 * before fetch and receive the effective config: the instance defaults are
	 * already merged in and the headers of both levels are flattened into one
	 * `Headers` copy, so a handler sees the request as it will be sent and may
	 * replace any part of it — including deleting an instance-level default
	 * header. Response handlers run after and may replace the response, recover
	 * from an error or rethrow it. They see both the raw requests and the
	 * action ones.
	 */
	readonly interceptors: HttpClientInterceptors;

	constructor(config: ClientConfig = {})
	{
		this.#config = mergeConfig<ClientConfig>(config);
		dropInstanceIdempotent(this.#config);
		this.#requestInterceptors = new InterceptorChain<EffectiveRequestConfig>();
		this.#responseInterceptors = new InterceptorChain<HttpResponse>();
		this.interceptors = {
			request: this.#requestInterceptors,
			response: this.#responseInterceptors,
		};
	}

	request<T = unknown>(config: RequestConfig): Promise<HttpResponse<T>>
	{
		// the chain runs over the effective config (a fresh merged object), so an
		// interceptor controls the request as it will be sent and a mutating
		// handler cannot corrupt the caller's config object
		const response = this.#requestInterceptors
			.run(this.#mergeRequestConfig(config))
			// the cross-tab wait wraps the whole retry cycle, not the network call inside
			// it: `#prepareRequest` arms the timeout, so waiting in the queue any deeper
			// would spend the budget the caller reserved for the network exchange, and a
			// single lock over the cycle keeps the retries of one leader invisible to the
			// tabs waiting on its result
			.then((finalConfig) => withCrossTabLock<T>(
				{
					key: finalConfig.crossTabLockKey,
					// without an explicit value the guard follows the request timeout and
					// stays off when the caller set none: the mechanism adds no deadline
					// of its own
					guardTimeout: finalConfig.crossTabLockTimeout ?? finalConfig.timeout ?? 0,
					responseType: finalConfig.responseType,
				},
				() => this.#runRequest<T>(finalConfig),
				finalConfig.signal ?? null,
			));

		return this.#responseInterceptors.run(response) as Promise<HttpResponse<T>>;
	}

	get<T = unknown>(url: string, config: BodylessRequestConfig = {}): Promise<HttpResponse<T>>
	{
		return this.request<T>({ ...config, url, method: 'GET' });
	}

	delete<T = unknown>(url: string, config: BodylessRequestConfig = {}): Promise<HttpResponse<T>>
	{
		return this.request<T>({ ...config, url, method: 'DELETE' });
	}

	head<T = unknown>(url: string, config: BodylessRequestConfig = {}): Promise<HttpResponse<T>>
	{
		return this.request<T>({ ...config, url, method: 'HEAD' });
	}

	post<T = unknown>(
		url: string,
		body: RequestBody = null,
		config: BodyRequestConfig = {},
	): Promise<HttpResponse<T>>
	{
		return this.request<T>({ ...config, url, body, method: 'POST' });
	}

	put<T = unknown>(
		url: string,
		body: RequestBody = null,
		config: BodyRequestConfig = {},
	): Promise<HttpResponse<T>>
	{
		return this.request<T>({ ...config, url, body, method: 'PUT' });
	}

	patch<T = unknown>(
		url: string,
		body: RequestBody = null,
		config: BodyRequestConfig = {},
	): Promise<HttpResponse<T>>
	{
		return this.request<T>({ ...config, url, body, method: 'PATCH' });
	}

	/**
	 * Calls an Engine controller action and resolves with the `data` payload
	 * of the envelope (`null` for an action that returns no data). Any other
	 * outcome rejects with a typed error. The action url is built from
	 * `controllerEndpoint` and `baseUrl` is ignored.
	 */
	async action<T = unknown>(name: string, options: ActionOptions = {}): Promise<T | null>
	{
		const envelope = await this.#getActionRunner().run<T>(name, options);

		return envelope.data;
	}

	/**
	 * Calls an Engine controller action and resolves with the whole envelope
	 * (`{status, data, errors}`) when its status is `success`. Errors are
	 * identical to `action()`.
	 */
	async actionRaw<T = unknown>(name: string, options: ActionOptions = {}): Promise<AjaxEnvelope<T>>
	{
		return this.#getActionRunner().run<T>(name, options);
	}

	/**
	 * Interceptors of the lazy default instance. They affect the static calls
	 * and never the instances created with `new HttpClient()`.
	 */
	static get interceptors(): HttpClientInterceptors
	{
		return HttpClient.#getDefaultInstance().interceptors;
	}

	static request<T = unknown>(config: RequestConfig): Promise<HttpResponse<T>>
	{
		return HttpClient.#getDefaultInstance().request<T>(config);
	}

	static get<T = unknown>(url: string, config?: BodylessRequestConfig): Promise<HttpResponse<T>>
	{
		return HttpClient.#getDefaultInstance().get<T>(url, config);
	}

	static delete<T = unknown>(url: string, config?: BodylessRequestConfig): Promise<HttpResponse<T>>
	{
		return HttpClient.#getDefaultInstance().delete<T>(url, config);
	}

	static head<T = unknown>(url: string, config?: BodylessRequestConfig): Promise<HttpResponse<T>>
	{
		return HttpClient.#getDefaultInstance().head<T>(url, config);
	}

	static post<T = unknown>(
		url: string,
		body?: RequestBody,
		config?: BodyRequestConfig,
	): Promise<HttpResponse<T>>
	{
		return HttpClient.#getDefaultInstance().post<T>(url, body, config);
	}

	static put<T = unknown>(
		url: string,
		body?: RequestBody,
		config?: BodyRequestConfig,
	): Promise<HttpResponse<T>>
	{
		return HttpClient.#getDefaultInstance().put<T>(url, body, config);
	}

	static patch<T = unknown>(
		url: string,
		body?: RequestBody,
		config?: BodyRequestConfig,
	): Promise<HttpResponse<T>>
	{
		return HttpClient.#getDefaultInstance().patch<T>(url, body, config);
	}

	static action<T = unknown>(name: string, options?: ActionOptions): Promise<T | null>
	{
		return HttpClient.#getDefaultInstance().action<T>(name, options);
	}

	static actionRaw<T = unknown>(name: string, options?: ActionOptions): Promise<AjaxEnvelope<T>>
	{
		return HttpClient.#getDefaultInstance().actionRaw<T>(name, options);
	}

	/**
	 * The lazy default instance shared by the static methods: preconfigured for
	 * the current portal and created only on the first static access (never at
	 * module import time, so it does not depend on the bundle init order).
	 */
	static #getDefaultInstance(): HttpClient
	{
		HttpClient.#defaultInstance ??= new HttpClient();

		return HttpClient.#defaultInstance;
	}

	#getActionRunner(): ActionRunner
	{
		// created on the first action call: the runner is a shared internal
		// detail of every action of this instance
		this.#actionRunner ??= new ActionRunner(this, this.#config);

		return this.#actionRunner;
	}

	/**
	 * Builds the effective config of one request: the instance defaults are
	 * deep-merged with the call config into a fresh object and the headers of
	 * both levels are flattened into a single `Headers` copy. The `body` and
	 * `json` payloads are passed by reference: they have no instance-level
	 * defaults to merge with and must not be cloned on every request.
	 *
	 * The `Content-Type` of the payload is derived here rather than in
	 * `#prepareRequest`, so the chain sees the header set the request will be sent
	 * with and a handler can drop the derived value, not only override it. The
	 * header is not recomputed after the chain: a handler that replaces the body
	 * with another payload type owns the matching `Content-Type` as well.
	 * Deriving the type does not serialize the payload — that happens once in
	 * `#prepareRequest`, over the body the chain finally settled on.
	 */
	#mergeRequestConfig(config: RequestConfig): EffectiveRequestConfig
	{
		const merged = mergeConfig<EffectiveRequestConfig>(this.#config, {
			...config,
			headers: undefined,
			body: undefined,
			json: undefined,
		});

		merged.headers = mergeHeaders(this.#config.headers, config.headers);
		if (!Type.isUndefined(config.body))
		{
			merged.body = config.body;
		}

		if (!Type.isUndefined(config.json))
		{
			merged.json = config.json;
		}

		// the payload content type belongs to the effective config too: derived here,
		// it stays visible to the chain and a handler can drop it, not only override it.
		// Only the type is derived — the payload itself is serialized once, after the
		// chain, when the final body is known
		const contentType = getBodyContentType(merged.body, merged.json);
		if (!Type.isNull(contentType) && !merged.headers.has('Content-Type'))
		{
			merged.headers.set('Content-Type', contentType);
		}

		return merged;
	}

	/**
	 * The single place the wrappers around the sending point are composed in.
	 * The config arrives final here — the request chain has already run — so
	 * everything a wrapper needs is read from it once, and `request()` stays a
	 * single line whatever the composition grows into.
	 *
	 * The retry loop wraps `#execute` rather than the network call inside it:
	 * every attempt goes through `#prepareRequest` again, so the body is
	 * serialized anew, the portal-header guard runs on the final url of that
	 * attempt and `timeout` keeps its meaning of a limit of one attempt.
	 *
	 * The order of nesting is a decision of its own (ADR § 3): an outer wrapper
	 * that serializes the request across tabs belongs around the retry loop, so
	 * one series of retries runs under a lock taken once — not one series per
	 * waiting tab.
	 */
	#runRequest<T>(config: EffectiveRequestConfig): Promise<HttpResponse<T>>
	{
		const retry = config.retry;
		if (Type.isNil(retry))
		{
			// a request of an unconfigured client reaches the transport exactly as it did
			// before the loop existed: not even the policy object is built for it
			return this.#execute<T>(config);
		}

		const method = (config.method ?? 'GET').toUpperCase() as HttpMethod;

		return runWithRetry<HttpResponse<T>>(
			{
				policy: normalizeRetryPolicy(retry),
				strategies: {
					shouldRetry: retry.shouldRetry,
					calculateDelay: retry.calculateDelay,
					onRetry: retry.onRetry,
				},
				method,
				config,
				userSignal: config.signal ?? null,
				spentRetries: config.spentRetries,
				startedAt: config.startedAt,
				publishRetryCount: (result, retryCount) => {
					// the successful counterpart of the counter the loop stamps on an
					// error: without it the action path cannot tell how much of the
					// budget a send that ended with an `invalid_csrf` envelope spent
					// eslint-disable-next-line no-param-reassign
					result.retryCount = retryCount;
				},
			},
			() => this.#execute<T>(config),
		);
	}

	async #execute<T>(config: EffectiveRequestConfig): Promise<HttpResponse<T>>
	{
		const prepared = this.#prepareRequest(config);

		try
		{
			// the timeout and abort signals cover the whole request cycle: reading the
			// body of a streamed response can hang as long as waiting for the headers,
			// so the fallback timer stays armed until the response is fully built and
			// every failure of the cycle goes through the same transport error mapping
			const response = await fetch(prepared.url, prepared.init);

			return await this.#buildResponse<T>(response, prepared.responseType);
		}
		catch (error)
		{
			throw this.#mapFetchError(error, prepared);
		}
		finally
		{
			prepared.timeoutController?.cancel();
			prepared.cleanupSignals();
		}
	}

	#prepareRequest(merged: EffectiveRequestConfig): PreparedRequest
	{
		// the config arrives effective (see #mergeRequestConfig) and final: the
		// interceptor chain has already run and no header is added after it, the
		// cross-origin guard below only removes
		const method = merged.method ?? 'GET';
		if (['GET', 'HEAD'].includes(method.toUpperCase()) && (!Type.isNil(merged.body) || !Type.isUndefined(merged.json)))
		{
			// fetch would reject this with an obscure network-level TypeError; fail fast with a clear one
			throw new TypeError(`main.core HttpClient: a ${method.toUpperCase()} request cannot have a body.`);
		}

		const url = buildUrl(merged.url, merged.baseUrl, merged.query);
		// a fresh copy: the origin guard below must not mutate the object the chain
		// saw; it also normalizes a plain-object headers returned by an interceptor
		const headers = mergeHeaders(merged.headers);
		if (!isSameOrigin(url))
		{
			// the security invariant "the portal headers never cross the origin" is
			// enforced here, on the final url and the final header set: however the
			// request was assembled (a raw call, an action, an interceptor rewrite or
			// the instance defaults), a cross-origin request never carries these headers
			portalHeaderNames.forEach((name) => headers.delete(name));
		}

		// the content type is already part of the effective config, so the header set
		// is final here: a handler that dropped it keeps it dropped
		const prepared = prepareBody(merged.body, merged.json);

		const userSignal = merged.signal ?? null;
		const timeout = merged.timeout ?? 0;
		const signals: AbortSignal[] = [];
		if (!Type.isNull(userSignal))
		{
			signals.push(userSignal);
		}

		let timeoutController: TimeoutController | null = null;
		if (timeout > 0)
		{
			timeoutController = createTimeoutSignal(timeout);
			signals.push(timeoutController.signal);
		}

		// the second half of the same invariant: a request that still carries at least
		// one portal header must never follow a redirect — a same-origin endpoint
		// answering with a cross-origin redirect would otherwise deliver the headers
		// to the redirect target. The caller's `redirect` is honored only when the
		// final header set carries no portal headers
		const carriesPortalHeaders = portalHeaderNames.some((name) => headers.has(name));

		const combinedSignal = combineSignals(signals);
		const init: RequestInit = {
			method,
			headers,
			body: prepared.body,
			signal: combinedSignal.signal,
			credentials: 'same-origin',
			redirect: carriesPortalHeaders ? 'error' : (merged.redirect ?? 'follow'),
		};

		return {
			url,
			init,
			responseType: merged.responseType ?? 'json',
			timeout,
			timeoutController,
			userSignal,
			cleanupSignals: combinedSignal.cleanup,
		};
	}

	#mapFetchError(error: unknown, prepared: PreparedRequest): unknown
	{
		if (prepared.userSignal?.aborted)
		{
			// the caller's own abort: rethrow the native AbortError as is
			return error;
		}

		if (prepared.timeoutController?.signal.aborted)
		{
			return new TimeoutError({
				url: prepared.url,
				timeout: prepared.timeout,
				cause: error,
			});
		}

		if (error instanceof TypeError)
		{
			return new NetworkError({ url: prepared.url, cause: error });
		}

		return error;
	}

	async #buildResponse<T>(response: Response, responseType: HttpResponseType): Promise<HttpResponse<T>>
	{
		const data = await this.#parseResponse<T>(response, responseType);
		const result: HttpResponse<T> = {
			status: response.status,
			ok: response.ok,
			headers: response.headers,
			data,
			raw: response,
			// one attempt knows nothing about the series it belongs to: the retry
			// loop stamps the real number on the response it hands out
			retryCount: 0,
		};

		if (!response.ok)
		{
			throw new HttpError<T>(response.status, result);
		}

		return result;
	}

	async #parseResponse<T>(response: Response, responseType: HttpResponseType): Promise<T | null>
	{
		try
		{
			if (responseType === 'text')
			{
				return await response.text() as T;
			}

			if (responseType === 'blob')
			{
				return await response.blob() as T;
			}

			if (responseType === 'formData')
			{
				return await response.formData() as T;
			}

			const text = await response.text();

			return (text === '' ? null : JSON.parse(text)) as T | null;
		}
		catch (error)
		{
			if (error instanceof DOMException && ['AbortError', 'TimeoutError'].includes(error.name))
			{
				// the body reading was interrupted by an abort or by the timeout, not by
				// a malformed body: the error belongs to the transport error mapping
				throw error;
			}

			if (response.ok)
			{
				throw new ParseError({
					url: response.url,
					responseType,
					cause: error,
				});
			}

			// a non-2xx response is reported as HttpError even if its body is not parsable
			return null;
		}
	}
}
