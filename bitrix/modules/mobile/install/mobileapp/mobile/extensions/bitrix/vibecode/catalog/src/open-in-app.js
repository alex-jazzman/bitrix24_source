/**
 * @module vibecode/catalog/src/open-in-app
 */
jn.define('vibecode/catalog/src/open-in-app', (require, exports, module) => {
	/**
	 * Opens a portal URL inside an embedded webview backdrop.
	 *
	 * Thin wrapper around the show primitive: it only selects the primitive and opens the URL,
	 * with no business logic. The primitive is isolated here so a future collapsible screen
	 * (persistentScreen, behind a Feature capability-gate) can replace it without touching callers.
	 * persistentScreen is not available in the client yet, so it is intentionally not wired here.
	 *
	 * @param {string} url
	 * @param {object} [options]
	 * @param {string} [options.title]
	 */
	function openInApp(url, options = {})
	{
		const { title } = options;

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
