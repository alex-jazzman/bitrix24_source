/**
 * @module in-app-url/portal-page
 */
jn.define('in-app-url/portal-page', (require, exports, module) => {
	/**
	 * Opens the portal page a link points at. Shared fallback for routes that cannot
	 * show a native screen for the link they matched.
	 *
	 * @param {?string} url
	 * @param {object} [context]
	 */
	const openPortalPage = (url, context = {}) => {
		if (!url)
		{
			return;
		}

		PageManager.openPage({
			bx24ModernStyle: true,
			...context,
			url,
		});
	};

	module.exports = { openPortalPage };
});
