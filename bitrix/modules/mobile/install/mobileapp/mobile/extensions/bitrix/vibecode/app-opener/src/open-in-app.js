/**
 * @module vibecode/app-opener/src/open-in-app
 */
jn.define('vibecode/app-opener/src/open-in-app', (require, exports, module) => {
	const { Feature } = require('feature');

	const APP_PAGE_PATH = '/mobile/vibecode/open-app/';

	/**
	 * @param {*} value
	 * @return {?number}
	 */
	function normalizePositiveInteger(value)
	{
		const normalizedValue = Number(value);

		return Number.isFinite(normalizedValue) && Number.isInteger(normalizedValue) && normalizedValue > 0
			? normalizedValue
			: null
		;
	}

	function normalizeAbsoluteUrl(url)
	{
		const value = String(url ?? '').trim();
		if (/^https?:\/\//i.test(value))
		{
			return value;
		}

		return `${currentDomain}${value}`;
	}

	/**
	 * Opens a portal URL inside the app.
	 *
	 * Thin wrapper around the show primitive: it only selects the primitive and opens the URL,
	 * with no business logic. When the native collapsible screen is available (persistent_screen
	 * capability), it opens there - it fixes dark theme, window resize and fullscreen natively.
	 * Otherwise it falls back to the embedded webview backdrop.
	 *
	 * @param {string} url
	 * @param {object} [options]
	 * @param {string} [options.title]
	 * @param {string} [options.componentCode] deduplication key: reopening with the same code
	 *   switches to the already opened persistent screen instead of recreating it.
	 */
	function openInApp(url, options = {})
	{
		const { title, componentCode } = options;

		// the native global is absent in builds that do not ship the screen: fall back instead of throwing
		if (Feature.isPersistentScreenSupported() && typeof PersistentScreen !== 'undefined')
		{
			PersistentScreen.open({
				name: 'JSStackComponent',
				componentCode,
				title,
				rootWidget: {
					name: 'web',
					settings: {
						page: { url: normalizeAbsoluteUrl(url) },
						titleParams: { text: title },
					},
				},
			});

			return;
		}

		PageManager.openPage({
			url,
			bx24ModernStyle: true,
			backdrop: {
				showOnTop: true,
			},
			titleParams: {
				text: title,
			},
		});
	}

	/**
	 * Opens the in-app page of a catalog application - the screen the catalog opens on a tap on its item.
	 * Reopening the same application switches to the already opened screen (componentCode).
	 *
	 * Navigation only: the open is not recorded here, see VibeCodeAppOpener.open().
	 *
	 * @param {number|string} catalogItemId
	 * @param {object} [options]
	 * @param {string} [options.title]
	 * @return {boolean} false for an unusable id: nothing is opened
	 */
	function openAppPage(catalogItemId, options = {})
	{
		const itemId = normalizePositiveInteger(catalogItemId);
		if (itemId === null)
		{
			return false;
		}

		openInApp(`${APP_PAGE_PATH}?catalogItemId=${itemId}`, {
			title: options.title,
			componentCode: `vibecode-app-${itemId}`,
		});

		return true;
	}

	module.exports = { normalizePositiveInteger, openInApp, openAppPage };
});
