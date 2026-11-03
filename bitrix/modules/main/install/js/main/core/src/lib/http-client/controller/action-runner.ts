import Type from '../../type';
import { ControllerError, HttpClientError, HttpError, ParseError } from '../errors';
import type { HttpClient } from '../http-client';
import { withRetryCount } from '../retry';
import { processAssets } from './assets';
import type { AjaxAssets } from './assets';
import { getCsrfToken, getSiteId, setCsrfToken } from './csrf';
import { parseEnvelope } from './envelope';
import { bxAjaxHeaderName, csrfHeaderName, siteIdHeaderName } from './internal/portal-headers';
import { isSameOrigin } from './internal/same-origin';
import type {
	ActionOptions,
	AjaxEnvelope,
	AjaxNavigation,
	ClientConfig,
	EffectiveRequestConfig,
	HttpResponse,
	QueryParams,
	RequestConfig,
} from '../types';

const defaultControllerEndpoint = '/bitrix/services/main/ajax.php';

// the action name grammar of the backend resolver (main/lib/engine/Router.php + Resolver.php):
// an optional vendor prefix before ":" (the module id alphabet, see ModuleManager::isValidModule)
// and at least two dot-separated segments — the module id, then the controller path and the action
const actionNamePattern = /^(?:[a-zA-Z0-9_.-]+:)?[a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9_-]+)+$/;

function isValidAnalytics(analytics: Record<string, unknown>): boolean
{
	const requiredFields = ['event', 'tool', 'category'];
	const invalidRequired = requiredFields.find((field) => !Type.isStringFilled(analytics[field]));
	if (!Type.isUndefined(invalidRequired))
	{
		console.error(
			`main.core HttpClient: the "${invalidRequired}" property in the {analytics} object must be a non-empty string.`,
		);

		return false;
	}

	const additionalFields = ['p1', 'p2', 'p3', 'p4', 'p5'];
	const invalidAdditional = additionalFields.find((field) => {
		const value = analytics[field];

		return (
			!Type.isUndefined(value)
			&& (!Type.isString(value) || value.split('_').length > 2)
		);
	});
	if (!Type.isUndefined(invalidAdditional))
	{
		console.error(
			`main.core HttpClient: the "${invalidAdditional}" property in the {analytics} object`
			+ ' must be a string containing at most one underscore.',
		);

		return false;
	}

	return true;
}

/**
 * Turns the `analytics`/`analyticsLabel` options into the `st`/`analyticsLabel`
 * query parameters. Invalid `analytics` is reported to the console and skipped,
 * the request itself is never blocked.
 */
function buildAnalyticsParams(options: ActionOptions): QueryParams
{
	const params: QueryParams = {};
	const label = options.analyticsLabel;
	if (Type.isStringFilled(label) || Type.isPlainObject(label))
	{
		params.analyticsLabel = label;
	}

	if (Type.isUndefined(options.analytics))
	{
		return params;
	}

	if (!Type.isPlainObject(options.analytics))
	{
		console.error('main.core HttpClient: {analytics} must be an object and is skipped.');

		return params;
	}

	if (!Type.isUndefined(params.analyticsLabel))
	{
		delete params.analyticsLabel;
		console.error(
			'main.core HttpClient: only {analytics} or {analyticsLabel} should be used.'
			+ ' If both are present, {analyticsLabel} will be ignored.',
		);
	}

	if (isValidAnalytics(options.analytics))
	{
		params.st = options.analytics;
	}
	else
	{
		console.error('main.core HttpClient: {analytics} is invalid and is skipped.');
	}

	return params;
}

function buildNavigationValue(navigation: AjaxNavigation | undefined): string | null
{
	if (!Type.isPlainObject(navigation))
	{
		return null;
	}

	const parts: string[] = [];
	if (navigation.page)
	{
		parts.push(`page-${navigation.page}`);
	}

	if (navigation.size)
	{
		parts.push(`size-${navigation.size}`);
	}

	return parts.length > 0 ? parts.join('-') : null;
}

/**
 * What a silent CSRF re-send carries over from the send that asked for it: the
 * fresh token it must use, the retries the operation has already spent and the
 * moment the operation started.
 *
 * The retry loop of the transport lives inside one `#send`, so the re-send
 * would otherwise open budgets of its own — of attempts and of time — and the
 * two loops would multiply. Carrying both over makes the pair "attempt + its
 * CSRF re-send" cost exactly one unit of the budget, as the layer requires.
 */
type CsrfRetry = {
	token: string;
	spentRetries: number;
	startedAt: number;
};

/**
 * Retries the finished send has spent, taken from the error it ended with. A
 * successful send reports the same number on `retryCount` of its response, so
 * both outcomes of one send are equally able to tell the budget they consumed.
 */
function spentRetriesOf(error: unknown): number
{
	return error instanceof HttpClientError ? error.retryCount : 0;
}

