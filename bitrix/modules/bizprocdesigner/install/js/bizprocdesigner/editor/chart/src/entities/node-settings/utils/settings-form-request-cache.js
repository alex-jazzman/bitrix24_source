import { Runtime, Type } from 'main.core';

import { editorAPI } from '../../../shared/api';

/**
 * Requests of the block forms of the rules surface, kept for as long as one node stays open.
 *
 * The forms of a rule are mounted and unmounted all the time: the rules tab moves between the
 * overview and a single rule, a section is reached, an action form is collapsed and expanded again.
 * Each mount asks the server to render the same property dialog, and each such render is a request
 * of its own with a body carrying the whole compatible template. The answer to an identical request
 * is identical, so it is remembered here: a form that comes back costs nothing, and two forms asking
 * for the same thing at the same time share one round trip.
 *
 * The cache belongs to the node being edited and to nothing else: it is dropped when the panel loads
 * another node and when it closes (see useNodeSettingsStore.fetchNodeSettings / reset). A response is
 * handed out as a copy, because the renderers of the forms work on the payload in place and two forms
 * must not share one.
 */

// Cap of the remembered answers. A node has as many forms as it has blocks, and one rendered form is
// a payload of its own, so the cap keeps a long editing session from growing without end. The oldest
// answer is the one dropped: the forms of the rule being worked on are the ones asked for again and
// again.
const MAX_REMEMBERED_RESPONSES = 24;

// Same shape the transport takes: the handle of the round trip, for a caller that has to abort it.
type RequestOptions = {
	onRequestStart?: (xhr: XMLHttpRequest) => void,
};

const remembered: Map<string, mixed> = new Map();
const inFlight: Map<string, Promise<mixed>> = new Map();

// The node the answers above belong to. A request started for the previous node may still be in
// flight when the panel loads the next one; its answer describes a node no longer open, so it is
// dropped instead of remembered.
let generation = 0;

/**
 * Deterministic 32-bit hash of a string - the algorithm of the core (BX.util.hashCode), taken here as
 * a few lines instead of a legacy global.
 */
const hashOf = (value: string): number => {
	let hash = 0;
	for (let i = 0; i < value.length; i++)
	{
		hash = ((hash << 5) - hash) + value.charCodeAt(i);
		hash |= 0;
	}

	return hash;
};

/**
 * Second 32-bit hash of the same string, unrelated to the first (FNV-1a). One 32-bit hash leaves
 * same-length collisions within easy reach - 'Aa' and 'BB' agree in hashOf - and a collision would
 * hand the controls and values of one form to another. A string has to agree in length and in both
 * hashes at once to be taken for an already seen one, which does not happen in practice.
 */
const secondHashOf = (value: string): number => {
	let hash = 0x811C9DC5;
	for (let i = 0; i < value.length; i++)
	{
		hash ^= value.charCodeAt(i);
		hash = Math.imul(hash, 0x01000193);
	}

	return hash >>> 0;
};

/**
 * Fingerprint of one value of the body, stable across the order of object keys. The long fields of a
 * request arrive already serialized - the whole compatible template is one string - so every string
 * is hashed as it is: the key never builds and scans an escaped copy of the payload the way one more
 * JSON.stringify of the body would.
 */
const fingerprintOf = (value: mixed): string => {
	if (Type.isString(value))
	{
		return `${value.length}.${hashOf(value)}.${secondHashOf(value)}`;
	}
	if (Type.isArray(value))
	{
		return `[${value.map(fingerprintOf).join(',')}]`;
	}
	if (Type.isPlainObject(value))
	{
		const fields = Object.keys(value).sort().map((name) => `${name}:${fingerprintOf(value[name])}`);

		return `{${fields.join(',')}}`;
	}

	return String(value);
};

/**
 * Identity of one request: the action, and the fingerprint of its body. The body itself is not kept -
 * the body of `getNodeSettingsControls` carries the whole compatible template, so a key holding it
 * would keep megabytes per remembered form for as long as the node stays open. Each string of the
 * body stands in the key as its length and two unrelated hashes, so the key grows with the shape of
 * the body and not with its size.
 * Exported as the single reading of that identity: the cache builds its keys through it and the unit
 * suite asserts them on it.
 */
