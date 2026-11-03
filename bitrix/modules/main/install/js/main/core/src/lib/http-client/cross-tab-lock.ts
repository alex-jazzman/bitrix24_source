import Type from '../type';
import { HttpClientError, HttpError, NetworkError, ParseError, TimeoutError } from './errors';
import type { HttpResponse, HttpResponseType } from './types';

/**
 * Options of one cross-tab serialized call, read from the effective request
 * config after the request interceptors have run.
 */
export type CrossTabLockOptions = {
	key?: string;
	guardTimeout?: number;
	responseType?: HttpResponseType;
};

// no `url`: the final url of a response gates the CSRF retry and the asset pipeline
// in the controller runner, which trust it because the browser sets it after a real
// fetch. Carrying it over the channel would turn a same-origin script's message into
// an arbitrary `bitrix_sessid` and a script-loading trigger, so a waiting tab rebuilds
// its response with no url at all and both gates stay shut for it
type ResponseSnapshot = {
	status: number;
	ok: boolean;
	headers: Array<[string, string]>;
	data: unknown;
};

type LeaderMessage =
	| ({ outcome: 'response' } & ResponseSnapshot)
	| { outcome: 'error'; errorKind: 'http'; message: string; response: ResponseSnapshot }
	| { outcome: 'error'; errorKind: 'network' | 'timeout' | 'parse'; message: string }
	| { outcome: 'leaderGone' };

// `formData` is the one parsed body that is not reliably structured-cloneable, so a
// request asking for it is left out of the mechanism instead of failing at broadcast time
const transferableResponseTypes: ReadonlySet<HttpResponseType> = new Set(['json', 'text', 'blob']);

// only these headers travel to the waiting tabs: a `Headers` instance is not cloneable and
// a fixed set keeps the restored response predictable instead of "whatever the leader saw"
const transferableHeaderNames: readonly string[] = [
	'content-type',
	'content-language',
	'content-length',
	'etag',
	'last-modified',
	'x-bitrix-composite',
];

function isLocksApiAvailable(): boolean
{
	// Web Locks is [SecureContext]-only: on an http portal, inside a non-secure iframe or in
	// browsers older than Safari 15.4 / Firefox 96 `navigator.locks` is undefined. There is no
	// second primitive that gives real mutual exclusion, so the call degrades to a plain request
	return !Type.isUndefined(globalThis.navigator?.locks) && Type.isFunction(globalThis.navigator.locks.request);
}

function isChannelApiAvailable(): boolean
{
	return Type.isFunction(globalThis.BroadcastChannel);
}

function isApplicable(options: CrossTabLockOptions): boolean
{
	return Type.isStringFilled(options.key)
		&& transferableResponseTypes.has(options.responseType ?? 'json')
		&& isLocksApiAvailable()
		&& isChannelApiAvailable();
}

function snapshotHeaders(headers: Headers | null): Array<[string, string]>
{
	if (Type.isNil(headers))
	{
		return [];
	}

	return transferableHeaderNames.reduce((pairs: Array<[string, string]>, name) => {
		const value = headers.get(name);
		if (!Type.isNull(value))
		{
			pairs.push([name, value]);
		}

		return pairs;
	}, []);
}

function toSnapshot(response: HttpResponse): ResponseSnapshot
{
	return {
		status: response.status,
		ok: response.ok,
		headers: snapshotHeaders(response.headers),
		data: response.data,
	};
}

/**
 * Rebuilds a library response out of a snapshot, `raw` included: a caller reading
 * the response metadata must not stumble on a missing field. The rebuilt `raw`
 * carries the metadata and an already consumed body, the very invariant a real
 * response of this library holds.
 */
function fromSnapshot<T>(snapshot: ResponseSnapshot): HttpResponse<T>
{
	const headers = new Headers(snapshot.headers);
	// the raw response is built empty on purpose: its body is already consumed, the very
	// invariant a real response of this library holds, and its url stays the empty default
	const raw = new Response(null, {
		status: snapshot.status,
		headers,
	});

	return {
		status: snapshot.status,
		ok: snapshot.ok,
		headers,
		data: snapshot.data as T | null,
		raw,
		// this tab retried nothing: the retries of the leader are its own history, and
		// reporting them here would tell the caller about attempts it never made
		retryCount: 0,
	};
}

