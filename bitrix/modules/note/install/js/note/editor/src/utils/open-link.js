/**
 * Link opening that is aware of the Bitrix24 mobile app webview.
 *
 * On desktop a link is opened in a new browser tab.
 *
 * Inside the classic mobile app webview `window.open('_blank')` escapes to the
 * OS browser (sliders are not available/adapted there), so instead we route the
 * URL through the native app via the legacy `BX.MobileTools` bridge — task/user
 * URLs open native cards, everything else opens inside the app.
 *
 * `BX.MobileTools` / `window.app` are injected natively by the classic webview
 * container; hence the guarded global access with a plain new-tab fallback when
 * the bridge is absent (desktop).
 */

/**
 * Returns true when the URL is safe to open: relative paths (starting with '/')
 * and absolute URLs with http: or https: scheme are allowed. Everything else
 * (javascript:, data:, vbscript:, file:, protocol-relative '//', etc.) is rejected.
 *
 * Defense-in-depth guard — the backend currently only produces relative paths,
 * but this check ensures a future source change cannot introduce dangerous schemes.
 *
 * @param {string} url
 * @returns {boolean}
 */
export function isAllowedUrl(url: string): boolean
{
	if (!url)
	{
		return false;
	}

	// Relative paths (must start with a single '/', not protocol-relative '//').
	if (url.startsWith('/') && !url.startsWith('//'))
	{
		return true;
	}

	// Absolute URLs: only http and https are allowed.
	try
	{
		const parsed = new URL(url, window.location.origin);

		return parsed.protocol === 'http:' || parsed.protocol === 'https:';
	}
	catch
	{
		return false;
	}
}

/**
 * @returns {boolean} true when running inside the mobile app webview.
 */
export function isMobileApp(): boolean
{
	if (typeof document !== 'undefined'
		&& document.documentElement.classList.contains('note-mobile'))
	{
		return true;
	}

	return typeof navigator !== 'undefined'
		&& navigator.userAgent.toLowerCase().includes('bitrixmobile');
}

/**
 * @returns {boolean} true when running on iOS.
 */
function isIos(): boolean
{
	return typeof navigator !== 'undefined'
		&& /iphone|ipad|ipod/i.test(navigator.userAgent);
}

// User profile URL (`/company/personal/user/{id}/`), excluding deeper paths like
// `/.../tasks/task/view/{id}/` which must keep their own native routing.
// Capture group 1 is the user id.
const USER_PROFILE_URL = /\/company\/personal\/user\/(\d+)\/($|\?)/i;

/**
 * Tries to open a URL natively inside the mobile app.
 *
 * No-op returning false when not inside the app (so desktop behaviour is left
 * untouched by the caller). Inside the app it routes through the native bridge:
 * task/user URLs open native cards, other URLs open inside the app webview.
 *
 * @param {string} url
 * @returns {boolean} true if the URL was handed off to the native app.
 */
export function openViaMobileApp(url: string): boolean
{
	if (!url || !isMobileApp())
	{
		return false;
	}

	// The profile opener (`onUserProfileOpen`) is an UNADDRESSED broadcast in
	// mobile_tools; from the note webview it never reaches the native
	// `communication` subscriber (alive only in native contexts like chat) and on
	// iOS the URL escapes to the OS browser. Address the event straight to the
	// persistent `communication` component — the same trick tasks use with the
	// `background` component — so the native profile card opens from the webview.
	if (isIos())
	{
		const userId = url.match(USER_PROFILE_URL)?.[1];
		const events = window.BXMobileApp?.Events;
		if (userId && typeof events?.postToComponent === 'function')
		{
			events.postToComponent('onUserProfileOpen', [userId], 'communication');

			return true;
		}
	}

	const mobileTools = window.BX?.MobileTools;
	if (mobileTools)
	{
		const open = mobileTools.resolveOpenFunction(url);
		if (open)
		{
			open();

			return true;
		}
	}

	// Fallback for older webviews that expose the app bridge but not MobileTools.
	if (typeof window.app?.openNewPage === 'function')
	{
		window.app.openNewPage(url);

		return true;
	}

	return false;
}

/**
 * Opens a URL: natively inside the mobile app when possible, otherwise in a new
 * browser tab. Use for entry points that open a new tab on desktop by design
 * (e.g. mention chips), not for plain in-content anchors.
 *
 * @param {string} url
 * @returns {void}
 */
export function openLinkNative(url: string): void
{
	if (!url)
	{
		return;
	}

	if (!isAllowedUrl(url))
	{
		console.warn('[note] openLinkNative: blocked disallowed URL scheme');

		return;
	}

	if (openViaMobileApp(url))
	{
		return;
	}

	window.open(url, '_blank', 'noopener,noreferrer');
}