export const buildSettingsFormRequestKey = (name: string, data: Object): string => {
	return `${name}|${fingerprintOf(data)}`;
};

// A copy per reader: the form renderers write into the payload they are given (control ids, field
// names, values), so handing out the remembered object itself would let one form corrupt the next.
const copyOf = (data: mixed): mixed => {
	return Type.isObject(data) ? Runtime.clone(data) : data;
};

const rememberResponse = (key: string, startedIn: number, data: mixed): void => {
	if (startedIn !== generation)
	{
		return;
	}

	if (remembered.size >= MAX_REMEMBERED_RESPONSES)
	{
		remembered.delete(remembered.keys().next().value);
	}
	remembered.set(key, data);
};

const forget = (key: string, shared: Promise<mixed>): void => {
	if (inFlight.get(key) === shared)
	{
		inFlight.delete(key);
	}
};

/**
 * The transport handle as the caller that started the round trip gets it: aborting through it drops
 * the entry of that round trip before anything else happens.
 *
 * A caller aborts what it started - a form torn down before the answer arrives, a render superseded
 * by the next one - and the shared promise dies with it. The entry has to go in that very call: the
 * `abort` event of the request comes a task later, and the supersession is a re-request in the same
 * tick, so waiting for the event would hand the aborted round trip to the render that replaced it.
 */
const abortableOnce = (key: string, sharedOf: () => Promise<mixed>, xhr: XMLHttpRequest): XMLHttpRequest => {
	const abort = xhr.abort.bind(xhr);
	xhr.abort = (...args) => {
		forget(key, sharedOf());

		return abort(...args);
	};

	return xhr;
};

/**
 * The answer to one request: the remembered one, the one already on its way, or a new round trip.
 * A failed request is not remembered - the next mount of the form asks again.
 *
 * `options` describe the round trip and reach the transport only when one really starts: a caller
 * answered from the memory or joined to a request already on its way starts nothing of its own.
 */
const requestOnce = (
	key: string,
	request: (options: RequestOptions) => Promise<mixed>,
	options: RequestOptions = {},
): Promise<mixed> => {
	if (remembered.has(key))
	{
		return Promise.resolve(copyOf(remembered.get(key)));
	}

	let shared = inFlight.get(key);
	if (!shared)
	{
		const startedIn = generation;
		shared = request({
			onRequestStart: (xhr: XMLHttpRequest) => {
				options.onRequestStart?.(abortableOnce(key, () => shared, xhr));
			},
		}).then((data: mixed) => {
			rememberResponse(key, startedIn, data);

			return data;
		});
		// Claimed before the chain below, so a rejected request leaves no entry behind.
		inFlight.set(key, shared);
		void shared
			.catch(() => {})
			.then(() => forget(key, shared))
		;
	}

	return shared.then(copyOf);
};

export const settingsFormRequestCache = Object.freeze({
	/** Controls of a property dialog: the form of an action, and the base settings of a node. */
	getNodeSettingsControls(data: Object, options: RequestOptions = {}): Promise<mixed>
	{
		return requestOnce(
			buildSettingsFormRequestKey('Activity.getSettingsControls', data),
			(requestOptions: RequestOptions) => editorAPI.getNodeSettingsControls(data, requestOptions),
			options,
		);
	},
	/** Metadata of the filter editor: the same answer for every filter of one activity type. */
	getNodeFilterMetadata(data: Object): Promise<mixed>
	{
		return requestOnce(
			buildSettingsFormRequestKey('Activity.getNodeFilterMetadata', data),
			() => editorAPI.getNodeFilterMetadata(data),
		);
	},
	/** Drops everything remembered: another node is being edited, or the panel is closed. */
	reset(): void
	{
		generation++;
		remembered.clear();
		inFlight.clear();
	},
});