/**
 * Describes the outcome for the waiting tabs. A caller abort and a programmer
 * error (a `TypeError` from the request preparation) belong to the leader tab
 * alone: the waiting tabs are told the leader is gone and elect a new one
 * instead of inheriting someone else's abort.
 */
function toMessage(error: unknown): LeaderMessage
{
	if (error instanceof HttpError)
	{
		return {
			outcome: 'error',
			errorKind: 'http',
			message: error.message,
			response: toSnapshot(error.response as HttpResponse),
		};
	}

	if (error instanceof TimeoutError)
	{
		return { outcome: 'error', errorKind: 'timeout', message: error.message };
	}

	if (error instanceof NetworkError)
	{
		return { outcome: 'error', errorKind: 'network', message: error.message };
	}

	if (error instanceof ParseError)
	{
		return { outcome: 'error', errorKind: 'parse', message: error.message };
	}

	return { outcome: 'leaderGone' };
}

/**
 * A channel message is untrusted input, not a continuation of this tab's own fetch:
 * any script of the origin can post one. Everything that does not match the contract
 * exactly is dropped silently — a malformed snapshot must not reach `Headers` or
 * `Response`, whose constructors throw and would leave the waiting call hanging.
 */
function parseMessage(raw: unknown): LeaderMessage | null
{
	if (!Type.isPlainObject(raw))
	{
		return null;
	}

	const message = raw as Record<string, unknown>;
	if (message.outcome === 'leaderGone')
	{
		return { outcome: 'leaderGone' };
	}

	if (message.outcome === 'response')
	{
		const snapshot = parseSnapshot(message);

		return snapshot === null ? null : { outcome: 'response', ...snapshot };
	}

	if (message.outcome !== 'error' || !Type.isString(message.message))
	{
		return null;
	}

	if (message.errorKind === 'http')
	{
		const response = parseSnapshot(message.response);

		return response === null
			? null
			: { outcome: 'error', errorKind: 'http', message: message.message, response };
	}

	if (message.errorKind === 'network' || message.errorKind === 'timeout' || message.errorKind === 'parse')
	{
		return { outcome: 'error', errorKind: message.errorKind, message: message.message };
	}

	return null;
}

function parseSnapshot(raw: unknown): ResponseSnapshot | null
{
	if (!Type.isPlainObject(raw))
	{
		return null;
	}

	const snapshot = raw as Record<string, unknown>;
	// the range is the one `Response` accepts: a status outside it makes its constructor throw
	if (!Type.isNumber(snapshot.status) || snapshot.status < 200 || snapshot.status > 599)
	{
		return null;
	}

	if (!Type.isBoolean(snapshot.ok) || !Type.isArray(snapshot.headers))
	{
		return null;
	}

	const headers: Array<[string, string]> = [];
	for (const pair of snapshot.headers)
	{
		if (!Type.isArray(pair) || pair.length !== 2 || !Type.isString(pair[0]) || !Type.isString(pair[1]))
		{
			return null;
		}

		// only the names this side is willing to restore: a sender cannot widen the set
		if (transferableHeaderNames.includes(pair[0].toLowerCase()))
		{
			headers.push([pair[0], pair[1]]);
		}
	}

	return {
		status: snapshot.status,
		ok: snapshot.ok,
		headers,
		data: snapshot.data,
	};
}

function rebuildError(message: LeaderMessage & { outcome: 'error' }): HttpClientError
{
	if (message.errorKind === 'http')
	{
		const response = fromSnapshot(message.response);

		return new HttpError(response.status, response);
	}

	if (message.errorKind === 'timeout')
	{
		return new TimeoutError({ cause: message.message });
	}

	if (message.errorKind === 'network')
	{
		return new NetworkError({ cause: message.message });
	}

	return new ParseError({ cause: message.message });
}

type Outcome<T> = () => Promise<HttpResponse<T>>;

type Settled = {
	readonly value: boolean;
	mark: () => void;
};

// a closure rather than a class: this file already declares one (`Delivery`) and the
// project allows a single class per file
function createSettled(): Settled
{
	let settled = false;

	return {
		get value(): boolean
		{
			return settled;
		},
		mark: () => {
			settled = true;
		},
	};
}

