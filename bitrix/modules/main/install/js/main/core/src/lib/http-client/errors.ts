import Type from '../type';
import type { AjaxEnvelope, AjaxEnvelopeError, AssetType, HttpResponse, HttpResponseType } from './types';

const sensitiveParams = [
	'sessid',
	'sessionid',
	'access_token',
	'refresh_token',
	'token',
	'tokens',
	'auth',
	'authtoken',
	'bearer',
	'jwt',
	'sid',
	'password',
	'pwd',
	'secret',
	'signature',
	'api_key',
	'apikey',
	'csrf',
];
// a parameter is sensitive when one of the words above is a whole segment of its
// name. Segments are split by `_`, `-`, `.` and by the bracket characters, plain
// (`credentials[password]`) or url-encoded (`credentials%5Bpassword%5D`) — the
// bracket names are exactly what `serializeQuery` produces. This matches the
// composed names the portal really uses (`bitrix_sessid`, `csrf_token`) and
// still leaves neutral names alone (`keyboard`, `authority`, `tokenizer`).
// Both patterns are anchored alternations over linear character classes, so the
// matching never backtracks catastrophically
const nameSeparator = '(?:[_.\\-[\\]]|%5B|%5D)';
const queryPairPattern = /([?&])([^=&#]*)=([^&#]*)/g;
const sensitiveNamePattern = new RegExp(
	`(?:^|${nameSeparator})(?:${sensitiveParams.join('|')})(?:$|${nameSeparator})`,
	'i',
);

/**
 * Replaces the credentials of an authority url (`user:password@host`) and
 * values of sensitive query parameters (session ids, tokens, passwords —
 * flat or inside bracket names) so they never leak into error messages
 * and error context fields.
 */
export function maskUrl(url: string): string
{
	let masked = url;
	try
	{
		const parsed = new URL(url);
		if (parsed.username !== '' || parsed.password !== '')
		{
			parsed.username = '***';
			parsed.password = '***';
			masked = parsed.toString();
		}
	}
	catch
	{
		// a relative url carries no authority credentials: only the query is masked
	}

	return masked.replace(queryPairPattern, (pair, delimiter: string, name: string) => {
		return sensitiveNamePattern.test(name) ? `${delimiter}${name}=***` : pair;
	});
}

function withUrl(message: string, url: string): string
{
	return url === '' ? message : `${message}: ${url}`;
}

/**
 * Base class of all errors thrown by the http client.
 */
export class HttpClientError extends Error
{
	cause?: unknown;

	/**
	 * How many retries the request had spent before it failed with this error.
	 * It is `0` for every error thrown without retrying, so a consumer reads the
	 * field instead of checking whether it exists. The retry loop is what fills
	 * it in (see `retry/run-with-retry.ts`): the transport that builds the error
	 * knows nothing about the series the attempt belongs to.
	 */
	retryCount: number = 0;

	constructor(message: string, options: { cause?: unknown } = {})
	{
		super(message);
		this.name = 'HttpClientError';

		if (!Type.isUndefined(options.cause))
		{
			this.cause = options.cause;
		}
	}
}

/**
 * The request was sent, but the server responded with a non-2xx status.
 */
export class HttpError<T = unknown> extends HttpClientError
{
	readonly status: number;
	readonly response: HttpResponse<T> | null;

	constructor(status: number, response: HttpResponse<T> | null = null, options: { cause?: unknown } = {})
	{
		super(withUrl(`Request failed with status ${status}`, maskUrl(response?.raw?.url ?? '')), options);
		this.name = 'HttpError';
		this.status = status;
		this.response = response;
	}
}

/**
 * The request could not be sent or the response could not be received (network failure).
 */
export class NetworkError extends HttpClientError
{
	readonly url: string;

	constructor(options: { url?: string; cause?: unknown } = {})
	{
		const url = maskUrl(options.url ?? '');
		super(withUrl('Network request failed', url), options);
		this.name = 'NetworkError';
		this.url = url;
	}
}

/**
 * The request was aborted by the client timeout.
 */
export class TimeoutError extends HttpClientError
{
	readonly url: string;
	readonly timeout: number;

	constructor(options: { url?: string; timeout?: number; cause?: unknown } = {})
	{
		const url = maskUrl(options.url ?? '');
		const timeout = options.timeout ?? 0;
		super(withUrl(`Request timed out after ${timeout}ms`, url), options);
		this.name = 'TimeoutError';
		this.url = url;
		this.timeout = timeout;
	}
}

/**
 * The response body could not be parsed as the requested response type.
 */
export class ParseError extends HttpClientError
{
	readonly url: string;
	readonly responseType: HttpResponseType;

	constructor(options: { url?: string; responseType?: HttpResponseType; cause?: unknown } = {})
	{
		const url = maskUrl(options.url ?? '');
		const responseType = options.responseType ?? 'json';
		super(withUrl(`Failed to parse response as "${responseType}"`, url), options);
		this.name = 'ParseError';
		this.url = url;
		this.responseType = responseType;
	}
}

/**
 * A css or js asset delivered with an action response failed to load.
 */
export class AssetLoadError extends HttpClientError
{
	readonly url: string;
	readonly assetType: AssetType;

	constructor(options: { url?: string; assetType: AssetType; cause?: unknown })
	{
		const url = maskUrl(options.url ?? '');
		super(withUrl('Failed to load asset', url), options);
		this.name = 'AssetLoadError';
		this.url = url;
		this.assetType = options.assetType;
	}
}

function hasCsrfCustomData(error: AjaxEnvelopeError): boolean
{
	return Type.isPlainObject(error?.customData) && 'csrf' in (error.customData as Record<string, unknown>);
}

/**
 * Drops the `csrf` key of `customData`: the `invalid_csrf` error of a failed
 * retry carries a fresh, still valid token, and the error object is routinely
 * logged as a whole. The other `customData` keys and the rest of the error are
 * kept as is; the errors without a token keep their original identity.
 */
function withoutCsrfCustomData(errors: AjaxEnvelopeError[]): AjaxEnvelopeError[]
{
	if (!errors.some((error) => hasCsrfCustomData(error)))
	{
		return errors;
	}

	return errors.map((error) => {
		if (!hasCsrfCustomData(error))
		{
			return error;
		}

		const { csrf, ...customData } = error.customData as Record<string, unknown>;

		return { ...error, customData };
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
export class ControllerError<T = unknown> extends HttpClientError
{
	readonly errors: AjaxEnvelopeError[];
	readonly envelope: AjaxEnvelope<T> | null;
	readonly httpStatus: number;

	constructor(
		options: {
			errors?: AjaxEnvelopeError[];
			envelope?: AjaxEnvelope<T> | null;
			httpStatus?: number;
			cause?: unknown;
		} = {},
	)
	{
		const envelope = options.envelope ?? null;
		const errors = withoutCsrfCustomData(options.errors ?? envelope?.errors ?? []);
		super(errors[0]?.message ?? 'Controller action failed', options);
		this.name = 'ControllerError';
		this.errors = errors;
		this.envelope = ControllerError.#sanitizeEnvelope(envelope);
		this.httpStatus = options.httpStatus ?? 200;
	}

	static #sanitizeEnvelope<T>(envelope: AjaxEnvelope<T> | null): AjaxEnvelope<T> | null
	{
		if (envelope === null)
		{
			return null;
		}

		const errors = withoutCsrfCustomData(envelope.errors ?? []);

		return errors === envelope.errors ? envelope : { ...envelope, errors };
	}
}
