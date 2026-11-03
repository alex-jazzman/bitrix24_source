import Loc from '../../loc';
import Type from '../../type';

const csrfTokenMessageId = 'bitrix_sessid';
const siteIdMessageId = 'SITE_ID';

/**
 * Minimal wrapper around the core message store (`Loc`). The store is shared
 * with `BX.message` by the kernel, so the tokens stay in sync with the legacy
 * `BX.ajax` layer without importing any legacy code.
 */
function getMessageValue(messageId: string): string | null
{
	if (!Loc.hasMessage(messageId))
	{
		return null;
	}

	const value = Loc.getMessage(messageId);

	return Type.isStringFilled(value) ? value : null;
}

/**
 * Returns the current CSRF token (`bitrix_sessid`) or `null` when it is not defined.
 */
export function getCsrfToken(): string | null
{
	return getMessageValue(csrfTokenMessageId);
}

/**
 * Stores a fresh CSRF token issued by the server (`invalid_csrf` recovery).
 */
export function setCsrfToken(token: string): void
{
	Loc.setMessage(csrfTokenMessageId, token);
}

/**
 * Returns the current site id or `null` when it is not defined.
 */
export function getSiteId(): string | null
{
	return getMessageValue(siteIdMessageId);
}
