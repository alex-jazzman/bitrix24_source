export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export type HttpResponseType = 'json' | 'text' | 'blob' | 'formData';

/** Kind of an asset delivered with an action response. */
export type AssetType = 'css' | 'js';

export type QueryParams = Record<string, unknown>;

export type RequestBody = BodyInit | Record<string, unknown> | null;

export type ClientConfig = {
	baseUrl?: string;
	headers?: HeadersInit;
	/** Timeout in milliseconds, 0 means no timeout. */
	timeout?: number;
	query?: QueryParams;
	/**
	 * Endpoint of the Engine controllers used by `action`/`actionRaw`,
	 * default `/bitrix/services/main/ajax.php`. The action path builds its url
	 * from this endpoint and ignores `baseUrl`.
	 */
	controllerEndpoint?: string;
	/**
	 * Instance-level defaults of the retry policy. `idempotent` is excluded on
	 * purpose: it is a statement about the server semantics of one particular
	 * call, and an instance cannot make it for the calls not yet written.
	 */
	retry?: InstanceRetryConfig;
};

export type RequestConfig = {
	url: string;
	method?: HttpMethod;
	query?: QueryParams;
	body?: RequestBody;
	json?: unknown;
	headers?: HeadersInit;
	/** Timeout in milliseconds, 0 means no timeout. */
	timeout?: number;
	signal?: AbortSignal;
	responseType?: HttpResponseType;
	/**
	 * Name the tabs of this origin coordinate by: concurrent requests carrying
	 * the same name are serialized, one tab goes to the network and the others
	 * resolve with a snapshot of its result. An empty string or a non-string is
	 * treated as "no key", so a call can always opt out of an instance default.
	 *
	 * Requires `navigator.locks`, available in a secure context only; without it
	 * the key is ignored and the request is sent as usual: no error, no log.
	 * Ignored with `responseType: 'formData'` as well: such a body is not
	 * reliably transferable between tabs.
	 *
	 * Serialization only: nothing is cached, a call arriving after the leader
	 * has settled opens a new window and performs its own request.
	 */
	crossTabLockKey?: string;
	/**
	 * Upper bound in milliseconds for how long a waiting tab stays in the queue
	 * before its call is rejected with a `TimeoutError`. `0` disables the guard.
	 * Applies together with `crossTabLockKey` only; defaults to `timeout` when
	 * that one is set, so the mechanism adds no limit the caller did not ask for.
	 *
	 * The two budgets are consecutive, not shared: the request timeout is armed
	 * after the lock is acquired, so waiting out this bound and then leading the
	 * request can take up to both of them. Set it explicitly to cap the total.
	 */
	crossTabLockTimeout?: number;
	/**
	 * Redirect handling passed to `fetch`, default `follow`. Honored only when
	 * the final header set carries no portal headers: any request with at least
	 * one of them (every same-origin action, a raw request with an explicitly
	 * set portal header) is forced to `error`, so a redirected endpoint never
	 * carries the portal headers to the redirect target.
	 */
	redirect?: RequestRedirect;
	retry?: RetryConfig;
};

/**
 * Request config for the bodyless helpers (`get`, `delete`, `head`):
 * `body` and `json` are excluded because a GET/HEAD request cannot carry a body.
 */
export type BodylessRequestConfig = Omit<RequestConfig, 'url' | 'method' | 'body' | 'json'>;

/**
 * Request config for the helpers that take a body (`post`, `put`, `patch`):
 * `body` is excluded because it is passed as their own argument. `json` stays
 * available — it is how these helpers send a json payload.
 */
export type BodyRequestConfig = Omit<RequestConfig, 'url' | 'method' | 'body'>;

/**
 * The effective config of one request: the instance defaults already merged
 * with the call config, the headers of both levels flattened into a single
 * `Headers` copy. This is what the request interceptors receive, so a handler
 * sees the request as it will be sent and may drop an instance-level default.
 *
 * `headers` is always a `Headers` instance here, never a bare `HeadersInit`.
 * `controllerEndpoint` of the instance config is not part of it: the action
 * endpoint is fixed when the runner is created and a later rewrite would have
 * no effect.
 */
export type EffectiveRequestConfig = Omit<RequestConfig, 'headers'> & {
	headers: Headers;
	baseUrl?: string;
	query?: QueryParams;
	/**
	 * Internal: retries the operation has already spent before this request was
	 * built. Only the action path sets it — a request re-sent with a fresh CSRF
	 * token is the same operation as the one that asked for the token, so it
	 * continues the retry series instead of opening a budget of its own. It is
	 * not part of the public `RequestConfig`: a caller has no operation to
	 * continue.
	 */
	spentRetries?: number;
	/**
	 * Internal, the time counterpart of `spentRetries`: when the operation this
	 * request continues started, in `Date.now()` terms. Set on the same path and
	 * for the same reason — so a CSRF re-send measures `totalTimeout` from the
	 * start of the operation instead of granting it a second full budget.
	 */
	startedAt?: number;
};

/**
 * The transport response: `data` is the body parsed according to the request
 * `responseType`. It is `null` when a 2xx json body is empty and when the body
 * of a non-2xx response cannot be parsed at all.
 */
export type HttpResponse<T = unknown> = {
	status: number;
	ok: boolean;
	headers: Headers;
	data: T | null;
	/**
	 * The native `Response` for its metadata only (`url`, `redirected`, `type`,
	 * `status`). Its body is already consumed to build `data`, so any body
	 * reader of it (`json()`, `text()`, ...) throws "body stream already read".
	 */
	raw: Response;
	/**
	 * How many retries the operation spent before this response arrived, `0`
	 * when it came from the first attempt. It is the successful counterpart of
	 * `HttpClientError.retryCount`: an outcome of the layer always reports the
	 * retries behind it, whichever way it ended.
	 */
	retryCount: number;
};

