/**
 * @module in-app-url/routes/note
 */
jn.define('in-app-url/routes/note', (require, exports, module) => {
	const { URL } = require('utils/url');
	const { Loc } = require('loc');

	const MOBILE_NOTE_ENTRY = '/mobile/note/';

	/**
	 * Extracts the knowledge base sub-path (relative to /note) from an arbitrary link.
	 *
	 * Accepts both relative (/note/...) and same-portal absolute (https://host/note/...) links.
	 * The /note segment is matched only against the parsed pathname, so foreign links that contain
	 * /note/ inside their query string are not treated as KB links. Query and hash are preserved.
	 *
	 * @param {string} rawUrl
	 * @return {string|null} sub-path after /note (path + query + hash), '' for the KB home,
	 * or null for a non-KB link
	 */
	function extractNoteEntryPath(rawUrl)
	{
		if (typeof rawUrl !== 'string' || rawUrl === '')
		{
			return null;
		}

		const parsed = URL(rawUrl);
		const pathname = parsed?.pathname || '';
		if (pathname !== '/note' && !pathname.startsWith('/note/'))
		{
			return null;
		}

		const remainder = pathname.slice('/note'.length);
		const normalizedPath = (remainder === '' || remainder === '/') ? '' : remainder;

		return `${normalizedPath}${parsed?.search || ''}${parsed?.hash || ''}`;
	}

	/**
	 * Knowledge base (note module) routes for in-app-url.
	 *
	 * A single prefix route intercepts any KB link (articles, workspaces, archive, recycle bin,
	 * search, shared and future service sections) and opens it inside the embedded webview instead of
	 * the system browser. The sub-path is delivered to the server entry via the entryPath parameter;
	 * the page type is not parsed on the client (extensibility).
	 *
	 * Route matching is an unanchored substring test, so the pattern also fires on links that merely
	 * contain /note somewhere (e.g. inside a query string). A route cannot decline a dispatch, so for
	 * such links the handler re-checks the parsed pathname and replicates the default webview fallback
	 * of InAppUrl.open instead of opening the KB.
	 *
	 * @param {InAppUrl} inAppUrl
	 */
	function registerRoutes(inAppUrl)
	{
		inAppUrl.register('/note(?:[/?#]|$)', (params, { url }) => {
			const entryPath = extractNoteEntryPath(url);
			if (entryPath === null)
			{
				PageManager.openPage({
					url,
					bx24ModernStyle: true,
				});

				return;
			}

			const target = entryPath === ''
				? MOBILE_NOTE_ENTRY
				: `${MOBILE_NOTE_ENTRY}?entryPath=${encodeURIComponent(entryPath)}`;

			PageManager.openPage({
				url: target,
				bx24ModernStyle: true,
				titleParams: {
					text: Loc.getMessage('M_IN_APP_URL_NOTE_TITLE'),
				},
			});
		}).name('note:open');
	}

	module.exports = registerRoutes;
	// Exposed for unit tests (tests/in-app-url/note).
	module.exports.extractNoteEntryPath = extractNoteEntryPath;
});
