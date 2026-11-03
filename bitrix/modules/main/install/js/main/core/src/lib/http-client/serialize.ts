import Type from '../type';
import type { RequestBody } from './types';

export type PreparedBody = {
	body: BodyInit | null;
	contentType: string | null;
};

function serializeEntry(name: string, value: unknown, pairs: string[]): void
{
	if (Type.isUndefined(value))
	{
		return;
	}

	if (Type.isNull(value))
	{
		pairs.push(`${name}=`);

		return;
	}

	if (Type.isArray(value))
	{
		value.forEach((item, index) => serializeEntry(`${name}[${index}]`, item, pairs));

		return;
	}

	if (Type.isDate(value))
	{
		pairs.push(`${name}=${encodeURIComponent(value.toISOString())}`);

		return;
	}

	if (Type.isPlainObject(value))
	{
		Object.keys(value).forEach((key) => {
			serializeEntry(`${name}[${encodeURIComponent(key)}]`, value[key], pairs);
		});

		return;
	}

	pairs.push(`${name}=${encodeURIComponent(String(value))}`);
}

/**
 * Serializes a plain object into a PHP-brackets query string (`a[b][0]=v`),
 * compatible with the bracket structure produced by `BX.ajax.prepareData`.
 * Every key segment and every value is encoded with `encodeURIComponent`;
 * `null` values become empty (`key=`), `undefined` values are skipped.
 */
export function serializeQuery(data: Record<string, unknown> | null | undefined): string
{
	if (!Type.isPlainObject(data))
	{
		return '';
	}

	const pairs: string[] = [];
	Object.keys(data).forEach((key) => {
		serializeEntry(encodeURIComponent(key), data[key], pairs);
	});

	return pairs.join('&');
}

/**
 * The content type a payload implies, without serializing it: the effective
 * request config needs the header before the interceptor chain runs, while the
 * body itself is only serialized once the chain is over.
 */
export function getBodyContentType(body: RequestBody | undefined, json?: unknown): string | null
{
	if (!Type.isUndefined(json))
	{
		return 'application/json';
	}

	if (Type.isPlainObject(body))
	{
		return 'application/x-www-form-urlencoded';
	}

	return null;
}

/**
 * Prepares a request body and the content type it implies:
 * - a `json` value is sent as `application/json` (`JSON.stringify`);
 * - a plain object body is serialized to `application/x-www-form-urlencoded` with PHP-brackets;
 * - any other body (FormData, Blob, string, URLSearchParams, ...) is passed through as is.
 */
export function prepareBody(body: RequestBody | undefined, json?: unknown): PreparedBody
{
	const contentType = getBodyContentType(body, json);
	if (!Type.isUndefined(json))
	{
		return {
			body: JSON.stringify(json),
			contentType,
		};
	}

	if (Type.isNil(body))
	{
		return {
			body: null,
			contentType,
		};
	}

	if (Type.isPlainObject(body))
	{
		return {
			body: serializeQuery(body),
			contentType,
		};
	}

	return {
		body,
		contentType,
	};
}
