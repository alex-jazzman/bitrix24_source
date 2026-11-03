/**
 * @module in-app-url/routes/vibecode
 */
jn.define('in-app-url/routes/vibecode', (require, exports, module) => {
	const { Loc } = require('loc');
	const { requireLazy } = require('require-lazy');
	const { openPortalPage } = require('in-app-url/portal-page');

	// The legacy web link of a VibeCode application (vibecodeconnector.Catalog.openAppPage): the keyboard
	// button of the application chat and the chat entity link carry it. The keyboard keeps the link
	// HTML-escaped, hence the optional `amp;`. Capturing groups on purpose: the route engine rewrites `:name`
	// tokens, and `(?:` followed by a letter is one of them.
	const LEGACY_APP_PAGE_PATTERN = '/bitrix/services/main/ajax\\.php\\?([^#]*&(amp;)?)?'
		+ 'action=vibecodeconnector\\.Catalog\\.openAppPage(&|#|$)';
	// The canonical page of the application (vibecodeconnector routes: /vibecode/app/{id}/).
	const APP_PAGE_PATTERN = '/vibecode/app/:catalogItemId(/|\\?|#|$)';
	const CATALOG_ITEM_ID_PATTERN = /[&?](amp;)?catalogItemId=(\d+)(?=[#&]|$)/;

	const toCatalogItemId = (value) => {
		const catalogItemId = Number(value);

		return Number.isInteger(catalogItemId) && catalogItemId > 0 ? catalogItemId : null;
	};

	const getCatalogItemId = (params, url) => (
		toCatalogItemId(params.catalogItemId)
		?? toCatalogItemId(CATALOG_ITEM_ID_PATTERN.exec(String(url ?? ''))?.[2])
	);

	// the keyboard hands the link over still HTML-escaped: the portal must not receive `amp;` query keys
	const unescapeUrl = (url) => String(url ?? '').replaceAll('&amp;', '&');

	const openAppPage = (params, { context, url }) => {
		const catalogItemId = getCatalogItemId(params, url);
		if (catalogItemId === null)
		{
			return openPortalPage(unescapeUrl(url), context);
		}

		// no loader: the real requireLazy turns a cancelled or failed load into `undefined`, and a tap on the
		// loader would end on the raw portal page the user has just cancelled
		return requireLazy('vibecode/catalog', false)
			.then((catalog) => {
				if (typeof catalog?.openAppPage !== 'function')
				{
					return openPortalPage(unescapeUrl(url), context);
				}

				return catalog.openAppPage(catalogItemId, {
					title: context?.title || Loc.getMessage('M_IN_APP_URL_VIBECODE_APP_TITLE'),
				});
			})
			.catch((error) => {
				console.error('in-app-url/routes/vibecode: unable to open the application page', error);

				return openPortalPage(unescapeUrl(url), context);
			});
	};

	/**
	 * @param {InAppUrl} inAppUrl
	 */
	module.exports = (inAppUrl) => {
		inAppUrl
			.addRoute(LEGACY_APP_PAGE_PATTERN)
			.addRoute(APP_PAGE_PATTERN)
			.handler(openAppPage)
			.name('vibecode:openAppPage')
		;
	};
});