/**
 * Hands the request of a CSRF re-send what the send that asked for the token has
 * already consumed, so the re-send continues that series instead of restarting
 * it: the attempts from the count it spent, the budget of time from its start.
 * Both fields are internal to the layer and never part of the public config.
 */
function carryOverSpentBudget(config: RequestConfig, csrfRetry: CsrfRetry | null): void
{
	if (csrfRetry === null)
	{
		return;
	}

	const internal = config as EffectiveRequestConfig;
	internal.startedAt = csrfRetry.startedAt;
	if (csrfRetry.spentRetries > 0)
	{
		internal.spentRetries = csrfRetry.spentRetries;
	}
}

/**
 * Finds a fresh CSRF token in the `invalid_csrf` controller error.
 * A missing `customData` (or a `customData` without a token) is not an error:
 * the client just skips the silent retry.
 */
function extractCsrfRetryToken(envelope: AjaxEnvelope<unknown>): string | null
{
	const csrfError = envelope.errors.find((error) => error?.code === 'invalid_csrf');
	if (Type.isUndefined(csrfError))
	{
		return null;
	}

	const { customData } = csrfError;
	if (!Type.isPlainObject(customData) || !Type.isStringFilled((customData as { csrf?: unknown }).csrf))
	{
		return null;
	}

	return (customData as { csrf: string }).csrf;
}

/**
 * The built-in asset pipeline: when a successful action response is marked
 * with the `X-Process-Assets` header, the css/js/settings assets listed in
 * `envelope.data.assets` are loaded before the consumer promise resolves.
 */
async function loadResponseAssets(response: HttpResponse): Promise<void>
{
	// the asset pipeline is a same-origin protocol: a cross-origin controllerEndpoint
	// (or the final url after a redirect) must never drive the loading of same-origin
	// scripts or the insertion of settings strings
	if (!isSameOrigin(response.raw?.url) || !response.headers.get('X-Process-Assets'))
	{
		return;
	}

	const envelopeData = parseEnvelope(response)?.data;
	if (Type.isPlainObject(envelopeData))
	{
		await processAssets((envelopeData as { assets?: AjaxAssets }).assets);
	}
}

/**
 * The Engine controllers action mechanics (`/bitrix/services/main/ajax.php`)
 * driven over the transport `HttpClient`: action url and query, CSRF/site
 * headers for same-origin requests, one silent CSRF retry, envelope parsing,
 * the built-in asset pipeline and the two-level error model (`ControllerError`
 * over transport errors). It is an internal detail of `HttpClient#action`; user
 * interceptors live on the transport level and are not touched here.
 *
 * The runner only decides when to add the portal headers; the security invariant
 * "the portal headers never cross the origin" is enforced by the transport itself
 * on the final url of every request (see `HttpClient`), so an interceptor rewrite
 * of the action url cannot smuggle them off-origin.
 */
export class ActionRunner
{
	#client: HttpClient;
	#endpoint: string;
	#sameOrigin: boolean;

	constructor(client: HttpClient, config: ClientConfig)
	{
		this.#client = client;
		// the action url is resolved against the current page, so the instance `baseUrl`
		// (which may point to another origin) never affects where an action is sent
		this.#endpoint = new URL(config.controllerEndpoint ?? defaultControllerEndpoint, window.location.href).toString();
		this.#sameOrigin = isSameOrigin(this.#endpoint);
	}

	/**
	 * Calls an Engine controller action and resolves with the whole envelope
	 * (`{status, data, errors}`) when its status is `success`.
	 */
	run<T = unknown>(name: string, options: ActionOptions = {}): Promise<AjaxEnvelope<T>>
	{
		return this.#send<T>(name, options, null);
	}

	async #send<T>(name: string, options: ActionOptions, csrfRetry: CsrfRetry | null): Promise<AjaxEnvelope<T>>
	{
		if (!Type.isString(name) || !actionNamePattern.test(name))
		{
			// a malformed name never reaches the url: the call is rejected before the request is built
			throw new TypeError(`main.core HttpClient: invalid action name: "${String(name)}".`);
		}

		// the operation starts with the first send and a CSRF re-send continues it:
		// both budgets of the policy — of attempts and of time — are measured from here
		const startedAt = csrfRetry === null ? Date.now() : csrfRetry.startedAt;
		const config = this.#buildRequestConfig(name, options, csrfRetry);

		let response: HttpResponse;
		try
		{
			response = await this.#client.request(config);
		}
		catch (error)
		{
			const errorResponse = error instanceof HttpError ? error.response : null;
			const errorEnvelope = errorResponse === null ? null : parseEnvelope<T>(errorResponse);
			if (errorResponse === null || errorEnvelope === null)
			{
				// NetworkError, TimeoutError, the caller's AbortError, ParseError
				// or an HTTP error without an envelope in the body, passed through as is
				throw error;
			}

			// an envelope inside a non-2xx body (e.g. 401 from the Authentication prefilter)
			return this.#resolveEnvelope<T>(
				errorEnvelope,
				errorResponse,
				name,
				options,
				csrfRetry,
				{ spentRetries: spentRetriesOf(error), startedAt },
			);
		}

