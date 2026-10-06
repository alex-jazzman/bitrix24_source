// Guest call link formats (see Bitrix\Im\V2\SharingLink\GuestChatLink):
// deeplink https://{b24.to|bitrix24.net}/gi/{portalId}-{code} or fallback {publicDomain}/guest/{code}
const GUEST_LINK_DEEPLINK_HOSTS = new Set(['b24.to', 'bitrix24.net']);
const GUEST_LINK_DEEPLINK_PATH = '/gi/';
const GUEST_LINK_FALLBACK_PATH = '/guest/';

/**
 * Validates that a value is a guest call link and not an arbitrary external URL.
 * Used both to gate the join button (UX) and right before window.open (security guard).
 *
 * @param {string} value
 * @returns {boolean}
 */
export const isGuestCallLink = (value) =>
{
	try
	{
		const url = new URL(value);
		if (url.protocol !== 'http:' && url.protocol !== 'https:')
		{
			return false;
		}

		if (GUEST_LINK_DEEPLINK_HOSTS.has(url.hostname) && url.pathname.startsWith(GUEST_LINK_DEEPLINK_PATH))
		{
			return true;
		}

		// Fallback links live on the current portal's public domain ({publicDomain}/guest/{code});
		// restrict the host to the current origin so an arbitrary external /guest/ URL cannot be opened
		return url.hostname === window.location.hostname && url.pathname.startsWith(GUEST_LINK_FALLBACK_PATH);
	}
	catch (error)
	{
		return false;
	}
};
