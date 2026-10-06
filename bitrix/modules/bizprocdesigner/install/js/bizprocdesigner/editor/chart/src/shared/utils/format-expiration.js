import { Type } from 'main.core';
import { DateTimeFormat } from 'main.date';

import type { GetMessage } from '../composables';

const STATUS_NOT_CONNECTED = 'BIZPROCDESIGNER_EDITOR_CONNECT_AGENT_STATUS_NOT_CONNECTED';
const STATUS_CONNECTED_UNTIL = 'BIZPROCDESIGNER_EDITOR_CONNECT_AGENT_STATUS_CONNECTED_UNTIL';

/**
 * Formats a point in time (in milliseconds) into a localized date and time.
 *
 * Uses the standard Bitrix DateTimeFormat from main.date (respects the locale
 * and product settings); if it is unavailable in the bundle, falls back to
 * Intl.DateTimeFormat for the environment locale.
 *
 * @param {number} timestampMs - point in time in milliseconds.
 * @returns {string} localized date and time.
 */
function formatClientDate(timestampMs: number): string
{
	if (Type.isFunction(DateTimeFormat?.format) && Type.isFunction(DateTimeFormat?.getFormat))
	{
		return DateTimeFormat.format(
			DateTimeFormat.getFormat('FORMAT_DATETIME'),
			new Date(timestampMs),
		);
	}

	return new Intl.DateTimeFormat(undefined, {
		dateStyle: 'medium',
		timeStyle: 'short',
	}).format(new Date(timestampMs));
}

/**
 * Turns the token expiration (unix ts in seconds from the backend) into a
 * localized agent connection status label.
 *
 * expiresAt == null means "Not connected"; otherwise "Connected until
 * <date and time>". An expiration in the past is not checked: the connection
 * state is driven by the connected field from the response, here the
 * expiration is only displayed.
 *
 * @param {?number} expiresAt - unix timestamp in seconds or null.
 * @param {GetMessage} getMessage - localization phrase resolver.
 * @returns {string} localized status label.
 */
export function formatExpiration(expiresAt: ?number, getMessage: GetMessage): string
{
	if (Type.isNil(expiresAt))
	{
		return getMessage(STATUS_NOT_CONNECTED);
	}

	const dateStr = formatClientDate(expiresAt * 1000);

	return getMessage(STATUS_CONNECTED_UNTIL, { '#DATE#': dateStr });
}