		const envelope = parseEnvelope<T>(response);
		if (envelope === null)
		{
			// the transport series is already over here, so the error of the action path
			// carries the counter the loop published on the response it succeeded with
			throw withRetryCount(
				new ParseError({ url: response.raw?.url, responseType: 'json' }),
				response.retryCount,
			);
		}

		// the response carries the retries the send spent, so a send that retried a
		// transport failure and then got an `invalid_csrf` envelope over HTTP 200
		// hands the re-send what is left of the budget instead of a fresh one
		return this.#resolveEnvelope<T>(
			envelope,
			response,
			name,
			options,
			csrfRetry,
			{ spentRetries: response.retryCount, startedAt },
		);
	}

	async #resolveEnvelope<T>(
		envelope: AjaxEnvelope<T>,
		response: HttpResponse,
		name: string,
		options: ActionOptions,
		csrfRetry: CsrfRetry | null,
		spent: Omit<CsrfRetry, 'token'>,
	): Promise<AjaxEnvelope<T>>
	{
		const csrfRetried = csrfRetry !== null;
		// a fresh token is trusted only from a same-origin response: a cross-origin
		// controllerEndpoint (or the final url after a redirect) must never be able to
		// write an arbitrary `bitrix_sessid` into the shared page-wide CSRF state
		if (!csrfRetried && isSameOrigin(response.raw?.url))
		{
			const freshToken = extractCsrfRetryToken(envelope);
			if (freshToken !== null)
			{
				setCsrfToken(freshToken);

				// exactly one silent retry, rebuilt from the original options. It carries
				// the retries this send already spent and the start of the operation, so
				// the pair costs one unit of the retry budget instead of opening a second
				// one — of attempts and of time alike
				return this.#send<T>(name, options, { ...spent, token: freshToken });
			}
		}

		// a non-2xx envelope is a controller error even when its own status claims success
		if (envelope.status !== 'success' || !response.ok)
		{
			throw withRetryCount(new ControllerError({ envelope, httpStatus: response.status }), spent.spentRetries);
		}

		try
		{
			await loadResponseAssets(response);
		}
		catch (error)
		{
			// the asset pipeline runs after the send succeeded and knows nothing about
			// the series that delivered the response, so the counter is published here
			throw withRetryCount(error, spent.spentRetries);
		}

		return envelope;
	}

	#buildRequestConfig(name: string, options: ActionOptions, csrfRetry: CsrfRetry | null): RequestConfig
	{
		const query: QueryParams = {
			...options.query,
			...buildAnalyticsParams(options),
		};

		const navigation = buildNavigationValue(options.navigation);
		if (navigation !== null)
		{
			query.nav = navigation;
		}

		query.action = name;

		const headers = new Headers(options.headers);
		if (this.#sameOrigin)
		{
			const siteId = getSiteId();
			if (siteId !== null)
			{
				headers.set(siteIdHeaderName, siteId);
			}

			// the CSRF token travels in the header only and never crosses the origin
			headers.set(bxAjaxHeaderName, 'true');
			const csrfToken = csrfRetry?.token ?? getCsrfToken();
			if (csrfToken !== null)
			{
				headers.set(csrfHeaderName, csrfToken);
			}
		}

		const config: RequestConfig = {
			// the action url is built from the controller endpoint, `baseUrl` is ignored
			url: this.#endpoint,
			method: options.method ?? 'POST',
			query,
			headers,
			// a same-origin Engine endpoint redirected to an external url would otherwise
			// carry the portal headers to the redirect target; `error` fails the request
			// instead of following it (the transport enforces the same rule for any
			// request that carries a portal header, this keeps it explicit and covers
			// the header-less action as well)
			redirect: 'error',
		};

		if (!Type.isUndefined(options.data))
		{
			config.body = options.data;
		}

		if (!Type.isUndefined(options.json))
		{
			config.json = options.json;
		}

		if (!Type.isUndefined(options.timeout))
		{
			config.timeout = options.timeout;
		}

		if (!Type.isUndefined(options.signal))
		{
			config.signal = options.signal;
		}

		if (!Type.isUndefined(options.retry))
		{
			config.retry = options.retry;
		}

		// the cross-tab options are relayed field by field like the ones above: the
		// action path builds its config from scratch and anything not listed here is
		// silently lost, and this path is the main consumer of the lock
		if (!Type.isUndefined(options.crossTabLockKey))
		{
			config.crossTabLockKey = options.crossTabLockKey;
		}

		if (!Type.isUndefined(options.crossTabLockTimeout))
		{
			config.crossTabLockTimeout = options.crossTabLockTimeout;
		}

		carryOverSpentBudget(config, csrfRetry);

		return config;
	}
}
