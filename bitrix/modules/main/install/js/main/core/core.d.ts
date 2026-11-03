/* eslint-disable */
interface AdjustData {
	attrs?: Record<string, string>;
	style?: Record<string, string | number>;
	props?: Record<string, unknown>;
	events?: Record<string, EventListenerOrEventListenerObject>;
	dataset?: Record<string, string>;
	children?: string | Array<Node | string>;
	text?: string;
	html?: string;
}

interface CreateOptions extends AdjustData {
	tag?: string;
}

type GlobalEventMap = HTMLElementEventMap & WindowEventMap & DocumentEventMap;

type RegistryEventListener = {
	listener: EventListenerOrEventListenerObject;
	type: string;
};

type CompatibleListener = (...args: any[]) => void;

type ListenerOptions = {
	useGlobalNaming?: boolean;
	compatMode?: boolean;
	cloneData?: boolean;
	thisArg?: any;
};

type CookieOptions = {
	expires?: number | Date | string;
	path?: string;
	domain?: string;
	secure?: boolean;
	samesite?: string;
	[attribute: string]: unknown;
};

interface ExtractAssetsOptions {
	/**
	 * Marks every script as early-run regardless of its attributes. The legacy parser spelled
	 * this `scriptsRunFirst`.
	 */
	readonly runFirst?: boolean;
	/**
	 * Script types left in the markup instead of being collected. A `<script>` of one of these
	 * types is a template or a settings block, not code to run.
	 */
	readonly templateTypes?: ReadonlyArray<string>;
}

interface ExtractedAssets {
	/**
	 * The markup with the collected scripts and stylesheet links taken out of it, and nothing
	 * else changed: what is not removed is returned byte for byte, unlike a parser that rebuilds
	 * the string from a tree. A `<script>` of a template type stays where it is, uncollected,
	 * because its content is markup for the consumer to read rather than code to run.
	 */
	readonly html: string;
	readonly scripts: ReadonlyArray<AssetScript>;
	readonly styles: ReadonlyArray<AssetStyle>;
}

type AssetScript = ExternalScript | InlineScript;

/**
 * An external script: the markup carried a non-empty `src`, and the address is all the parser
 * keeps. A `<script>` whose `src` is empty counts as an inline script, not an external one.
 */
interface ExternalScript {
	readonly isInternal: false;
	readonly src: string;
	readonly runFirst: boolean;
	readonly type: string | null;
}

/**
 * An inline script: the markup carried the code itself.
 */
interface InlineScript {
	readonly isInternal: true;
	readonly text: string;
	readonly runFirst: boolean;
	readonly type: string | null;
}

interface AssetStyle {
	readonly href: string;
	readonly media: string | null;
}

type LoadExtensionResult = Promise<Array<ExtensionExports>>;

type ExtensionExports = {
	[key: string]: any;
};

/**
 * Backing storage for a cache. Values are held as `unknown`; the value type is applied
 * by the cache methods (BaseCache) on the way in and out, not by the storage itself.
 */
interface ICacheStorage {
	size: number;
	get(key: string): unknown;
	set(key: string, value: unknown): void;
	has(key: string): boolean;
	delete(key: string): void;
	keys(): Array<string>;
	values(): Array<unknown>;
}

type ZIndexComponentOptions = {
	alwaysOnTop?: boolean | number;
	overlay?: HTMLElement;
	overlayGap?: number;
	events?: {
		[eventName: string]: (event: BX.BaseEvent) => void;
	};
};

type CollectionsLibrary = {
	OrderedArray: typeof BX.OrderedArray;
	SettingsCollection: typeof BX.SettingsCollection;
	WeakRefMap: typeof BX.WeakRefMap;
};

type EasingOptions = {
	duration?: number;
	start?: Record<string, number>;
	finish?: Record<string, number>;
	transition?: TransitionFunction | 'linear' | 'ease-out-linear' | 'ease-in-out-linear' | 'quad' | 'ease-out-quad' | 'ease-in-out-quad' | 'cubic' | 'ease-out-cubic' | 'ease-in-out-cubic' | 'quart' | 'ease-out-quart' | 'ease-in-out-quart' | 'quint' | 'ease-out-quint' | 'ease-in-out-quint' | 'circ' | 'ease-out-circ' | 'ease-in-out-circ' | 'back' | 'ease-out-back' | 'ease-in-out-back' | 'elasti' | 'ease-out-elasti' | 'ease-in-out-elasti' | 'bounce' | 'ease-out-bounce' | 'ease-in-out-bounce';
	begin?: (state: Record<string, number>) => void;
	step?: (state: Record<string, number>) => void;
	complete?: (state: Record<string, number>) => void;
	progress?: (progress: number) => void;
};

type TransitionFunction = (progress: number) => number;

type LocalStorageOptions = {
	prefix?: string;
};

type JsonValue = string | number | boolean | {
	[x: string]: JsonValue;
} | Array<JsonValue>;

type PageRedirectOptions = {
	replaceHistory?: boolean;
	allowedOrigins?: string[];
	newTab?: boolean;
};

/**
 * The transport response: `data` is the body parsed according to the request
 * `responseType`. It is `null` when a 2xx json body is empty and when the body
 * of a non-2xx response cannot be parsed at all.
 */
