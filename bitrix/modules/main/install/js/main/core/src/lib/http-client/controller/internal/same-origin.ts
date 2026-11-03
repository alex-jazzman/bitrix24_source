/**
 * Checks that a url (resolved against an optional base url and the current page)
 * points to the origin of the current page. A missing, empty or unparsable url
 * is treated as foreign: security-sensitive behavior must not be applied to a
 * url the client could not establish. Relative urls resolve against the current
 * page as usual and stay same-origin.
 */
export function isSameOrigin(url: string | null | undefined, baseUrl?: string): boolean
{
	if (typeof url !== 'string' || url.trim() === '')
	{
		return false;
	}

	try
	{
		const base = new URL(baseUrl ?? '', window.location.href);
		const target = new URL(url, base);

		return target.origin === window.location.origin;
	}
	catch
	{
		return false;
	}
}
