/**
 * @module vibecode/catalog
 */
jn.define('vibecode/catalog', (require, exports, module) => {
	const { VibeCodeCatalogRenderer } = require('vibecode/catalog/src/renderer');
	const {
		VibeCodeCatalogMarketplacePlaceholder,
	} = require('vibecode/catalog/src/marketplace-placeholder');
	const { openInApp, openAppPage } = require('vibecode/app-opener');
	const { renderVibeCodeCatalogState } = require('vibecode/catalog/src/empty-states/state');
	const {
		normalizeAbsoluteUrl,
		normalizePositiveInteger,
	} = require('vibecode/catalog/src/utils');

	module.exports = {
		VibeCodeCatalog: (props = {}) => new VibeCodeCatalogRenderer(props),
		VibeCodeCatalogMarketplacePlaceholder,
		openInApp,
		openAppPage,
		// shared with the lazily loaded vibecode/catalog/share: a bundle file of one extension
		// cannot be required from another one
		normalizeAbsoluteUrl,
		normalizePositiveInteger,
		renderVibeCodeCatalogState,
	};
});