type HttpResponse<T = unknown> = {
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

type HttpResponseType = 'json' | 'text' | 'blob' | 'formData';

type AjaxEnvelopeError = {
	code: string | number;
	message: string;
	customData?: unknown;
};

type AjaxEnvelope<T = unknown> = {
	status: AjaxEnvelopeStatus;
	data: T | null;
	errors: AjaxEnvelopeError[];
};

type AjaxEnvelopeStatus = 'success' | 'denied' | 'error';

/** Kind of an asset delivered with an action response. */
type AssetType = 'css' | 'js';

type HttpClientInterceptors = {
	request: InterceptorChain<EffectiveRequestConfig>;
	response: InterceptorChain<HttpResponse>;
};

interface InterceptorChain<T> {
	use(onFulfilled: InterceptorHandler<T>, onRejected?: InterceptorErrorHandler<T>): number;
	eject(id: number): void;
}

type InterceptorHandler<T> = (value: T) => T | Promise<T>;

type InterceptorErrorHandler<T> = (error: unknown) => T | Promise<T>;

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
type EffectiveRequestConfig = Omit<RequestConfig, 'headers'> & {
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

type RequestConfig = {
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

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

type QueryParams = Record<string, unknown>;

type RequestBody = BodyInit | Record<string, unknown> | null;

/**
 * The retry policy of a request. Every field is optional; the defaults live in
 * a single place — the policy normalization of the retry module. A plain object
 * by contract: `mergeConfig` merges it level by level and passes its functions
 * by reference.
 */
type RetryConfig = {
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
	onRetry?: (context: RetryContext & {
		delay: number;
	}) => void;
};

/**
 * What the retry strategies see: the error of the finished attempt, the place
 * of that attempt in the series and the request it belongs to.
 */
type RetryContext = {
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
 * The normalized retry policy: every field of `RetryConfig` that carries a
 * default value, with the default already applied. This is what the loop and
 * the strategies read, so neither of them repeats a default of its own.
 */
type NormalizedRetryPolicy = Required<Omit<RetryConfig, 'shouldRetry' | 'calculateDelay' | 'onRetry'>>;

type ClientConfig = {
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

/**
 * The retry policy as an instance may declare it: every field of `RetryConfig`
 * except `idempotent`. The statement "this call is safe to perform twice"
 * belongs to a single call and is never inherited from the instance — an
 * instance-wide statement would cover the calls written after it, including the
 * writing ones. The client drops the field at construction time, so an untyped
 * caller gets the same behavior the type forbids.
 */
type InstanceRetryConfig = Omit<RetryConfig, 'idempotent'>;

/**
 * Request config for the bodyless helpers (`get`, `delete`, `head`):
 * `body` and `json` are excluded because a GET/HEAD request cannot carry a body.
 */
type BodylessRequestConfig = Omit<RequestConfig, 'url' | 'method' | 'body' | 'json'>;

/**
 * Request config for the helpers that take a body (`post`, `put`, `patch`):
 * `body` is excluded because it is passed as their own argument. `json` stays
 * available — it is how these helpers send a json payload.
 */
type BodyRequestConfig = Omit<RequestConfig, 'url' | 'method' | 'body'>;

type ActionOptions = ActionOptionsWithBody | BodylessActionOptions;

/**
 * Options of an action sent with a body: `POST` (the default), `PUT`, `PATCH`
 * or `DELETE`. The payload goes either in `data` (form-urlencoded or `FormData`)
 * or in `json`.
 */
type ActionOptionsWithBody = CommonActionOptions & {
	method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	data?: Record<string, unknown> | FormData;
	json?: unknown;
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

type AjaxNavigation = {
	page?: number;
	size?: number;
};

type AnalyticsOptions = {
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

/**
 * Options of a bodyless action (`GET`, `HEAD`): `data` and `json` are excluded
 * because such a request cannot carry a body — pass the payload in `query`.
 */
type BodylessActionOptions = CommonActionOptions & {
	method: 'GET' | 'HEAD';
	data?: never;
	json?: never;
};

/**
 * The `data.assets` payload of an envelope marked with the `X-Process-Assets` header.
 */
type AjaxAssets = {
	css?: string[];
	js?: string[];
	string?: string[];
};

type WindowSize = {
	innerWidth: number;
	innerHeight: number;
	scrollLeft: number;
	scrollTop: number;
	scrollWidth: number;
	scrollHeight: number;
};

interface MessageFunction {
	(value: MessageParam): string | boolean | void;
	[key: string]: any;
}

type MessageParam = string | Record<string, string | number>;

type FXOptions = {
	start: number | Record<string, number>;
	finish: number | Record<string, number>;
	time?: number;
	type?: 'linear' | 'accelerated' | 'decelerated' | Function;
	callback?: Function;
	callback_start?: Function;
	callback_complete?: Function;
	step?: number;
	allowFloat?: boolean;
};

type TypeCompatLibrary = {
	isNotEmptyString: (value: any) => boolean;
	isNotEmptyObject: (value: any) => boolean;
	isMapKey: typeof BX.Type.isObject;
	stringToInt: (value: any) => number;
	[method: string]: any;
};

type BrowserCompat = {
	IsOpera: typeof BX.Browser.isOpera;
	IsIE: typeof BX.Browser.isIE;
	IsIE6: typeof BX.Browser.isIE6;
	IsIE7: typeof BX.Browser.isIE7;
	IsIE8: typeof BX.Browser.isIE8;
	IsIE9: typeof BX.Browser.isIE9;
	IsIE10: typeof BX.Browser.isIE10;
	IsIE11: typeof BX.Browser.isIE11;
	IsSafari: typeof BX.Browser.isSafari;
	IsFirefox: typeof BX.Browser.isFirefox;
	IsChrome: typeof BX.Browser.isChrome;
	DetectIeVersion: typeof BX.Browser.detectIEVersion;
	IsMac: typeof BX.Browser.isMac;
	IsAndroid: typeof BX.Browser.isAndroid;
	isIPad: typeof BX.Browser.isIPad;
	isIPhone: typeof BX.Browser.isIPhone;
	IsIOS: typeof BX.Browser.isIOS;
	IsMobile: typeof BX.Browser.isMobile;
	isRetina: typeof BX.Browser.isRetina;
	IsDoctype: typeof BX.Browser.isDoctype;
	SupportLocalStorage: typeof BX.Browser.isLocalStorageSupported;
	addGlobalClass: typeof BX.Browser.addGlobalClass;
	DetectAndroidVersion: typeof BX.Browser.detectAndroidVersion;
	isPropertySupported: typeof BX.Browser.isPropertySupported;
	addGlobalFeatures: typeof BX.Browser.addGlobalFeatures;
};

type JsonObject = Record<string, JsonValue>;

type AjaxResponse<DataType> = {
	status: 'success' | 'error' | 'denied';
	errors: AjaxError[];
	data: DataType;
};

type AjaxError = {
	message: string;
	code: string | number;
	customData: JsonObject | null;
};

declare namespace BX {
	/**
	 * @memberOf BX
	 */
	class Type {
		/**
		 * Checks that value is string
		 * @param value
		 * @return {boolean}
		 */
		static isString(value: unknown): value is string;
		/**
		 * Returns true if a value is not empty string
		 * @param value
		 * @returns {boolean}
		 */
		static isStringFilled(value: unknown): value is string;
		/**
		 * Checks that value is function
		 * @param value
		 * @return {boolean}
		 */
		static isFunction(value: unknown): value is Function;
		/**
		 * Checks that value is object
		 * @param value
		 * @return {boolean}
		 */
		static isObject(value: unknown): value is object;
		/**
		 * Checks that value is object like
		 * @param value
		 * @return {boolean}
		 */
		static isObjectLike(value: unknown): value is Record<string, unknown>;
		/**
		 * Checks that value is plain object
		 * @param value
		 * @return {boolean}
		 */
		static isPlainObject(value: unknown): value is Record<string, unknown>;
		/**
		 * Checks that value is boolean
		 * @param value
		 * @return {boolean}
		 */
		static isBoolean(value: unknown): value is boolean;
		/**
		 * Checks that value is number
		 * @param value
		 * @return {boolean}
		 */
		static isNumber(value: unknown): value is number;
		/**
		 * Checks that value is integer
		 * @param value
		 * @return {boolean}
		 */
		static isInteger(value: unknown): value is number;
		/**
		 * Checks that value is float
		 * @param value
		 * @return {boolean}
		 */
		static isFloat(value: unknown): value is number;
		/**
		 * Checks that value is nil
		 * @param value
		 * @return {boolean}
		 */
		static isNil(value: unknown): value is null | undefined;
		/**
		 * Checks that value is array
		 * @param value
		 * @return {boolean}
		 */
		static isArray<T = unknown>(value: unknown): value is T[];
		/**
		 * Returns true if a value is an array, and it has at least one element
		 * @param value
		 * @returns {boolean}
		 */
		static isArrayFilled<T = unknown>(value: unknown): value is [T, ...T[]];
		/**
		 * Checks that value is array like
		 * @param value
		 * @return {boolean}
		 */
		static isArrayLike(value: unknown): value is ArrayLike<unknown>;
		/**
		 * Checks that value is Date
		 * @param value
		 * @return {boolean}
		 */
		static isDate(value: unknown): value is Date;
		/**
		 * Checks that is DOM node
		 * @param value
		 * @return {boolean}
		 */
		static isDomNode(value: unknown): value is Node;
		/**
		 * Checks that value is element node
		 * @param value
		 * @return {boolean}
		 */
		static isElementNode(value: unknown): value is HTMLElement;
		/**
		 * Checks that value is EventTarget like object
		 * @param value
		 * @return {boolean}
		 */
		static isEventTargetLike(value: unknown): value is EventTarget;
		/**
		 * Checks that value is text node
		 * @param value
		 * @return {boolean}
		 */
		static isTextNode(value: unknown): value is Text;
		/**
		 * Checks that value is Map
		 * @param value
		 * @return {boolean}
		 */
		static isMap<K = unknown, V = unknown>(value: unknown): value is Map<K, V>;
		/**
		 * Checks that value is Set
		 * @param value
		 * @return {boolean}
		 */
		static isSet<T = unknown>(value: unknown): value is Set<T>;
		/**
		 * Checks that value is WeakMap
		 * @param value
		 * @return {boolean}
		 */
		static isWeakMap<K extends WeakKey = WeakKey, V = unknown>(value: unknown): value is WeakMap<K, V>;
		/**
		 * Checks that value is WeakSet
		 * @param value
		 * @return {boolean}
		 */
		static isWeakSet<T extends WeakKey = WeakKey>(value: unknown): value is WeakSet<T>;
		/**
		 * Checks that value is prototype
		 * @param value
		 * @return {boolean}
		 */
		static isPrototype(value: unknown): boolean;
		/**
		 * Checks that value is regexp
		 * @param value
		 * @return {boolean}
		 */
		static isRegExp(value: unknown): value is RegExp;
		/**
		 * Checks that value is null
		 * @param value
		 * @return {boolean}
		 */
		static isNull(value: unknown): value is null;
		/**
		 * Checks that value is undefined
		 * @param value
		 * @return {boolean}
		 */
		static isUndefined(value: unknown): value is undefined;
		/**
		 * Checks that value is ArrayBuffer
		 * @param value
		 * @return {boolean}
		 */
		static isArrayBuffer(value: unknown): value is ArrayBuffer;
		/**
		 * Checks that value is typed array
		 * @param value
		 * @return {boolean}
		 */
		static isTypedArray(value: unknown): boolean;
		/**
		 * Checks that value is Blob
		 * @param value
		 * @return {boolean}
		 */
		static isBlob(value: unknown): value is Blob;
		/**
		 * Checks that value is File
		 * @param value
		 * @return {boolean}
		 */
		static isFile(value: unknown): value is File;
		/**
		 * Checks that value is FormData
		 * @param value
		 * @return {boolean}
		 */
		static isFormData(value: unknown): value is FormData;
		static isJsonValue(value: unknown): boolean;
	}

	/**
	 * @memberOf BX
	 */
	class Reflection {
		/**
		 * Gets link to function by function name
		 * @param className
		 * @return {?Function}
		 */
		static getClass(className: string | Function): Function | null;
		/**
		 * Creates a namespace or returns a link to a previously created one
		 * @param {String} namespaceName
		 * @return {Record<string, any> | Function | null}
		 */
		static namespace(namespaceName: string): Record<string, any> | Function;
	}

	/**
	 * @memberOf BX
	 */
	class Text {
		/**
		 * Encodes all unsafe entities
		 * @param {string} value
		 * @return {string}
		 */
		static encode(value: string): string;
		/**
		 * Decodes all encoded entities
		 * @param {string} value
		 * @return {string}
		 */
		static decode(value: string): string;
		static getRandom(length?: number): string;
		static toNumber(value: unknown): number;
		static toInteger(value: unknown): number;
		static toBoolean(value: unknown, trueValues?: readonly unknown[]): boolean;
		static toCamelCase(str: string): string;
		static toPascalCase(str: string): string;
		static toKebabCase(str: string): string;
		static capitalize(str: string): string;
	}

	/**
	 * @memberOf BX
	 */
	class Dom {
		/**
		 * Replaces old html element to new html element
		 * @param oldElement
		 * @param newElement
		 */
		static replace(oldElement: HTMLElement | null | undefined, newElement: HTMLElement | null | undefined): void;
		/**
		 * Removes element
		 * @param element
		 */
		static remove(element: HTMLElement | null | undefined): void;
		/**
		 * Cleans element
		 * @param element
		 */
		static clean(element: HTMLElement | string | null): void;
		/**
		 * Inserts element before target element
		 * @param current
		 * @param target
		 */
		static insertBefore(current: HTMLElement | null | undefined, target: HTMLElement | null | undefined): void;
		/**
		 * Inserts element after target element
		 * @param current
		 * @param target
		 */
		static insertAfter(current: HTMLElement | null | undefined, target: HTMLElement | null | undefined): void;
		/**
		 * Appends element to target element
		 * @param current
		 * @param target
		 */
		static append(current: HTMLElement | null | undefined, target: HTMLElement | null | undefined): void;
		/**
		 * Prepends element to target element
		 * @param current
		 * @param target
		 */
		static prepend(current: HTMLElement | null | undefined, target: HTMLElement | null | undefined): void;
		/**
		 * Checks that element contains class name or class names
		 * @param element
		 * @param className
		 * @return {Boolean}
		 */
		static hasClass(element: unknown, className: string | string[]): boolean;
		/**
		 * Adds class name
		 * @param element
		 * @param className
		 */
		static addClass(element: unknown, className: string | string[]): void;
		/**
		 * Removes class name
		 * @param element
		 * @param className
		 */
		static removeClass(element: unknown, className: string | string[]): void;
		/**
		 * Toggles class name
		 */
		static toggleClass(element: HTMLElement, className: string | string[], force?: boolean): void;
		/**
		 * Styles element
		 */
		static style(element: HTMLElement | null | undefined, prop: string | null | undefined | Record<string, string | number>, value?: string | number | null): string | number | Element | null | undefined;
		/**
		 * Adjusts element
		 * @param target
		 * @param data
		 * @return {*}
		 */
		static adjust(target: HTMLElement | Document, data?: AdjustData): HTMLElement | null;
		/**
		 * Creates element
		 * @param tag
		 * @param data
		 * @param context
		 * @return {HTMLElement|HTMLBodyElement}
		 */
		static create(tag: string | CreateOptions, data?: AdjustData, context?: Document): HTMLElement;
		/**
		 * Shows element
		 * @param element
		 */
		static show(element: HTMLElement | null | undefined): void;
		/**
		 * Hides element
		 * @param element
		 */
		static hide(element: HTMLElement | null | undefined): void;
		/**
		 * Checks that element is shown
		 * @param element
		 * @return {*|boolean}
		 */
		static isShown(element: HTMLElement | null | undefined): boolean;
		/**
		 * Checks if element is shown with recursive check of its ancestors
		 */
		static isShownRecursive(element: HTMLElement | null | undefined): boolean;
		/**
		 * Toggles element visibility
		 * @param element
		 */
		static toggle(element: HTMLElement): void;
		/**
		 * Gets element position relative page
		 * @param {HTMLElement} element
		 * @return {DOMRect}
		 */
		static getPosition(element: HTMLElement): DOMRect;
		/**
		 * Gets element position relative specified element position
		 * @param {HTMLElement} element
		 * @param {HTMLElement} relationElement
		 * @return {DOMRect}
		 */
		static getRelativePosition(element: HTMLElement, relationElement: HTMLElement): DOMRect;
		static attr(element: HTMLElement | null | undefined, attr: string | Record<string, unknown>, value?: unknown): any;
	}

	/**
	 * @memberOf BX
	 */
	class Browser {
		static isOpera(): boolean;
		static isIE(): boolean;
		static isIE6(): boolean;
		static isIE7(): boolean;
		static isIE8(): boolean;
		static isIE9(): boolean;
		static isIE10(): boolean;
		static isSafari(): boolean;
		static isFirefox(): boolean;
		static isChrome(): boolean;
		static detectIEVersion(): number;
		static isIE11(): boolean;
		static isMac(): boolean;
		static isWin(): boolean;
		static isLinux(): boolean;
		static isAndroid(): boolean;
		static isIPad(): boolean;
		static isIPhone(): boolean;
		static isIOS(): boolean;
		static isMobile(): boolean;
		static isRetina(): boolean;
		static isTouchDevice(): boolean;
		static isDoctype(target?: Document): boolean;
		static isLocalStorageSupported(): boolean;
		static addGlobalClass(target?: Element): void;
		static detectAndroidVersion(): number;
		static isPropertySupported(jsProperty: string, returnCSSName?: boolean): string | false;
		static addGlobalFeatures(features: unknown): void;
	}

	/**
	 * @memberOf BX
	 */
	class Event {
		static bind: typeof bind;
		static bindOnce: typeof bindOnce;
		static unbind: typeof unbind;
		static unbindAll: typeof unbindAll;
		static ready: typeof ready;
		static getEventListeners: typeof getEventListeners;
		static EventEmitter: typeof EventEmitter;
		static BaseEvent: typeof BaseEvent;
	}

	function bind<K extends keyof GlobalEventMap>(target: EventTarget, eventName: K, listener: (event: GlobalEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;

	function bind(target: EventTarget, eventName: string, handler: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean): void;

	function bindOnce<K extends keyof GlobalEventMap>(target: EventTarget, eventName: K, listener: (event: GlobalEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;

	function bindOnce(target: EventTarget, eventName: string, handler: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean): void;

	function unbind<K extends keyof GlobalEventMap>(target: EventTarget, eventName: K, listener: (event: GlobalEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void;

	function unbind(target: EventTarget, eventName: string, handler: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean): void;

	function unbindAll(target: any, eventName?: string): void;

	function ready(handler: () => void): void;

	function getEventListeners(target: EventTarget, eventName: string): Array<RegistryEventListener>;

	class EventEmitter {
		[key: symbol]: any;
		static GLOBAL_TARGET: {
			GLOBAL_TARGET: string;
		};
		static DEFAULT_MAX_LISTENERS: number;
		/** @private */
		static sequenceValue: number;
		constructor(...args: any[]);
		/**
		 * Makes a target observable
		 * @param {object} target
		 * @param {string} namespace
		 */
		static makeObservable(target: any, namespace: string): void;
		setEventNamespace(namespace: any): void;
		getEventNamespace(): string | null;
		/**
		 * Subscribes listener on specified global event
		 * @param {object} target
		 * @param {string} eventName
		 * @param {Function} listener
		 * @param {object} options
		 */
		static subscribe(eventName: string, listener: CompatibleListener, options: ListenerOptions & {
			compatMode: true;
		}): void;
		static subscribe(target: object, eventName: string, listener: CompatibleListener, options: ListenerOptions & {
			compatMode: true;
		}): void;
		static subscribe<T = any>(eventName: string, listener: (event: BaseEvent<T>) => void, options?: ListenerOptions): void;
		static subscribe<T = any>(target: object, eventName: string, listener: (event: BaseEvent<T>) => void, options?: ListenerOptions): void;
		/**
		 * Subscribes a listener on a specified event
		 * @param {string} eventName
		 * @param {Function<BaseEvent>} listener
		 * @return {this}
		 */
		subscribe<T = any>(eventName: string, listener: (event: BaseEvent<T>) => void): this;
		/**
		 *
		 * @param {object} options
		 * @param {object} [aliases]
		 * @param {boolean} [compatMode=false]
		 */
		subscribeFromOptions(options: {
			[eventName: string]: Function;
		} | Array<{
			[eventName: string]: Function;
		}>, aliases?: {
			[alias: string]: {
				eventName: string;
				namespace: string;
			};
		}, compatMode?: boolean): void;
		/**
		 * Subscribes a listener that is called at
		 * most once for a specified event.
		 * @param {object} target
		 * @param {string} eventName
		 * @param {Function<BaseEvent>} listener
		 */
		static subscribeOnce<T = any>(eventName: string, listener: (event: BaseEvent<T>) => void): void;
		static subscribeOnce<T = any>(target: object, eventName: string, listener: (event: BaseEvent<T>) => void): void;
		/**
		 * Subscribes a listener that is called at most once for a specified event.
		 * @param {string} eventName
		 * @param {Function<BaseEvent>} listener
		 * @return {this}
		 */
		subscribeOnce<T = any>(eventName: string, listener: (event: BaseEvent<T>) => void): this;
		/**
		 * Unsubscribes an event listener
		 * @param {object} target
		 * @param {string} eventName
		 * @param {Function} listener
		 * @param options
		 */
		static unsubscribe(eventName: string, listener: CompatibleListener, options?: ListenerOptions): void;
		static unsubscribe(target: object, eventName: string, listener: CompatibleListener, options?: ListenerOptions): void;
		static unsubscribe<T = any>(eventName: string, listener: (event: BaseEvent<T>) => void, options?: ListenerOptions): void;
		static unsubscribe<T = any>(target: object, eventName: string, listener: (event: BaseEvent<T>) => void, options?: ListenerOptions): void;
		/**
		 * Unsubscribes an event listener
		 * @param {string} eventName
		 * @param {Function<BaseEvent>} listener
		 * @return {this}
		 */
		unsubscribe<T = any>(eventName: string, listener: (event: BaseEvent<T>) => void): this;
		/**
		 * Unsubscribes all event listeners
		 * @param {object} target
		 * @param {string} eventName
		 * @param options
		 */
		static unsubscribeAll(eventName: string, options?: ListenerOptions): void;
		static unsubscribeAll(target: object, eventName?: string, options?: ListenerOptions): void;
		/**
		 * Unsubscribes all event listeners
		 * @param {string} [eventName]
		 */
		unsubscribeAll(eventName?: string): void;
		/**
		 *
		 * @param {object} target
		 * @param {string} eventName
		 * @param {BaseEvent | any} event
		 * @param {object} options
		 * @returns {Array}
		 */
		static emit<T = any>(eventName: string, event?: BaseEvent<T> | T, options?: ListenerOptions): Array<any>;
		static emit<T = any>(target: object, eventName: string, event?: BaseEvent<T> | T, options?: ListenerOptions): Array<any>;
		/**
		 * Emits specified event with specified event object
		 * @param {string} eventName
		 * @param {BaseEvent | any} event
		 * @return {this}
		 */
		emit<T = any>(eventName: string, event?: BaseEvent<T> | T): this;
		/**
		 * Emits global event and returns a promise that is resolved when
		 * all promise returned from event handlers are resolved,
		 * or rejected when at least one of the returned promise is rejected.
		 * Importantly. You can return any value from synchronous handlers, not just promise
		 * @param {object} target
		 * @param {string} eventName
		 * @param {BaseEvent | any} event
		 * @return {Promise<Array>}
		 */
		static emitAsync(target: any, eventName?: any, event?: any): Promise<Array<any>>;
		/**
		 * Emits event and returns a promise that is resolved when
		 * all promise returned from event handlers are resolved,
		 * or rejected when at least one of the returned promise is rejected.
		 * Importantly. You can return any value from synchronous handlers, not just promise
		 * @param {string} eventName
		 * @param {BaseEvent|any} event
		 * @return {Promise<Array>}
		 */
		emitAsync(eventName: string, event?: BaseEvent | {
			[key: string]: any;
		}): Promise<Array<any>>;
		/**
		 * @private
		 * @param {object} target
		 * @param {string} eventName
		 * @param {BaseEvent|any} event
		 * @returns {BaseEvent}
		 */
		static prepareEvent(target: any, eventName: string, event?: BaseEvent | {
			[key: string]: any;
		}): BaseEvent;
		/**
		 * @private
		 * @returns {number}
		 */
		static getNextSequenceValue(): number;
		/**
		 * Sets max global events listeners count
		 * Event.EventEmitter.setMaxListeners(10) - sets the default value for all events (global target)
		 * Event.EventEmitter.setMaxListeners("onClose", 10) - sets the value for onClose event (global target)
		 * Event.EventEmitter.setMaxListeners(obj, 10) - sets the default value for all events (obj target)
		 * Event.EventEmitter.setMaxListeners(obj, "onClose", 10); - sets the value for onClose event (obj target)
		 * @return {void}
		 * @param args
		 */
		static setMaxListeners(...args: any[]): void;
		/**
		 * Sets max events listeners count
		 * this.setMaxListeners(10) - sets the default value for all events
		 * this.setMaxListeners("onClose", 10) sets the value for onClose event
		 * @return {this}
		 * @param args
		 */
		setMaxListeners(...args: any[]): this;
		/**
		 * Returns max event listeners count
		 * @param {object} target
		 * @param {string} [eventName]
		 * @returns {number}
		 */
		static getMaxListeners(target: any, eventName?: string | null): number;
		/**
		 * Returns max event listeners count
		 * @param {string} [eventName]
		 * @returns {number}
		 */
		getMaxListeners(eventName?: string): number;
		/**
		 * Adds or subtracts max listeners count
		 * Event.EventEmitter.addMaxListeners() - adds one max listener for all events of global target
		 * Event.EventEmitter.addMaxListeners(3) - adds three max listeners for all events of global target
		 * Event.EventEmitter.addMaxListeners(-1) - subtracts one max listener for all events of global target
		 * Event.EventEmitter.addMaxListeners('onClose') - adds one max listener for onClose event of global target
		 * Event.EventEmitter.addMaxListeners('onClose', 2) - adds two max listeners for onClose event of global target
		 * Event.EventEmitter.addMaxListeners('onClose', -1) - subtracts one max listener for onClose event of global target
		 *
		 * Event.EventEmitter.addMaxListeners(obj) - adds one max listener for all events of 'obj' target
		 * Event.EventEmitter.addMaxListeners(obj, 3) - adds three max listeners for all events of 'obj' target
		 * Event.EventEmitter.addMaxListeners(obj, -1) - subtracts one max listener for all events of 'obj' target
		 * Event.EventEmitter.addMaxListeners(obj, 'onClose') - adds one max listener for onClose event of 'obj' target
		 * Event.EventEmitter.addMaxListeners(obj, 'onClose', 2) - adds two max listeners for onClose event of 'obj' target
		 * Event.EventEmitter.addMaxListeners(obj, 'onClose', -1) - subtracts one max listener
		 *   for onClose event of 'obj' target
		 * @param args
		 * @returns {number}
		 */
		static addMaxListeners(...args: any[]): number;
		/**
		 * Increases max listeners count
		 *
		 * Event.EventEmitter.incrementMaxListeners() - adds one max listener for all events of global target
		 * Event.EventEmitter.incrementMaxListeners(3) - adds three max listeners for all events of global target
		 * Event.EventEmitter.incrementMaxListeners('onClose') - adds one max listener for onClose event of global target
		 * Event.EventEmitter.incrementMaxListeners('onClose', 2) - adds two max listeners for onClose event of global target
		 *
		 * Event.EventEmitter.incrementMaxListeners(obj) - adds one max listener for all events of 'obj' target
		 * Event.EventEmitter.incrementMaxListeners(obj, 3) - adds three max listeners for all events of 'obj' target
		 * Event.EventEmitter.incrementMaxListeners(obj, 'onClose') - adds one max listener for onClose event of 'obj' target
		 * Event.EventEmitter.incrementMaxListeners(obj, 'onClose', 2) - adds two max listeners
		 *   for onClose event of 'obj' target
		 */
		static incrementMaxListeners(...args: any[]): number;
		/**
		 * Increases max listeners count
		 * this.incrementMaxListeners() - adds one max listener for all events
		 * this.incrementMaxListeners(3) - adds three max listeners for all events
		 * this.incrementMaxListeners('onClose') - adds one max listener for onClose event
		 * this.incrementMaxListeners('onClose', 2) - adds two max listeners for onClose event
		 */
		incrementMaxListeners(...args: any[]): number;
		/**
		 * Decreases max listeners count
		 *
		 * Event.EventEmitter.decrementMaxListeners() - subtracts one max listener for all events of global target
		 * Event.EventEmitter.decrementMaxListeners(3) - subtracts three max listeners for all events of global target
		 * Event.EventEmitter.decrementMaxListeners('onClose') - subtracts one max listener for onClose event of global target
		 * Event.EventEmitter.decrementMaxListeners('onClose', 2) - subtracts two max listeners
		 *   for onClose event of global target
		 *
		 * Event.EventEmitter.decrementMaxListeners(obj) - subtracts one max listener
		 *   for all events of 'obj' target
		 * Event.EventEmitter.decrementMaxListeners(obj, 3) - subtracts three max listeners
		 *   for all events of 'obj' target
		 * Event.EventEmitter.decrementMaxListeners(obj, 'onClose') - subtracts one max listener
		 *   for onClose event of 'obj' target
		 * Event.EventEmitter.decrementMaxListeners(obj, 'onClose', 2) - subtracts two max listeners
		 *   for onClose event of 'obj' target
		 */
		static decrementMaxListeners(...args: any[]): number;
		/**
		 * Increases max listeners count
		 * this.decrementMaxListeners() - subtracts one max listener for all events
		 * this.decrementMaxListeners(3) - subtracts three max listeners for all events
		 * this.decrementMaxListeners('onClose') - subtracts one max listener for onClose event
		 * this.decrementMaxListeners('onClose', 2) - subtracts two max listeners for onClose event
		 */
		decrementMaxListeners(...args: any[]): number;
		/**
		 * @private
		 */
		static destructMaxListenersArgs(...args: any[]): [object, string | null, number];
		/**
		 * Gets listeners list for a specified event
		 * @param {object} target
		 * @param {string} eventName
		 */
		static getListeners(eventName: string): Map<any, any>;
		static getListeners(target: object, eventName?: string): Map<any, any>;
		/**
		 * Gets listeners list for specified event
		 * @param {string} eventName
		 */
		getListeners(eventName: string): Map<any, any>;
		/**
		 * Returns a full event name with namespace
		 * @param {string} eventName
		 * @returns {string}
		 */
		getFullEventName(eventName: string): string;
		/**
		 * Registers aliases (old event names for BX.onCustomEvent)
		 * @param aliases
		 */
		static registerAliases(aliases: any): void;
		/**
		 * @private
		 * @param aliases
		 */
		static normalizeAliases(aliases: any): Record<string, any>;
		/**
		 * @private
		 */
		static mergeEventAliases(aliases: Record<string, any>): void;
		/**
		 * Returns true if the target is an instance of Event.EventEmitter
		 * @param {object} target
		 * @returns {boolean}
		 */
		static isEventEmitter(target: any): boolean;
		/**
		 * @private
		 * @param {string} eventName
		 * @returns {string}
		 */
		static normalizeEventName(eventName: string): string;
		/**
		 * @private
		 */
		static normalizeListener(listener: any): Function;
		/**
		 * @private
		 * @param eventName
		 * @param target
		 * @param useGlobalNaming
		 * @returns {string}
		 */
		static resolveEventName(eventName: string, target: any, useGlobalNaming?: boolean): string;
		/**
		 * @private
		 * @param {string} namespace
		 * @param {string} eventName
		 * @returns {string}
		 */
		static makeFullEventName(namespace: string | null, eventName: string): string;
	}

	/**
	 * Implements base event object interface
	 */
	class BaseEvent<DataType = any, TargetType = any> {
		type: string;
		data: DataType | null;
		target: TargetType | null;
		compatData: Array<any> | null;
		defaultPrevented: boolean;
		immediatePropagationStopped: boolean;
		errors: Array<BaseError>;
		constructor(options?: {
			data?: DataType;
			compatData?: Array<any>;
		});
		static create(options: any): BaseEvent;
		/**
		 * Returns the name of the event
		 * @returns {string}
		 */
		getType(): string;
		/**
		 *
		 * @param {string} type
		 */
		setType(type: string): this;
		/**
		 * Returns an event data
		 */
		getData(): DataType | null;
		/**
		 * Sets an event data
		 * @param data
		 */
		setData(data: any): this;
		/**
		 * Returns arguments for BX.addCustomEvent handlers (deprecated).
		 * @returns {array | null}
		 */
		getCompatData(): Array<any> | null;
		/**
		 * Sets arguments for BX.addCustomEvent handlers (deprecated)
		 * @param data
		 */
		setCompatData(data: any): this;
		/**
		 * Sets a event target
		 * @param target
		 */
		setTarget(target: TargetType): this;
		/**
		 * Returns a event target
		 */
		getTarget(): TargetType | null;
		/**
		 * Returns an array of event errors
		 * @returns {[]}
		 */
		getErrors(): Array<BaseError>;
		/**
		 * Adds an error of the event.
		 * Event listeners can prevent emitter's default action and set the reason of this behavior.
		 * @param error
		 */
		setError(error: BaseError): void;
		/**
		 * Prevents default action
		 */
		preventDefault(): void;
		/**
		 * Checks that is default action prevented
		 * @return {boolean}
		 */
		isDefaultPrevented(): boolean;
		/**
		 * Stops event immediate propagation
		 */
		stopImmediatePropagation(): void;
		/**
		 * Checks that is immediate propagation stopped
		 * @return {boolean}
		 */
		isImmediatePropagationStopped(): boolean;
	}

	/**
	 * @memberOf BX
	 */
	class BaseError {
		[isError]: boolean;
		message: string;
		code: string | null;
		customData: unknown;
		constructor(message?: string, code?: string, customData?: unknown);
		/**
		 * Returns a brief description of the error
		 * @returns {string}
		 */
		getMessage(): string;
		/**
		 * Sets a message of the error
		 * @param {string} message
		 * @returns {this}
		 */
		setMessage(message?: string): this;
		/**
		 * Returns a code of the error
		 * @returns {?string}
		 */
		getCode(): string | null;
		/**
		 * Sets a code of the error
		 * @param {string} code
		 * @returns {this}
		 */
		setCode(code?: string | null): this;
		/**
		 * Returns custom data of the error
		 * @returns {null|*}
		 */
		getCustomData(): unknown;
		/**
		 * Sets custom data of the error
		 * @returns {this}
		 */
		setCustomData(customData: unknown): this;
		toString(): string;
		/**
		 * Returns true if the object is an instance of BaseError
		 * @param error
		 * @returns {boolean}
		 */
		static isError(error: unknown): error is BaseError;
	}

	const isError: unique symbol;

	/**
	 * @memberOf BX
	 */
	class Http {
		static Cookie: typeof Cookie;
		static Data: typeof Data;
	}

	class Cookie {
		/**
		 * Gets cookies list for current domain
		 * @return {object}
		 */
		static getList(): {
			[key: string]: string;
		};
		/**
		 * Gets cookie value
		 * @param {string} name
		 * @return {*}
		 */
		static get(name: string): string | undefined;
		/**
		 * Sets cookie
		 * @param {string} name
		 * @param {*} value
		 * @param {object} [options]
		 */
		static set(name: string, value: any, options?: CookieOptions): void;
		/**
		 * Removes cookie
		 * @param {string} name
		 * @param {object} [options]
		 */
		static remove(name: string, options?: CookieOptions): void;
	}

	class Data {
		/**
		 * Converts object to FormData
		 * @param source
		 * @return {FormData}
		 */
		static convertObjectToFormData(source: {
			[key: string]: any;
		}): FormData;
	}

	class Runtime {
		static debug: typeof debug;
		static extractAssets: typeof extractAssets;
		static loadExtension: typeof loadExtension;
		static registerExtension: typeof registerExtension;
		static clone: typeof clone;
		static debounce<F extends (...args: any[]) => any>(func: F, wait?: number, context?: object | null): (...args: Parameters<F>) => void;
		static throttle<F extends (...args: any[]) => any>(func: F, wait?: number, context?: object | null): (...args: Parameters<F>) => void;
		static html(node: HTMLElement, html: any, params?: Record<string, any>): Promise<void> | string;
		/**
		 * Merges objects or arrays
		 * @param targets
		 * @return {any}
		 */
		static merge(...targets: any[]): any;
		static orderBy(collection: Array<{
			[key: string]: any;
		}> | {
			[key: string]: {
				[key: string]: any;
			};
		}, fields?: Array<string>, orders?: Array<string>): Array<{
			[key: string]: any;
		}>;
		static destroy(target: any, errorMessage?: string): void;
	}

	function debug(...args: any[]): void;

	/**
	 * Scans the markup for scripts and stylesheet links and takes them out of it.
	 *
	 * ## What this does not handle
	 *
	 * The scan is textual, so it cannot tell a `<script>` element from the same characters inside an
	 * attribute value: `<div data-tpl="<script>x()</script>">` is read as a real script, the element
	 * is cut apart, and `x()` is handed back to be run. HTML nests and attribute values may contain
	 * anything, which a pattern over a flat string cannot express - no arrangement of the
	 * expressions below fixes it. Feeding this function markup whose attribute values may carry
	 * angle brackets is therefore unsafe, and the caller must know that before choosing it.
	 *
	 * A parser built on the browser's own tree - `<template>` or `DOMParser` - does not have this
	 * hole, and an earlier version of this function was written that way. It cost 15-30x more per
	 * call (measured: 0.060 ms against 0.004 ms on a typical 3 KB response, 2.3 ms against 0.2 ms at
	 * 100 KB) because it builds every node of the document and serialises the tree back to a string,
	 * whether or not anything is extracted. The speed is why this implementation replaced it; the
	 * hole above is what that speed costs, and the trade belongs to the caller, not to this file.
	 *
	 * ## What it does handle
	 *
	 * The markup is only read, never executed: no element is created and nothing is fetched. Running
	 * the collected scripts is left to the caller, exactly as it is with `BX.processHTML`. The
	 * result is not sanitised either, and it is not meant to be.
	 *
	 * Two defects of `BX.processHTML` are not carried over. The expressions are built per call
	 * rather than shared at module level, so the search position one call leaves behind cannot reach
	 * the next. And the markup is assembled from slices in one pass instead of being rebuilt for
	 * every link removed, which is what makes the legacy loop quadratic in the number of
	 * stylesheets: at 500 of them it takes 18 ms where this takes 0.6 ms.
	 *
	 * @example
	 * const { html, scripts, styles } = extractAssets('<p>text</p><script>run()</script>');
	 * // html === '<p>text</p>', scripts === [{ isInternal: true, text: 'run()', ... }]
	 */
	function extractAssets(data: unknown, options?: ExtractAssetsOptions): ExtractedAssets;

	function loadExtension(...name: Array<string | Array<string>>): LoadExtensionResult;

	function registerExtension(options: any): void;

	/**
	 * Clones any cloneable object
	 * @param value
	 * @return {*}
	 */
	function clone<T>(value: T): T;

	/**
	 * Implements interface for works with language messages
	 * @memberOf BX
	 */
	class Loc {
		/**
		 * Gets message by id
		 * @param {string} messageId
		 * @param {object} replacements
		 * @return {?string}
		 */
		static getMessage(messageId: string, replacements?: Record<string, string> | null): string | null | undefined;
		static hasMessage(messageId: string): boolean;
		/**
		 * Sets message or messages
		 * @param {string | Record<string, string>} id
		 * @param {string} [value]
		 */
		static setMessage(id: string | Record<string, string>, value?: string): void;
		/**
		 * Gets plural message by id and number
		 * @param {string} messageId
		 * @param {number} value
		 * @param {object} [replacements]
		 * @return {?string}
		 */
		static getMessagePlural(messageId: string, value: number, replacements?: Record<string, string> | null): string | null | undefined;
		/**
		 * Gets language plural form id by number
		 * see http://docs.translatehouse.org/projects/localization-guide/en/latest/l10n/pluralforms.html
		 * @param {number} value
		 * @param {string} [languageId]
		 * @return {?number}
		 */
		static getPluralForm(value: number, languageId?: string): number;
	}

	/**
	 * @memberOf BX
	 */
	class Tag {
		/**
		 * Encodes all substitutions
		 */
		static safe(sections: TemplateStringsArray, ...substitutions: string[]): string;
		/**
		 * Decodes all substitutions
		 * @param sections
		 * @param substitutions
		 * @return {string}
		 */
		static unsafe(sections: any, ...substitutions: any[]): any;
		/**
		 * Adds styles to specified element
		 * @param {HTMLElement} element
		 * @return {Function}
		 */
		static style(element: HTMLElement): Function;
		/**
		 * Replace all messages identifiers to real messages
		 */
		static message(sections: TemplateStringsArray, ...substitutions: string[]): string;
		static render: typeof render;
		/**
		 * Adds attributes to specified element
		 */
		static attrs(element: HTMLElement): (...args: any[]) => void;
		static attr: typeof Tag.attrs;
	}

	/**
	 * Renders an HTML template into DOM nodes.
	 *
	 * The default return type is `HTMLElement` — the common case of a single root
	 * node (`const el = Tag.render\`<div></div>\``). The type parameter `T` lets
	 * callers describe the other shapes the function can produce:
	 * - a specific element type: `Tag.render<HTMLInputElement>\`<input>\``;
	 * - a refs object when the template uses `ref=`:
	 *   `Tag.render<{ root: HTMLElement; title: HTMLElement }>\`...\``;
	 * - an array of nodes for multi-root templates: `Tag.render<HTMLElement[]>\`...\``.
	 */
	function render<T = HTMLElement>(sections: TemplateStringsArray, ...substitutions: Array<any>): T;

	/**
	 * Implements interface for works with URI
	 * @memberOf BX
	 */
	class Uri {
		static addParam(url: string, params?: {}): string;
		static removeParam(url: string, params: Array<string> | string): string;
		constructor(url?: string);
		getSchema(): string | null | undefined;
		setSchema(schema: string): Uri;
		getHost(): string | null | undefined;
		setHost(host: string): Uri;
		getPort(): string;
		setPort(port: string | number): Uri;
		getPath(): string;
		setPath(path: string): Uri;
		getQuery(): string;
		getQueryParam(key: string): string | null | undefined;
		setQueryParam(key: string, value?: string): Uri;
		getQueryParams(): {
			[key: string]: string;
		};
		setQueryParams(params?: {
			[key: string]: string;
		}): Uri;
		removeQueryParam(...keys: Array<string>): Uri;
		getFragment(): string | null | undefined;
		setFragment(hash: string): Uri;
		serialize(): {
			[key: string]: string;
		};
		toString(): string;
	}

	/**
	 * Checks if the given value is a valid email address.
	 * Supports Cyrillic characters in both local and domain parts.
	 *
	 * @param {any} email The value to validate.
	 * @returns {boolean} True if the value is a valid email, false otherwise.
	 * @memberOf BX
	 */
	class Validation {
		static MAX_EMAIL_LENGTH: number;
		static MAX_LOCAL_LENGTH: number;
		static LOCAL_ALLOWED_CHARS: RegExp;
		static DOMAIN_LABEL_CHARS: RegExp;
		static isEmail(email: unknown): boolean;
	}

	/**
	 * @memberOf BX
	 */
	class Cache {
		static BaseCache: typeof BaseCache;
		static MemoryCache: typeof MemoryCache;
		static LocalStorageCache: typeof LocalStorageCache;
	}

	/**
	 * A string-keyed cache.
	 *
	 * The class parameter `T` is the default value type of the cache (defaults to `unknown`
	 * so a plain `new MemoryCache()` accepts anything). Different keys may hold different
	 * types, so each method also takes its own type parameter: `cache.get<Popup>('popup')`,
	 * `cache.set('count', 1)`, inferred from the default value or factory when passed. When
	 * a default (or factory) is provided, `get`/`remember` are guaranteed to return a value,
	 * so the return type excludes `undefined`.
	 */
	class BaseCache<T = unknown> {
		/**
		 * @private
		 */
		storage: ICacheStorage;
		/**
		 * Gets a cached value, falling back to the default value (or factory result) when
		 * the key is missing. With a default the return type excludes `undefined`.
		 */
		get<V = T>(key: string): V | undefined;
		get<V = T>(key: string, defaultValue: (() => V) | V): V;
		/**
		 * Sets a cache entry.
		 */
		set<V = T>(key: string, value: V): void;
		/**
		 * Deletes a cache entry.
		 */
		delete(key: string): void;
		/**
		 * Checks that the storage contains an entry with the specified key.
		 */
		has(key: string): boolean;
		/**
		 * Gets a cached value; when the key is missing, stores and returns the default value
		 * (or factory result). With a default the return type excludes `undefined`.
		 */
		remember<V = T>(key: string): V | undefined;
		remember<V = T>(key: string, defaultValue: (() => V) | V): V;
		/**
		 * Gets the storage size.
		 */
		size(): number;
		/**
		 * Gets the storage keys.
		 */
		keys(): Array<string>;
		/**
		 * Gets the storage values.
		 */
		values<V = T>(): Array<V>;
	}

	/**
	 * In-memory cache. BaseCache already uses MemoryStorage by default, so this is a named
	 * alias kept for the public API (`BX.Cache.MemoryCache`).
	 */
	class MemoryCache<T = unknown> extends BaseCache<T> {
	}

	/**
	 * Cache backed by localStorage, so entries survive page reloads.
	 */
	class LocalStorageCache<T = unknown> extends BaseCache<T> {
		/**
		 * @private
		 */
		storage: ICacheStorage;
	}

	class Extension {
		static getSettings(extensionName: string): SettingsCollection;
	}

	class SettingsCollection {
		constructor(options?: {
			[key: string]: any;
		});
		get(path: string, defaultValue?: any): any;
	}

	/**
	 * @memberof BX
	 */
	class ZIndexManager {
		static stacks: WeakMap<HTMLElement, ZIndexStack>;
		static register(element: HTMLElement, options?: ZIndexComponentOptions): ZIndexComponent | null | undefined;
		static unregister(element: HTMLElement): void;
		static addStack(container: HTMLElement): ZIndexStack;
		static getStack(container: HTMLElement): ZIndexStack | null | undefined;
		static getOrAddStack(container: HTMLElement): ZIndexStack | null | undefined;
		static getComponent(element: HTMLElement): ZIndexComponent | null | undefined;
		static bringToFront(element: HTMLElement): ZIndexComponent | null | undefined;
	}

	class ZIndexStack {
		container: HTMLElement;
		components: OrderedArray<ZIndexComponent>;
		elements: WeakMap<HTMLElement, ZIndexComponent>;
		baseIndex: number;
		baseStep: number;
		sortCount: number;
		constructor(container: HTMLElement);
		getBaseIndex(): number;
		setBaseIndex(index: number): void;
		setBaseStep(step: number): void;
		getBaseStep(): number;
		register(element: HTMLElement, options?: ZIndexComponentOptions): ZIndexComponent;
		unregister(element: HTMLElement): void;
		getComponent(element: HTMLElement): ZIndexComponent | null | undefined;
		getComponents(): ZIndexComponent[];
		getMaxZIndex(): number;
		sort(): void;
		bringToFront(element: HTMLElement): ZIndexComponent | null | undefined;
	}

	class OrderedArray<T> {
		comparator: Function | null;
		items: Array<T>;
		constructor(comparator?: Function | null);
		add(item: T): number;
		has(item: T): boolean;
		getIndex(item: T): number;
		getByIndex(index: number): T | null;
		getFirst(): T | null;
		getLast(): T | null;
		count(): number;
		delete(item: T): boolean;
		clear(): void;
		[Symbol.iterator](): ArrayIterator<T>;
		forEach(callbackfn: (value: T, index: number, array: T[]) => void, thisArg?: any): void;
		getAll(): Array<T>;
		getComparator(): Function | null;
		sort(): void;
	}

	class ZIndexComponent extends EventEmitter {
		sort: number;
		alwaysOnTop: boolean | number;
		zIndex: number;
		element: HTMLElement | null;
		overlay: HTMLElement | null;
		overlayGap: number;
		stack: ZIndexStack | null;
		constructor(element: HTMLElement, componentOptions?: ZIndexComponentOptions);
		getSort(): number;
		/**
		 * @internal
		 * @param sort
		 */
		setSort(sort: number): void;
		/**
		 * @internal
		 * @param stack
		 */
		setStack(stack: ZIndexStack): void;
		getStack(): ZIndexStack | null | undefined;
		getZIndex(): number;
		/**
		 * @internal
		 */
		setZIndex(zIndex: number): void;
		getAlwaysOnTop(): boolean | number;
		setAlwaysOnTop(value: boolean | number): void;
		getElement(): HTMLElement | null;
		setOverlay(overlay: HTMLElement, gap?: number): void;
		getOverlay(): HTMLElement | null | undefined;
		setOverlayGap(gap: number): void;
		getOverlayGap(): number;
	}

	const Collections: CollectionsLibrary;

	class WeakRefMap<K, V extends WeakKey> {
		constructor();
		clear(): void;
		delete(key: K): boolean;
		get(key: K): V | undefined;
		has(key: K): boolean;
		set(key: K, value: V): this;
	}

	class Animation {
		/**
		 * Resolves when the transitions of the element are over, whether they finished or were cancelled.
		 * Call it after the change that starts the transition is applied: only the transitions the element
		 * already has are awaited, all of them, including the ones started by somebody else.
		 * `propertyName` narrows the wait to the transitions of the named properties.
		 *
		 * The promise never rejects and resolves right away when there is nothing to wait for: the element
		 * has no transition at all or none of a named property, the list of names is empty, the argument is
		 * not an element, or none of the transitions ends at a finite time (endless or on a progress timeline).
		 * A paused transition neither finishes nor cancels, so waiting for it never resolves.
		 */
		static waitTransitionEnd(element: Element, propertyName?: string | string[] | null): Promise<void>;
		/**
		 * Resolves when the animations of the element are over, whether they finished or were cancelled.
		 * Call it after the change that starts the animation is applied: only the animations the element
		 * already has are awaited, all of them, including the ones started by somebody else. A movement
		 * started from a script by `Element.animate()` is awaited as well.
		 * `animationName` narrows the wait to the animations with the given names. A movement started from
		 * a script has no name of its own, so no given name ever matches it.
		 *
		 * The promise never rejects and resolves right away when there is nothing to wait for: the element
		 * has no animation at all or none with a given name, the list of names is empty, the argument is not
		 * an element, or none of the animations ends at a finite time (endless or on a progress timeline).
		 * A paused animation neither finishes nor cancels, so waiting for it never resolves.
		 */
		static waitAnimationEnd(element: Element, animationName?: string | string[] | null): Promise<void>;
	}

	class Easing {
		constructor(easingOptions: EasingOptions);
		setOptions(easingOptions: EasingOptions): void;
		setTransition(transition: TransitionFunction | string): void;
		animateProgress(): void;
		animate(): void;
		/**
		 * @private
		 * Compatible proxy for options
		 */
		get options(): EasingOptions;
		stop(completed?: boolean): void;
		static makeEaseInOut(delta: TransitionFunction): TransitionFunction;
		static makeEaseOut(delta: TransitionFunction): TransitionFunction;
		static get transitions(): Record<string, Function>;
	}

	class LocalStorage {
		constructor(storageOptions?: LocalStorageOptions);
		set(key: string, value: any, ttl?: number): boolean;
		get(key: string): JsonValue | null;
		remove(key: string): void;
		getPrefix(): string;
		getBasePrefix(): string;
	}

	const localStorage: LocalStorage;

	class Page {
		static getRootWindow(): Window;
		static isCrossOriginObject(currentWindow: any): boolean;
		static getTopWindowOfCurrentHost(currentWindow: any): Window;
		static getParentWindowOfCurrentHost(currentWindow: any): Window;
		static redirect(redirectUrl: string, redirectOptions?: PageRedirectOptions): void;
		static reload(): void;
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
	class HttpClient {
		/**
		 * The rest of the contract is exposed on the client itself, so a consumer
		 * reaching the global `BX.HttpClient` gets the error classes and the
		 * envelope helpers with it, instead of eight bare names in the shared `BX`
		 * root. The static request API is verbs (`request`, `get`, `action`, ...),
		 * these are nouns, so the two never collide.
		 */
		static readonly HttpClientError: typeof HttpClientError;
		static readonly HttpError: typeof HttpError;
		static readonly NetworkError: typeof NetworkError;
		static readonly TimeoutError: typeof TimeoutError;
		static readonly ParseError: typeof ParseError;
		static readonly ControllerError: typeof ControllerError;
		static readonly AssetLoadError: typeof AssetLoadError;
		static readonly isAjaxEnvelope: typeof isAjaxEnvelope;
		static readonly parseEnvelope: typeof parseEnvelope;
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
		constructor(config?: ClientConfig);
		request<T = unknown>(config: RequestConfig): Promise<HttpResponse<T>>;
		get<T = unknown>(url: string, config?: BodylessRequestConfig): Promise<HttpResponse<T>>;
		delete<T = unknown>(url: string, config?: BodylessRequestConfig): Promise<HttpResponse<T>>;
		head<T = unknown>(url: string, config?: BodylessRequestConfig): Promise<HttpResponse<T>>;
		post<T = unknown>(url: string, body?: RequestBody, config?: BodyRequestConfig): Promise<HttpResponse<T>>;
		put<T = unknown>(url: string, body?: RequestBody, config?: BodyRequestConfig): Promise<HttpResponse<T>>;
		patch<T = unknown>(url: string, body?: RequestBody, config?: BodyRequestConfig): Promise<HttpResponse<T>>;
		/**
		 * Calls an Engine controller action and resolves with the `data` payload
		 * of the envelope (`null` for an action that returns no data). Any other
		 * outcome rejects with a typed error. The action url is built from
		 * `controllerEndpoint` and `baseUrl` is ignored.
		 */
		action<T = unknown>(name: string, options?: ActionOptions): Promise<T | null>;
		/**
		 * Calls an Engine controller action and resolves with the whole envelope
		 * (`{status, data, errors}`) when its status is `success`. Errors are
		 * identical to `action()`.
		 */
		actionRaw<T = unknown>(name: string, options?: ActionOptions): Promise<AjaxEnvelope<T>>;
		/**
		 * Interceptors of the lazy default instance. They affect the static calls
		 * and never the instances created with `new HttpClient()`.
		 */
		static get interceptors(): HttpClientInterceptors;
		static request<T = unknown>(config: RequestConfig): Promise<HttpResponse<T>>;
		static get<T = unknown>(url: string, config?: BodylessRequestConfig): Promise<HttpResponse<T>>;
		static delete<T = unknown>(url: string, config?: BodylessRequestConfig): Promise<HttpResponse<T>>;
		static head<T = unknown>(url: string, config?: BodylessRequestConfig): Promise<HttpResponse<T>>;
		static post<T = unknown>(url: string, body?: RequestBody, config?: BodyRequestConfig): Promise<HttpResponse<T>>;
		static put<T = unknown>(url: string, body?: RequestBody, config?: BodyRequestConfig): Promise<HttpResponse<T>>;
		static patch<T = unknown>(url: string, body?: RequestBody, config?: BodyRequestConfig): Promise<HttpResponse<T>>;
		static action<T = unknown>(name: string, options?: ActionOptions): Promise<T | null>;
		static actionRaw<T = unknown>(name: string, options?: ActionOptions): Promise<AjaxEnvelope<T>>;
	}

	/**
	 * Base class of all errors thrown by the http client.
	 */
	class HttpClientError extends Error {
		cause?: unknown;
		/**
		 * How many retries the request had spent before it failed with this error.
		 * It is `0` for every error thrown without retrying, so a consumer reads the
		 * field instead of checking whether it exists. The retry loop is what fills
		 * it in (see `retry/run-with-retry.ts`): the transport that builds the error
		 * knows nothing about the series the attempt belongs to.
		 */
		retryCount: number;
		constructor(message: string, options?: {
			cause?: unknown;
		});
	}

	/**
	 * The request was sent, but the server responded with a non-2xx status.
	 */
	class HttpError<T = unknown> extends HttpClientError {
		readonly status: number;
		readonly response: HttpResponse<T> | null;
		constructor(status: number, response?: HttpResponse<T> | null, options?: {
			cause?: unknown;
		});
	}

	/**
	 * The request could not be sent or the response could not be received (network failure).
	 */
	class NetworkError extends HttpClientError {
		readonly url: string;
		constructor(options?: {
			url?: string;
			cause?: unknown;
		});
	}

	/**
	 * The request was aborted by the client timeout.
	 */
	class TimeoutError extends HttpClientError {
		readonly url: string;
		readonly timeout: number;
		constructor(options?: {
			url?: string;
			timeout?: number;
			cause?: unknown;
		});
	}

	/**
	 * The response body could not be parsed as the requested response type.
	 */
	class ParseError extends HttpClientError {
		readonly url: string;
		readonly responseType: HttpResponseType;
		constructor(options?: {
			url?: string;
			responseType?: HttpResponseType;
			cause?: unknown;
		});
	}

	/**
	 * A controller action responded with an ajax envelope where `status` is not `success`.
	 * The envelope may arrive over HTTP 200 as well as inside a non-2xx response body
	 * (e.g. 401 from the Authentication prefilter); `httpStatus` keeps the transport status.
	 *
	 * The fresh CSRF token an `invalid_csrf` error carries in `customData.csrf` is
	 * stripped from both `errors` and `envelope`, so logging the error as a whole
	 * cannot leak a valid token.
	 */
	class ControllerError<T = unknown> extends HttpClientError {
		readonly errors: AjaxEnvelopeError[];
		readonly envelope: AjaxEnvelope<T> | null;
		readonly httpStatus: number;
		constructor(options?: {
			errors?: AjaxEnvelopeError[];
			envelope?: AjaxEnvelope<T> | null;
			httpStatus?: number;
			cause?: unknown;
		});
	}

	/**
	 * A css or js asset delivered with an action response failed to load.
	 */
	class AssetLoadError extends HttpClientError {
		readonly url: string;
		readonly assetType: AssetType;
		constructor(options: {
			url?: string;
			assetType: AssetType;
			cause?: unknown;
		});
	}

	/**
	 * Checks whether a value is an Engine ajax envelope (the `AjaxJson` wire format):
	 * a plain object with a known `status` and an own `data` field.
	 */
	function isAjaxEnvelope(value: unknown): value is AjaxEnvelope;

	/**
	 * Extracts the ajax envelope from a transport response body. A response without
	 * an envelope (`Engine\Response\Json`, `HttpResponse`) is not treated as an error:
	 * `null` is returned and the caller keeps the plain transport response as is.
	 */
	function parseEnvelope<T = unknown>(response: HttpResponse): AjaxEnvelope<T> | null;

	function GetWindowScrollSize(doc?: Document): {
		scrollWidth: number;
		scrollHeight: number;
	};

	function GetWindowScrollPos(doc?: Document): {
		scrollLeft: number;
		scrollTop: number;
	};

	function GetWindowInnerSize(doc?: Document): {
		innerWidth: number;
		innerHeight: number;
	};

	function GetWindowSize(doc?: Document): WindowSize;

	function GetContext(node: Node | null): Window;

	function pos(element: any, relative?: boolean): any;

	function addCustomEvent(eventObject: any, eventName: any, eventHandler: any): void;

	function onCustomEvent(eventObject: any, eventName: any, eventParams?: any, secureParams?: any): void;

	function removeCustomEvent(eventObject: any, eventName: any, eventHandler: any): void;

	function removeAllCustomEvents(eventObject: any, eventName: any): void;

	function onGlobalCustomEvent(eventName: any, arEventParams: any, bSkipSelf: any): void;

	const getClass: typeof Reflection.getClass;

	const namespace: typeof Reflection.namespace;

	const message: MessageFunction;

	const easing: typeof Easing;

	const fx: typeof FX;

	/**
	 * @deprecated
	 */
	class FX {
		constructor(options: FXOptions);
		start(): this;
		stop(silent?: boolean): void;
		pause(): void;
		/**
		 * @deprecated
		 */
		static hide(el: any, type: any, opts: any): FX | void;
		/**
		 * @deprecated
		 */
		static show(el: HTMLElement | string, type: 'fade' | 'scroll', opts: any): FX | void;
	}

	const PageObject: typeof Page;

	/**
	 * @memberOf BX
	 */
	const replace: typeof Dom.replace;

	const remove: typeof Dom.remove;

	const clean: typeof Dom.clean;

	const insertBefore: typeof Dom.insertBefore;

	const insertAfter: typeof Dom.insertAfter;

	const append: typeof Dom.append;

	const prepend: typeof Dom.prepend;

	const style: typeof Dom.style;

	const adjust: typeof Dom.adjust;

	const create: typeof Dom.create;

	const isShown: typeof Dom.isShown;

	const addClass: (...args: any[]) => void;

	const removeClass: (...args: any[]) => void;

	const hasClass: (...args: any[]) => boolean;

	const toggleClass: (...args: any[]) => void;

	const cleanNode: (element: string | HTMLElement, removeElement?: boolean) => HTMLElement | null;

	const getCookie: typeof Http.Cookie.get;

	const setCookie: (name: string, value: any, options?: CookieOptions) => void;

	const bind: typeof bindFn;

	const unbind: typeof unbindFn;

	const unbindAll: (target: any, eventName?: string) => void;

	const bindOnce: typeof bindOnceFn;

	const ready: (handler: () => void) => void;

	/**
	 * For compatibility only
	 * @type {boolean}
	 */
	let isReady: boolean;

	const debugEnableFlag: boolean;

	const debugStatus: typeof debugNs.isDebugEnabled;

	const debug: typeof debugNs.default;

	const debugEnable: (value: any) => void;

	const clone: <T>(value: T) => T;

	const loadExt: typeof Runtime.loadExtension;

	const debounce: typeof Runtime.debounce;

	const throttle: typeof Runtime.throttle;

	const html: typeof Runtime.html;

	const type: TypeCompatLibrary;

	const browser: BrowserCompat;

	const ajax: any;

	/**
	 * Constants and lookup tables of the legacy layer (MOD-01).
	 *
	 * The six public constants go into the global namespace; the two tables are internal to the
	 * subtree and are imported directly by the modules that read them - no ring passes through them,
	 * so late binding buys nothing here.
	 */
	/**
	 * Mouse buttons as a bit mask: `getEventButton` combines them with a bitwise or.
	 */
	const MSLEFT = 1;

	const MSMIDDLE = 2;

	const MSRIGHT = 4;

	/**
	 * Am/pm mode. The types are deliberately uneven - `AM_PM_NONE` is `false`, not `0`, and callers
	 * compare `BX.isAmPmMode()` against it strictly.
	 */
	const AM_PM_UPPER = 1;

	const AM_PM_LOWER = 2;

	const AM_PM_NONE = false;

	/**
	 * Inheritance and merging - `ext`, `extend`, `is_subclass_of`, `merge`, `mergeEx` (MOD-01).
	 *
	 * `merge` calls `BX.util.array_merge` and `BX.util.objectMerge` calls `BX.mergeEx`: the two
	 * modules form a ring, so both directions go through the global rather than through an import
	 * (ADR 3.4). The differences between `merge` and `mergeEx` - array handling, the `isUIWidget`
	 * escape hatch, cloning - are not interchangeable and are pinned by
	 * `test/old/core/inherit.test.ts`.
	 */
	function ext(this: any, ob: any): void;

	function extend(child: any, parent: any): void;

	function is_subclass_of(ob: any, parent_class: any): boolean;

	function merge(...arg: any[]): any;

	function mergeEx(...arg: any[]): any;

	/**
	 * `BX.util` — 45 subfunctions used by 720 files (MOD-01).
	 *
	 * Transcribed from `src/old/core.js` without behaviour changes: loose comparisons, mutations of
	 * the arguments, the default values and the answers on a nil or wrongly typed argument are all
	 * part of the contract at this consumer count, and `test/old/core/util.test.ts` pins them.
	 * Neighbouring groups (`BX.mergeEx`, `BX.clone`, `BX.type`, `BX.Text`, `BX.Uri`, `BX.browser`,
	 * `BX.create`) are reached through the global on purpose — see `internal/global.ts`.
	 *
	 * The heading the source file carries over this block: some useful util functions.
	 */
	const util: {
		/**
		 * @deprecated
		 * @use [].filter(value => !BX.Type.isNil(value))
		 * @param ar
		 * @return {*}
		 */
		array_values(ar: any): any;
		/**
		 * @deprecated
		 * @use Object.values([]).filter(value => !BX.Type.isNil(value))
		 * @param ar
		 * @return {Array}
		 * @private
		 */
		_array_values_ob(ar: any): any[];
		/**
		 * @deprecated
		 * @use
		 * @param ar
		 * @return {*}
		 */
		array_keys(ar: any): any;
		_array_keys_ob(ar: any): string[];
		object_keys(obj: any): string[];
		/**
		 * @deprecated
		 * @use firstArr.concat(secondArr);
		 * @param first
		 * @param second
		 * @return {*[]}
		 */
		array_merge(first: any, second: any): any[];
		array_flip(object: any): Record<string, string>;
		array_diff(ar1: any, ar2: any, hash?: any): any[];
		/**
		 * @deprecated
		 * @use Set
		 */
		array_unique(ar: any): any;
		/**
		 * @deprecated
		 * @use myArr.includes(needle)
		 */
		in_array(needle: any, haystack: any): boolean;
		/**
		 * @deprecated
		 * @use myArr.findIndex(item => item === needle);
		 */
		array_search(needle: any, haystack: any): number;
		object_search_key(needle: any, haystack: any): any;
		trim(s: any): any;
		urlencode(s: any): string;
		deleteFromArray(ar: any, ind: any): any[];
		insertIntoArray(ar: any, ind: any, el: any): any[];
		htmlspecialchars(str: any): string;
		htmlspecialcharsback(str: any): string;
		preg_quote(str: any, delimiter?: any): any;
		jsencode(str: any): any;
		getCssName(jsName: any): string;
		getJsName(cssName: any): any;
		nl2br(str: any): any;
		/**
		 * @deprecated
		 * @use .padStart() / .padEnd()
		 * @param input
		 * @param pad_length
		 * @param pad_string
		 * @param pad_type
		 * @return {*}
		 */
		str_pad(input: any, pad_length: any, pad_string?: any, pad_type?: any): string;
		str_pad_left(input: any, pad_length: any, pad_string?: any): string;
		str_pad_right(input: any, pad_length: any, pad_string?: any): string;
		strip_tags(str: any): string;
		strip_php_tags(str: any): string;
		popup(url: any, width: any, height: any): Window | null;
		shuffle(array: any): any;
		objectSort(object: any, sortBy: any, sortDir?: any): any[];
		objectMerge(): any;
		objectClone(object: any): any;
		hex2rgb(color: any): {
			r: number;
			g: number;
			b: number;
		};
		/**
		 * @deprecated
		 * @use BX.Uri
		 * @param url
		 * @param param
		 * @return {string}
		 */
		remove_url_param(url: any, param: any): string;
		/**
		 * @deprecated
		 * @use BX.Uri
		 * @param url
		 * @param params
		 * @return {string}
		 */
		add_url_param(url: any, params: any): string;
		buildQueryString(params: any): string;
		even(digit: any): boolean;
		hashCode(str: any): number;
		getRandomString(length?: any): string;
		number_format(number: any, decimals?: any, dec_point?: any, thousands_sep?: any): string;
		getExtension(url: any): string;
		addObjectToForm(object: any, form: any, prefix?: any): void;
		observe(object: any, enable: any): boolean;
		escapeRegExp(str: any): string;
	};

	/**
	 * `BX.prop` - ten accessors used by 454 files (MOD-01).
	 *
	 * The family looks uniform and is not: only half of the methods consult `hasOwnProperty`,
	 * `getInteger` does not truncate a value that is already a number, `getBoolean` accepts only the
	 * string "true", `getString` drops the default value once the property exists, and `extractDate`
	 * works in place. Every one of these is transcribed as it stands and pinned by
	 * `test/old/core/prop.test.ts` - see FIX-01, "transcribed verbatim".
	 */
	const prop: {
		get(object: any, key: any, defaultValue?: any): any;
		getObject(object: any, key: any, defaultValue?: any): any;
		getElementNode(object: any, key: any, defaultValue?: any): any;
		getArray(object: any, key: any, defaultValue?: any): any;
		getFunction(object: any, key: any, defaultValue?: any): any;
		getNumber(object: any, key: any, defaultValue?: any): any;
		getInteger(object: any, key: any, defaultValue?: any): any;
		getBoolean(object: any, key: any, defaultValue?: any): any;
		getString(object: any, key: any, defaultValue?: any): any;
		extractDate(datetime?: any): Date;
	};

	/**
	 * Tree walking and node matching (MOD-01).
	 *
	 * `checkNode` is the core of every `findChild*`, `findParent`, `findNextSibling`,
	 * `findPreviousSibling` and - from the neighbouring module - `delegateEvent`. It is also the
	 * published `BX.checkNode` itself: the layer used to wrap it in a one-line forwarder, and the
	 * export publishes the same function the neighbours already import by name. Inside the subtree it
	 * is reached by a plain import - nothing calls back the other way, so there is no ring and late
	 * binding would buy nothing (ADR 3.4).
	 *
	 * Three defects and one short-circuit inside it are carried over verbatim (FIX-01): the
	 * `attribute` and `property` array branches test the whole array instead of its element, the
	 * `property` object branch ignores anything that is neither a string nor a RegExp, and a
	 * `callback` key returns out of the loop so the key order of `params` decides the answer. All
	 * four are pinned by `test/old/core/dom-traverse.test.ts` as the behaviour consumers have today.
	 */
	function firstChild(el: any): any;

	function lastChild(el: any): any;

	function previousSibling(el: any): any;

	function nextSibling(el: any): any;

	/**
	 * @deprecated
	 * @use .querySelectorAll
	 * @param obj
	 * @param className
	 * @param recursive
	 * @return {*}
	 */
	function findChildrenByClassName(obj: any, className: any, recursive?: any): any;

	/**
	 * @deprecated
	 * @use .querySelector
	 * @param obj
	 * @param className
	 * @param recursive
	 * @return {*}
	 */
	function findChildByClassName(obj: any, className: any, recursive?: any): any;

	/**
	 * @deprecated
	 * @use .querySelectorAll
	 * @param obj
	 * @param params
	 * @param recursive
	 * @return {*|Node}
	 */
	function findChildren(obj: any, params: any, recursive?: any): any;

	/**
	 * @deprecated
	 * @use .querySelectorAll
	 * @param obj
	 * @param params
	 * @param recursive
	 * @param get_all
	 * @return {*}
	 */
	function findChild(obj: any, params: any, recursive?: any, get_all?: any): any;

	/**
	 * @deprecated
	 * @use .closest()
	 * @param obj
	 * @param params
	 * @param maxParent
	 * @return {*}
	 */
	function findParent(obj: any, params: any, maxParent?: any): any;

	/**
	 * @deprecated
	 * @use .querySelector
	 * @param obj
	 * @param params
	 * @return {*}
	 */
	function findNextSibling(obj: any, params: any): any;

	/**
	 * @deprecated
	 * @use .querySelector
	 * @param obj
	 * @param params
	 * @return {*}
	 */
	function findPreviousSibling(obj: any, params: any): any;

	function checkNode(obj: any, params: any): any;

	/**
	 * @deprecated
	 * @use .querySelectorAll
	 * @param form
	 * @return {Array}
	 */
	function findFormElements(form: any): any;

	/**
	 * @deprecated
	 * @use .contains()
	 * @param whichNode
	 * @param forNode
	 * @return {boolean}
	 */
	function isParentForNode(whichNode: any, forNode: any): boolean;

	function clearNodeCache(): boolean;

	/**
	 * Creates document fragment with child nodes.
	 *
	 * @param {Node[]} nodes
	 * @return {DocumentFragment}
	 */
	function createFragment(nodes?: any): DocumentFragment;

	function isNodeInDom(node: any, doc?: any): boolean;

	function isNodeHidden(node: any): boolean;

	function delegate(func: any, thisObject: any): any;

	function delegateLater(func_name: any, thisObject: any, contextObject?: any): any;

	function proxy(func: any, thisObject: any): any;

	function defer(func: any, thisObject?: any): any;

	function defer_proxy(func: any, thisObject: any): any;

	function once(el: any, evname: any, func: any): any;

	function bindDelegate(elem: any, eventName: any, isTarget: any, handler: any): any;

	function delegateEvent(isTarget: any, handler: any): any;

	function garbage(call: any, thisObject?: any): void;

	function getEventButton(e: any): number;

	function CaptureEvents(el_c: any, evname_c: any): void;

	function CaptureEventsGet(): any[] | null;

	function fireEvent(ob: any, ev: any): any;

	function getWheelData(e: any): any;

	function False(): boolean;

	function DoNothing(): void;

	function denyEvent(el: any, ev: any): void;

	function allowEvent(el: any, ev: any): void;

	function fixEventPageXY(event: any): any;

	function fixEventPageX(event: any): any;

	function fixEventPageY(event: any): any;

	/**
	 * @deprecated
	 * @see e.preventDefault()
	 */
	function PreventDefault(e: any): boolean;

	/**
	 * @deprecated
	 * @see e.preventDefault();
	 *
	 * @param e
	 * @return {boolean}
	 */
	function eventReturnFalse(e: any): boolean;

	/**
	 * @deprecated
	 * @see e.stopPropagation()
	 * @param e
	 */
	function eventCancelBubble(e: any): void;

	function bindDebouncedChange(node: any, fn: any, fnInstant?: any, timeout?: any, ctx?: any): void;

	function getEventTarget(e: any): any;

	/**
	 * Display, geometry and scrolling (MOD-01).
	 *
	 * The private `_checkDisplay` and the trio `show`/`hide`/`toggle` share one piece of state, and it
	 * lives on the DOM node itself: the original `display` is parked in a `BXDISPLAY` property. That
	 * is observable and consumers read it, so it stays a plain property rather than becoming a
	 * WeakMap.
	 *
	 * `toggle` carries FIX-01 #4: its array branch reads the loop counter and the length *after* the
	 * loop has finished, which only works while both live in the function scope. Declaring them with
	 * `let` inside the `for` would move them into the block and silently delete the branch that
	 * handles "the current value is not in the list" - so they are declared before the loop, on
	 * purpose. `test/old/core/dom-style.test.ts` pins that branch.
	 */
	/**
	 * @deprecated
	 * @use BX.style
	 * @param element
	 * @param opacity
	 */
	function setOpacity(element: any, opacity: any): void;

	function show(ob: any, displayType?: any): void;

	function hide(ob: any, displayType?: any): void;

	function toggle(ob: any, values?: any): any;

	function GetDocElement(pDoc?: any): any;

	function scrollTop(node: any, val?: any): any;

	function scrollLeft(node: any, val?: any): any;

	function hide_object(ob: any): void;

	function is_relative(el: any): boolean;

	function is_float(el: any): boolean;

	function is_fixed(el: any): boolean;

	function width(node: any, val?: any): any;

	function height(node: any, val?: any): any;

	function align(pos: any, w: any, h: any, type?: any): {
		left: any;
		top: any;
	};

	function scrollToNode(node: any): void;

	function styleIEPropertyName(name: any): any;

	/**
	 * Focus, hover decoration, selectability and the caret (MOD-01).
	 *
	 * The group has no shared state; what holds it together is that every function writes a marker
	 * onto the node it is given - a class plus a `BXHOVER`/`BXFOCUS` property - and that the whole
	 * set is the deprecated half of the old focus API.
	 *
	 * Note that `focusEvents` binds to the pointer entering and leaving, not to focus and blur,
	 * despite its name. That is carried over as it is: the map it returns is what consumers pass to
	 * `BX.adjust`.
	 */
	function focus(el: any): boolean;

	/**
	 * @deprecated
	 * @param el
	 * @return {*}
	 */
	function hoverEvents(el?: any): any;

	/**
	 * @deprecated
	 */
	function hoverEventsHover(this: any): void;

	/**
	 * @deprecated
	 */
	function hoverEventsHout(this: any): void;

	/**
	 * @deprecated
	 */
	function focusEvents(el?: any): any;

	/**
	 * @deprecated
	 */
	function focusEventsFocus(this: any): void;

	/**
	 * @deprecated
	 */
	function focusEventsBlur(this: any): void;

	function setUnselectable(node: any): void;

	function setSelectable(node: any): void;

	function getCaretPosition(node: any): number;

	function setCaretPosition(node: any, pos: any): void;

	function setJSList(scripts: any): void;

	function getJSList(): any[];

	function setCSSList(cssFiles: any): void;

	function getCSSList(): any[];

	function getJSPath(js: any): string;

	function getCSSPath(css: any): string;

	function getCDNPath(path: any): any;

	function loadScript(script: any, callback?: any, doc?: any): any;

	/**
	 * The asymmetry with `loadScript` is carried over: no callback parameter, `null` passed down in
	 * its place, a `win` parameter that is declared and never read, and no return value.
	 */
	function loadCSS(css: any, doc?: any, win?: any): void;

	function load(items: any, callback?: any, doc?: any, reject?: any): any;

	function reload(back_url?: any, bAddClearCache?: any): void;

	function clearCache(): void;

	function showWait(node?: any, msg?: any): any;

	function closeWait(node?: any, obMsg?: any): void;

	/**
	 * Date parsing, formatting and the name template (MOD-01).
	 *
	 * No shared state; the group is held together by the formats it reads out of `BX.message` and by
	 * `parseDate` calling `getNumMonth`.
	 *
	 * FIX-01 #2 is closed here: `getNumMonth` wrote its loop counter into an implicit global, and in
	 * the strict mode a module runs under that is a ReferenceError rather than a leak - the function
	 * did not work at all in the test bundle before this. FIX-01 #3 turned out not to apply:
	 * `parseDate` declares its `i` in the `var` list further down, so the loop above it only depends
	 * on hoisting, and nothing has to change. With that, AC-015 is closed.
	 */
	function isAmPmMode(returnConst?: any): any;

	function formatDate(date?: any, format?: any): string;

	function formatName(user?: any, template?: any, login?: any): string;

	function getNumMonth(month: any): any;

	function parseDate(str: any, bUTC?: any, dateFormat?: any, formatDatetime?: any): any;

	/**
	 * Markup splitting, global evaluation, the template helper and JSON parsing (MOD-01).
	 *
	 * `processHTML` no longer scans the markup itself: it delegates to `Runtime.extractAssets` and
	 * reshapes the answer into the `{ HTML, SCRIPT, STYLE }` its consumers were given. The table of
	 * regular expressions that used to live here is gone with it, and so are the defects it carried -
	 * a search position shared between calls, a value read from whichever attribute matched first,
	 * a closing tag recognised only in its plainest form. Consumers see those fixed; the shape of
	 * the answer, and the throw on a null input, are unchanged.
	 */
	/**
	 * Takes the scripts and stylesheet links out of the markup.
	 *
	 * @deprecated
	 * @use BX.Runtime.extractAssets
	 *
	 * A thin shape adapter over `extractAssets`: the work is done there, and this reshapes the
	 * result into `{ HTML, SCRIPT, STYLE }` with `JS` carrying either the address or the body.
	 * New code should call `extractAssets` and read named fields off a typed result instead.
	 *
	 * Nothing is scheduled for removal: the wrapper stays for the consumers that have not moved.
	 */
	function processHTML(data: any, scriptsRunFirst?: any): any;

	function parseJSON(data: any, context?: any): any;

	function evalPack(code: any): void;

	function evalGlobal(data: any): void;

	function template(tpl: any, callback: any, bKillTpl?: any): void;

	/******* HINT ***************/
	function hint(el: any, hint_title?: any, hint_html?: any, hint_id?: any): void;

	function hint_replace(el: any, hint_title?: any, hint_html?: any): any;

	/**
	 * Node-attached data (MOD-01).
	 *
	 * `BX.data`, the storage constructor and the single instance between them are one group: the
	 * accessor is nothing but a thin read/write front for that one instance, and a second instance
	 * would mean data written through `BX.data` that `BX.data` cannot read back.
	 *
	 * FIX-01 #5 is closed here. In the source the instance is created on the very last line of the
	 * file, after the function that uses it, and that works only because `var` is hoisted - the
	 * accessor is never called during the load, so by the time anyone calls it the assignment has
	 * happened. A module has no such hoisting, and the same order would leave the accessor closing
	 * over a binding in its temporal dead zone. The order is therefore written out explicitly:
	 * constructor, then instance, then accessor. Nothing observable changes; what changes is that the
	 * dependency is now stated rather than implied.
	 *
	 * The leak is carried over as it is: the keys are numbers in a plain object, so a node that has
	 * left the document is still held. A `WeakMap` would not hold it, and that is exactly why it is
	 * not one - the change would be observable to anyone reading data off a detached node.
	 */
	function DataStorage(this: any): void;

	function data(node: any, key?: any, value?: any): any;

	/**
	 * The two validators (MOD-01). No shared state; they are one namespace on the public surface and
	 * `contract.test.ts` asserts both members of it.
	 *
	 * `checkIfPhone` carries three defects and all three are carried over verbatim (Q-2, FIX-01
	 * "handled separately" #1). Fixing any of them changes the answer for a consumer, and the first
	 * one changes it on every portal that has the telephony module:
	 *
	 * 1. the condition is inverted - the branch taken when `BX.PhoneNumber` is *absent* is the one
	 *    that calls into it, so the function throws exactly where it meant to fall back, and the
	 *    fallback pattern runs only where the module is present;
	 * 2. the `\s` after the optional plus is written with a single backslash, so it reaches the
	 *    constructor as a literal `s` rather than a whitespace class;
	 * 3. inside `[0-9(-)\s]` the hyphen sits between two characters and is read as a range from `(`
	 *    to `)`, so a number written with dashes is refused.
	 *
	 * `test/old/core/misc.test.ts` pins all three as facts.
	 */
	const validation: {
		checkIfEmail(s: any): boolean;
		checkIfPhone(s: any): boolean;
	};

	/**
	 * The two converters (MOD-01). No shared state; one namespace on the public surface.
	 */
	const convert: {
		toNumber(value: any): number;
		nodeListToArray(nodes: any): any[];
	};

	/**
	 * The eleven helpers for `<select>` elements (MOD-01).
	 *
	 * The group has no shared state, and what holds it together is a calling convention: the methods
	 * reach their neighbours through `this` - `sortSelect` calls `this.optionCompare`,
	 * `addNewOption` calls `this.sortSelect`, `addSelectedOptions` calls `this.addNewOption`. Turning
	 * them into free functions of a module would pass every behavioural test and still break every
	 * consumer who takes a method off the namespace, so the object stays an object with methods.
	 * `test/old/core/select-utils.test.ts` detaches one on purpose and asserts it throws.
	 *
	 * Two things are carried over as they are. `addNewOption` returns early on a duplicate, *before*
	 * the sorting, so a call that asked for both gets neither. And `addSelectedOptions` hands its two
	 * flags to `addNewOption` in the opposite order to the one its own parameter names announce -
	 * they land in the right slots, so the code works, but anyone re-deriving the call from the names
	 * will get it backwards.
	 *
	 * `sortSelect`, `moveOptionsUp` and `moveOptionsDown` rebuild their options with `new Option`,
	 * which knows nothing about attributes: everything but the text and the value is lost. That is
	 * observable and stays.
	 */
	const selectUtils: {
		addNewOption(this: any, oSelect: any, opt_value: any, opt_name: any, do_sort?: any, check_unique?: any): void;
		deleteOption(oSelect: any, opt_value: any): void;
		deleteSelectedOptions(oSelect: any): void;
		deleteAllOptions(oSelect: any): void;
		optionCompare(record1: any, record2: any): number;
		sortSelect(this: any, oSelect: any): void;
		selectAllOptions(oSelect: any): void;
		selectOption(oSelect: any, opt_value: any): void;
		addSelectedOptions(this: any, oSelect: any, to_select_id: any, check_unique?: any, do_sort?: any): void;
		moveOptionsUp(oSelect: any): void;
		moveOptionsDown(oSelect: any): void;
	};

	/**
	 * The two symbols that found no smaller home (MOD-01).
	 *
	 * `misc.ts` is deliberately small. MOD-01 keeps a symbol with the module it belongs with rather
	 * than in a catch-all: `False` and `DoNothing` live in `events.ts`, where their identity matters,
	 * `parseJSON` in `html.ts`, `clearNodeCache` and `createFragment` in `dom-traverse.ts`. What is
	 * left here is the session-id reader and the form submitter, and they share nothing but the fact
	 * that the submitter calls the reader.
	 */
	function bitrix_sessid(): any;

	function submit(obForm: any, action_name?: any, action_value?: any, onAfterSubmit?: any): void;
}