export type InterceptorHandler<T> = (value: T) => T | Promise<T>;

export type InterceptorErrorHandler<T> = (error: unknown) => T | Promise<T>;

export interface InterceptorChain<T>
{
	use(onFulfilled: InterceptorHandler<T>, onRejected?: InterceptorErrorHandler<T>): number;
	eject(id: number): void;
}

export type HttpClientInterceptors = {
	request: InterceptorChain<EffectiveRequestConfig>;
	response: InterceptorChain<HttpResponse>;
};

export type AjaxEnvelopeStatus = 'success' | 'denied' | 'error';

export type AjaxEnvelopeError = {
	code: string | number;
	message: string;
	customData?: unknown;
};

export type AjaxEnvelope<T = unknown> = {
	status: AjaxEnvelopeStatus;
	data: T | null;
	errors: AjaxEnvelopeError[];
};

export type AjaxNavigation = {
	page?: number;
	size?: number;
};

export type AnalyticsOptions = {
	event: string;
	tool: string;
	category: string;
	c_section?: string;
	c_sub_section?: string;
	c_element?: string;
	type?: string;
	p1?: string;
	p2?: string;
	p3?: string;
	p4?: string;
	p5?: string;
	status?: 'success' | 'error' | 'attempt' | 'cancel';
};

type CommonActionOptions = {
	query?: QueryParams;
	navigation?: AjaxNavigation;
	analytics?: AnalyticsOptions;
	analyticsLabel?: string | Record<string, string>;
	headers?: HeadersInit;
	/** Timeout in milliseconds, 0 means no timeout. */
	timeout?: number;
	signal?: AbortSignal;
	retry?: RetryConfig;
	/**
	 * Name the tabs of this origin coordinate by, see `RequestConfig`. It is a
	 * coordination option only: it never becomes a query parameter or a header
	 * of the action request.
	 */
	crossTabLockKey?: string;
	/**
	 * Upper bound in milliseconds for how long a waiting tab stays in the queue,
	 * see `RequestConfig`.
	 */
	crossTabLockTimeout?: number;
};

/**
 * Options of an action sent with a body: `POST` (the default), `PUT`, `PATCH`
 * or `DELETE`. The payload goes either in `data` (form-urlencoded or `FormData`)
 * or in `json`.
 */
export type ActionOptionsWithBody = CommonActionOptions & {
	method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	data?: Record<string, unknown> | FormData;
	json?: unknown;
};

/**
 * Options of a bodyless action (`GET`, `HEAD`): `data` and `json` are excluded
 * because such a request cannot carry a body — pass the payload in `query`.
 */
export type BodylessActionOptions = CommonActionOptions & {
	method: 'GET' | 'HEAD';
	data?: never;
	json?: never;
};

export type ActionOptions = ActionOptionsWithBody | BodylessActionOptions;

/**
 * The normalized retry policy: every field of `RetryConfig` that carries a
 * default value, with the default already applied. This is what the loop and
 * the strategies read, so neither of them repeats a default of its own.
 */
export type NormalizedRetryPolicy = Required<Omit<RetryConfig, 'shouldRetry' | 'calculateDelay' | 'onRetry'>>;

/**
 * What the retry strategies see: the error of the finished attempt, the place
 * of that attempt in the series and the request it belongs to.
 */
export type RetryContext = {
	/** The error of the attempt, already mapped to the error hierarchy of the layer. */
	error: unknown;
	/** Number of the finished attempt, starting at 1. */
	attempt: number;
	/** How many retries have already been performed (`attempt - 1`). */
	retryCount: number;
	/** The request method in upper case. */
	method: HttpMethod;
	config: EffectiveRequestConfig;
	policy: NormalizedRetryPolicy;
};

/**
 * The retry policy of a request. Every field is optional; the defaults live in
 * a single place — the policy normalization of the retry module. A plain object
 * by contract: `mergeConfig` merges it level by level and passes its functions
 * by reference.
 */
export type RetryConfig = {
	/** Maximum number of retries on top of the first attempt, `0` disables retrying. */
	retries?: number;
	/**
	 * The caller states that the request is safe to perform twice, which allows
	 * a retry for a method outside the safe set. It is a statement about the
	 * server semantics of the call, not a performance setting.
	 */
	idempotent?: boolean;
	/** Base pause in milliseconds the exponential backoff is counted from. */
	delay?: number;
	/** Upper bound of a single pause in milliseconds, it caps `Retry-After` as well. */
	maxDelay?: number;
	/** Honor the `Retry-After` header of the response. */
	respectRetryAfter?: boolean;
	/** Overall budget of the operation in milliseconds including the pauses, `0` means no budget. */
	totalTimeout?: number;
	/** Own predicate of error eligibility, replaces the built-in classifier entirely. */
	shouldRetry?: (context: RetryContext) => boolean;
	/** Own pause calculation in milliseconds, replaces the built-in one entirely. */
	calculateDelay?: (context: RetryContext) => number;
	/** Observer called before every retry, it cannot influence the decision. */
	onRetry?: (context: RetryContext & { delay: number }) => void;
};

/**
 * The retry policy as an instance may declare it: every field of `RetryConfig`
 * except `idempotent`. The statement "this call is safe to perform twice"
 * belongs to a single call and is never inherited from the instance — an
 * instance-wide statement would cover the calls written after it, including the
 * writing ones. The client drops the field at construction time, so an untyped
 * caller gets the same behavior the type forbids.
 */
export type InstanceRetryConfig = Omit<RetryConfig, 'idempotent'>;