function abortReason(signal: AbortSignal): unknown
{
	return signal.reason ?? new DOMException('The operation was aborted.', 'AbortError');
}

/**
 * Serializes concurrent requests of the tabs of one origin that pass the same key:
 * one tab acquires the lock and goes to the network, the others wait and settle
 * with a snapshot of its result. The key is read after the request interceptors,
 * so a handler rewriting it decides whom this tab coordinates with.
 *
 * Nothing is cached: the result is handed out within one contention window only,
 * a call arriving after the leader has settled opens a new window of its own.
 *
 * The mechanism is skipped, and `execute` is called straight away with neither
 * channel nor lock created, when there is no key, when the primitives are absent
 * or when the response type is not transferable between tabs.
 */
export function withCrossTabLock<T>(
	options: CrossTabLockOptions,
	execute: () => Promise<HttpResponse<T>>,
	signal: AbortSignal | null = null,
): Promise<HttpResponse<T>>
{
	if (!isApplicable(options))
	{
		return execute();
	}

	return runCoordinated<T>(options.key as string, options.guardTimeout ?? 0, execute, signal);
}

async function runCoordinated<T>(
	key: string,
	guardTimeout: number,
	execute: () => Promise<HttpResponse<T>>,
	signal: AbortSignal | null,
): Promise<HttpResponse<T>>
{
	// the channel name is the key itself: the tabs find each other by the name they
	// were given, without a registry of their own
	const channel = new BroadcastChannel(key);
	const delivered = new Delivery<T>();
	// tells the queued lock request that this call is already over: granted the lock
	// afterwards, the tab must release it at once instead of firing a request nobody
	// is waiting for any more
	const settled = new AbortController();
	// a grant is handed over synchronously, so a tab whose call is already answered can be
	// made the leader before the abort above has run: aborting resumes a microtask later.
	// The flag is therefore raised inside the handler that settles the call, before any
	// promise resolves, and the abort stays as the way to drop a request still queued.
	// The leader holding the lock until its broadcast lands (see `settleBroadcast`) is what
	// keeps the grant from arriving before the message in the first place
	const done = createSettled();

	// the subscription must precede the acquire attempt: between acquiring and
	// subscribing the leader can already have broadcast its outcome, and a tab
	// subscribing later would never see it
	channel.onmessage = ({ data }: MessageEvent<unknown>) => {
		if (delivered.accept(data))
		{
			done.mark();
		}
	};

	const guard = createGuard<T>(key, guardTimeout, done);
	const abort = createAbortWatch<T>(signal, done);

	try
	{
		const outcome = await Promise.race([
			lead<T>(key, channel, execute, settled.signal, done, guard.cancel),
			delivered.promise,
			guard.promise,
			abort.promise,
		]);

		return await outcome();
	}
	finally
	{
		settled.abort();
		guard.cancel();
		abort.cancel();
		channel.close();
	}
}

/**
 * The leader branch and the "the leader is gone" branch are the same code: a tab
 * that gets the lock right away performs the request, and a tab that gets it later
 * (because the holder closed, crashed or dropped out) becomes the leader itself.
 * Being granted the lock is therefore the follower's proof that nobody else is
 * going to answer; the lock is held for the whole request, so the next grant opens
 * a new contention window instead of a parallel request.
 */
async function lead<T>(
	key: string,
	channel: BroadcastChannel,
	execute: () => Promise<HttpResponse<T>>,
	settled: AbortSignal,
	done: Settled,
	stopGuard: () => void,
): Promise<Outcome<T>>
{
	let outcome: Outcome<T> | null = null;
	try
	{
		await globalThis.navigator.locks.request(key, { signal: settled }, async () => {
			if (settled.aborted || done.value)
			{
				return;
			}

			// the guard bounds the wait in the queue, not the request that follows it: the
			// network has its own timeout, and leaving the guard armed would cut a request
			// this tab has only just been cleared to make
			stopGuard();

			outcome = await runAsLeader<T>(channel, execute);
		});
	}
	catch
	{
		// the queued request was dropped because the call had already settled elsewhere
	}

	// the waiting never ends here: this tab lost the race to a message, to the guard
	// or to the caller's abort, and the winner of the race owns the result
	return outcome ?? new Promise<Outcome<T>>(() => {});
}

