import { Event, Type } from 'main.core';

import { type ScreenState, type ScreenStateBridge, type ScreenStateFilter } from './types';

const SCREEN_STATE_TIMEOUT_MS = 700;

// Mirrors DigestSetupDashboardGuard: a state beyond these bounds is refused by the backend as a whole.
const NATIVE_FILTER_ID_PATTERN = /^NATIVE_FILTER-[\w-]{1,64}$/;
const MAX_SCREEN_STATE_FILTERS = 50;
const MAX_SCREEN_STATE_BYTES = 16384;
const SCREEN_STATE_KEYS: Array<keyof ScreenStateFilter> = ['extraFormData', 'filterState'];
const MAX_INPUT_NESTING_LEVEL = 64;
const SHORT_ESCAPED_CHARS = new Set(['\\', '/', '\b', '\f', '\n', '\r', '\t']);
// eslint-disable-next-line no-control-regex
const UNICODE_ESCAPED_CHAR = /^[\u0000-\u001F"&'<>\u2028\u2029]$/;

/**
 * Asks the embedded report for its filter state at the moment of the click. The snapshot is optional:
 * a missing bridge, a silent or failing frame and an empty answer all give null, never an error.
 */
export async function takeScreenState(bridge?: ScreenStateBridge | null): Promise<ScreenState | null>
{
	if (!Type.isFunction(bridge?.getDataMask))
	{
		return null;
	}

	const cancellation = new AbortController();
	const timeout = new Promise<null>((resolve) => {
		Event.bind(cancellation.signal, 'abort', () => resolve(null));
	});
	const timer = setTimeout(() => cancellation.abort(), SCREEN_STATE_TIMEOUT_MS);

	try
	{
		const dataMask = await Promise.race([bridge.getDataMask(cancellation.signal), timeout]);

		return narrowToNativeFilters(dataMask);
	}
	catch
	{
		return null;
	}
	finally
	{
		clearTimeout(timer);
		cancellation.abort();
	}
}

function narrowToNativeFilters(dataMask: unknown): ScreenState | null
{
	if (!Type.isPlainObject(dataMask))
	{
		return null;
	}

	const screenState: ScreenState = {};
	Object.entries(dataMask).forEach(([filterId, state]) => {
		if (!NATIVE_FILTER_ID_PATTERN.test(filterId) || !Type.isPlainObject(state))
		{
			return;
		}

		const parts: ScreenStateFilter = {};
		SCREEN_STATE_KEYS.forEach((key) => {
			if (Type.isPlainObject(state[key]))
			{
				parts[key] = state[key];
			}
		});

		if (Object.keys(parts).length > 0)
		{
			screenState[filterId] = parts;
		}
	});

	const received = receiveAsFormField(screenState, 0);
	if (!Array.isArray(received) || received.length > MAX_SCREEN_STATE_FILTERS)
	{
		return null;
	}

	return measureEncodedLength(received) > MAX_SCREEN_STATE_BYTES ? null : screenState;
}

// A PHP array as the backend gets it from the form: its entries in the order they were posted.
type ReceivedField = string | Array<[string, ReceivedField]>;

/**
 * Replays BX.ajax.prepareData and PHP input parsing: every scalar arrives as a string, empty maps and nulls
 * do not arrive at all, and a field nested deeper than max_input_nesting_level drops the whole state.
 * Unpaired surrogates make encodeURIComponent throw, so such a state is never posted.
 */
function receiveAsFormField(value: unknown, level: number): ReceivedField | null
{
	if (Type.isNull(value))
	{
		return null;
	}

	if (!Type.isObjectLike(value))
	{
		if (level > MAX_INPUT_NESTING_LEVEL)
		{
			throw new RangeError('Screen state is nested too deep for the backend');
		}

		return decodeURIComponent(encodeURIComponent(value as string));
	}

	const entries: Array<[string, ReceivedField]> = [];
	Object.keys(value).forEach((key) => {
		const field = receiveAsFormField(value[key], level + 1);
		if (field !== null)
		{
			entries.push([decodeURIComponent(encodeURIComponent(key)), field]);
		}
	});

	return entries.length > 0 ? entries : null;
}

// strlen(Json::encode()) with its default flags: HEX_TAG, HEX_AMP, HEX_APOS, HEX_QUOT, UNESCAPED_UNICODE.
function measureEncodedLength(field: ReceivedField): number
{
	if (Type.isString(field))
	{
		return measureEncodedString(field);
	}

	const isList = field.every(([key], index) => key === String(index));
	const itemsLength = field.reduce((length, [key, value]) => {
		const keyLength = isList ? 0 : measureEncodedString(key) + 1;

		return length + keyLength + measureEncodedLength(value);
	}, 0);

	return 2 + itemsLength + Math.max(field.length - 1, 0);
}

function measureEncodedString(value: string): number
{
	let length = 2;
	for (const char of value)
	{
		length += measureEncodedChar(char);
	}

	return length;
}

function measureEncodedChar(char: string): number
{
	if (SHORT_ESCAPED_CHARS.has(char))
	{
		return 2;
	}

	if (UNICODE_ESCAPED_CHAR.test(char))
	{
		return 6;
	}

	const codePoint = char.codePointAt(0) ?? 0;
	if (codePoint < 0x80)
	{
		return 1;
	}

	if (codePoint < 0x800)
	{
		return 2;
	}

	return codePoint < 0x10000 ? 3 : 4;
}
