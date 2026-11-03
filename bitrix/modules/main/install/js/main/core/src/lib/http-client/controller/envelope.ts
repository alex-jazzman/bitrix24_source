import Type from '../../type';
import type { AjaxEnvelope, AjaxEnvelopeStatus, HttpResponse } from '../types';

const envelopeStatuses: Set<string> = new Set(['success', 'denied', 'error']);

/**
 * Checks whether a value is an Engine ajax envelope (the `AjaxJson` wire format):
 * a plain object with a known `status` and an own `data` field.
 */
export function isAjaxEnvelope(value: unknown): value is AjaxEnvelope
{
	return (
		Type.isPlainObject(value)
		&& envelopeStatuses.has((value as { status: string }).status)
		&& Object.hasOwn(value as object, 'data')
	);
}

/**
 * Extracts the ajax envelope from a transport response body. A response without
 * an envelope (`Engine\Response\Json`, `HttpResponse`) is not treated as an error:
 * `null` is returned and the caller keeps the plain transport response as is.
 */
export function parseEnvelope<T = unknown>(response: HttpResponse): AjaxEnvelope<T> | null
{
	const body = response.data;
	if (!isAjaxEnvelope(body))
	{
		return null;
	}

	return {
		status: body.status as AjaxEnvelopeStatus,
		data: body.data as T | null,
		errors: Type.isArray(body.errors) ? body.errors : [],
	};
}
