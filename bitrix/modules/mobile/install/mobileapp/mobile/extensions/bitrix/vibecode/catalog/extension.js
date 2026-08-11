/**
 * @module vibecode/catalog
 */
jn.define('vibecode/catalog', (require, exports, module) => {
	const { VibeCodeCatalogRenderer } = require('vibecode/catalog/src/renderer');
	const {
		VibeCodeCatalogMarketplacePlaceholder,
	} = require('vibecode/catalog/src/marketplace-placeholder');

	module.exports = {
		VibeCodeCatalog: (props = {}) => new VibeCodeCatalogRenderer(props),
		VibeCodeCatalogMarketplacePlaceholder,
	};
});
