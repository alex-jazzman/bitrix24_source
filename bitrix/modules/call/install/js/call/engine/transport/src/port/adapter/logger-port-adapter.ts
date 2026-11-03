import type { LogDetails, LoggerPort } from '../logger-port';

/**
 * The logging primitive this adapter writes through, shaped like the console-style loggers of the
 * platform. Injected rather than imported: resolving it to the real logger is the business of the
 * composition root, and the transport keeps its subtree free of the messenger extensions that logger
 * sits on.
 */
export type LoggingPrimitive = {
	log: (...params: unknown[]) => void,
	warn: (...params: unknown[]) => void,
	error: (...params: unknown[]) => void,
};

type Severity = 'log' | 'warn' | 'error';

const REDACTED = '[redacted]';

/** A structure that refers back to itself cannot be copied, so the copy names the loop instead. */
const CIRCULAR = '[circular]';

/**
 * Words that make a field a secret. Matched as whole words of the name - `callToken`, `refresh_token`
 * and `apiKey` are secrets, while `authorName` and `keyboard` stay readable, which a substring match
 * would not manage.
 *
 * Session descriptions and ice candidates are here beside the authorization material: they carry the
 * local and internal addresses of the machine and the fingerprints of its dtls, so a description in
 * the log discloses the network behind the client.
 */
const SENSITIVE_WORDS = new Set([
	'token',
	'tokens',
	'secret',
	'secrets',
	'password',
	'passwd',
	'jwt',
	'key',
	'keys',
	'signature',
	'auth',
	'authorization',
	'credential',
	'credentials',
	'sessid',
	'sdp',
	'candidate',
	'candidates',
]);

/**
 * Whole names that are secrets without carrying a word of their own: the opaque blobs of the
 * connection descriptor, which the transport forwards without reading and which may hold
 * authorization material, and the address of the media server it names.
 */
const SENSITIVE_NAMES = new Set(['roomdata', 'connectiondata', 'mediaserverurl']);

/** `?token=...` and `&token=...` of a URL: the value goes, the host and the path stay readable. */
const URL_QUERY_PARAM = /([?&])([^=&#]+)=([^&#]*)/g;

type UnknownRecord = { [field: string]: unknown };

function nameWords(name: string): string[]
{
	return name
		.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
		.replace(/([a-z\d])([A-Z])/g, '$1 $2')
		.split(/[^a-zA-Z\d]+/)
		.map((word) => word.toLowerCase())
		.filter((word) => word !== '');
}

function isSensitiveName(name: string): boolean
{
	if (SENSITIVE_NAMES.has(name.replaceAll(/[^a-zA-Z\d]/g, '').toLowerCase()))
	{
		return true;
	}

	return nameWords(name).some((word) => SENSITIVE_WORDS.has(word));
}

function looksLikeUrl(value: string): boolean
{
	return (/^[a-z][a-z\d+.-]*:\/\//i).test(value) || value.startsWith('/');
}

function redactUrlSecrets(value: string): string
{
	if (!value.includes('?') || !looksLikeUrl(value))
	{
		return value;
	}

	return value.replaceAll(
		URL_QUERY_PARAM,
		(match: string, separator: string, name: string): string => {
			return isSensitiveName(name) ? `${separator}${name}=${REDACTED}` : match;
		},
	);
}

/** Only a plain object is walked into: an `Error` or a `Date` reaches the log as the value it is. */
function isPlainObject(value: unknown): value is UnknownRecord
{
	if (typeof value !== 'object' || value === null)
	{
		return false;
	}

	const prototype = Object.getPrototypeOf(value);

	return prototype === Object.prototype || prototype === null;
}

function redactValue(value: unknown, seen: WeakSet<object>): unknown
{
	if (typeof value === 'string')
	{
		return redactUrlSecrets(value);
	}

	if (!Array.isArray(value) && !isPlainObject(value))
	{
		return value;
	}

	if (seen.has(value))
	{
		return CIRCULAR;
	}

	// a value is held only while its own branch is walked: met again beside itself it is copied as data,
	// while a value referring back into the branch above it is a loop and is named one
	seen.add(value);

	const redacted = Array.isArray(value)
		? value.map((item) => redactValue(item, seen))
		: redactRecord(value, seen);

	seen.delete(value);

	return redacted;
}

/**
 * Built with `Object.fromEntries`, which defines own properties: a field named `__proto__` in the
 * details ends up as data of the copy instead of its prototype.
 */
function redactRecord(record: UnknownRecord, seen: WeakSet<object>): UnknownRecord
{
	return Object.fromEntries(
		Object.entries(record).map(([field, value]) => [
			field,
			isSensitiveName(field) ? REDACTED : redactValue(value, seen),
		]),
	);
}

/**
 * `LoggerPort` over a logging primitive, with the second level of secret protection: known sensitive
 * fields of `details` are redacted before anything is written, at every depth - `monitoring.token`
 * inside a connection descriptor goes the same way a top-level token does.
 *
 * This does not replace the first level, which is that components do not hand tokens or a whole
 * descriptor to the log in the first place; a general logger cannot recognise a secret in an arbitrary
 * object, so the two levels are needed together. `message` is written as it came: by contract it is a
 * fixed text and everything variable travels in `details`, which is what leaves redaction something to
 * work on.
 *
 * The adapter keeps no state - a redacted copy is built per call and nothing is held after the write,
 * so no secret outlives the connection through the logger.
 */
export class LoggerPortAdapter implements LoggerPort
{
	#primitive: LoggingPrimitive;

	constructor(primitive: LoggingPrimitive)
	{
		this.#primitive = primitive;
	}

	log(message: string, details?: LogDetails): void
	{
		this.#write('log', message, details);
	}

	warn(message: string, details?: LogDetails): void
	{
		this.#write('warn', message, details);
	}

	error(message: string, details?: LogDetails): void
	{
		this.#write('error', message, details);
	}

	#write(severity: Severity, message: string, details?: LogDetails): void
	{
		if (details === undefined)
		{
			this.#primitive[severity](message);

			return;
		}

		this.#primitive[severity](message, redactRecord(details, new WeakSet()));
	}
}
