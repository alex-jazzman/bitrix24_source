/**
 * @module vibecode/catalog/src/open-in-app
 */
jn.define('vibecode/catalog/src/open-in-app', (require, exports, module) => {
	const { Feature } = require('feature');
	const { normalizeAbsoluteUrl } = require('vibecode/catalog/src/utils');

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

	module.exports = { openInApp };
});