async function runAsLeader<T>(
	channel: BroadcastChannel,
	execute: () => Promise<HttpResponse<T>>,
): Promise<Outcome<T>>
{
	let response: HttpResponse<T>;
	try
	{
		response = await execute();
	}
	catch (error)
	{
		// an outcome of this tab alone (an abort, a programmer error) travels as
		// `leaderGone`, so the waiting tabs elect a new leader instead of inheriting it
		channel.postMessage(toMessage(error));
		await settleBroadcast();

		return () => Promise.reject(error);
	}

	channel.postMessage({ outcome: 'response', ...toSnapshot(response) });
	await settleBroadcast();

	return () => Promise.resolve(response);
}

/**
 * Holds the lock until the broadcast has been delivered. Posting a message and
 * releasing the lock in the same turn is a race the waiting tab loses either way:
 * a grant is handed over synchronously, a message is not, so the queued tab wakes
 * up as the new leader and repeats a request that is already answered. One task
 * boundary is enough — delivery to the contexts of an origin is queued before it.
 */
function settleBroadcast(): Promise<void>
{
	return new Promise((resolve) => {
		globalThis.setTimeout(resolve, 0);
	});
}

/**
 * The message side of the wait. `leaderGone` is deliberately not an outcome: the
 * leader left without a result, so the tab keeps waiting for the lock it is now
 * free to take.
 */
class Delivery<T>
{
	readonly promise: Promise<Outcome<T>>;
	#resolve: (outcome: Outcome<T>) => void = () => {};

	constructor()
	{
		this.promise = new Promise<Outcome<T>>((resolve) => {
			this.#resolve = resolve;
		});
	}

	/**
	 * Tells whether this message settled the call: the caller raises the settled flag
	 * on a `true`, synchronously, while the browser may already be handing over the lock.
	 */
	accept(raw: unknown): boolean
	{
		const message = parseMessage(raw);
		if (message === null)
		{
			return false;
		}

		if (message.outcome === 'response')
		{
			this.#resolve(() => Promise.resolve(fromSnapshot<T>(message)));

			return true;
		}

		if (message.outcome === 'error')
		{
			const error = rebuildError(message);
			this.#resolve(() => Promise.reject(error));

			return true;
		}

		return false;
	}
}

type Watch<T> = {
	promise: Promise<Outcome<T>>;
	cancel: () => void;
};

/**
 * The last resort against hanging, not the mechanism the waiting rests on: it
 * fires only when neither the message nor the lock ever arrives.
 */
function createGuard<T>(key: string, guardTimeout: number, done: Settled): Watch<T>
{
	if (!(guardTimeout > 0))
	{
		return { promise: new Promise(() => {}), cancel: () => {} };
	}

	let timer = 0;
	const promise = new Promise<Outcome<T>>((resolve) => {
		timer = globalThis.setTimeout(() => {
			const error = new TimeoutError({
				timeout: guardTimeout,
				cause: `Waiting for the cross-tab lock "${key}" timed out`,
			});
			done.mark();
			resolve(() => Promise.reject(error));
		}, guardTimeout);
	});

	return { promise, cancel: () => globalThis.clearTimeout(timer) };
}

/**
 * The caller's abort must end the wait in any branch: a waiting tab rejects with
 * the caller's own reason, exactly as it would have if it went to the network.
 */
function createAbortWatch<T>(signal: AbortSignal | null, done: Settled): Watch<T>
{
	if (Type.isNull(signal))
	{
		return { promise: new Promise(() => {}), cancel: () => {} };
	}

	if (signal.aborted)
	{
		const reason = abortReason(signal);
		done.mark();

		return { promise: Promise.resolve(() => Promise.reject(reason)), cancel: () => {} };
	}

	let listener: () => void = () => {};
	const promise = new Promise<Outcome<T>>((resolve) => {
		listener = () => {
			const reason = abortReason(signal);
			done.mark();
			resolve(() => Promise.reject(reason));
		};
		signal.addEventListener('abort', listener, { once: true });
	});

	return { promise, cancel: () => signal.removeEventListener('abort', listener) };
}
