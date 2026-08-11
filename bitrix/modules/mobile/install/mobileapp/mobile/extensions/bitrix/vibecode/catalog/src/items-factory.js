/**
 * @module vibecode/catalog/src/items-factory
 */
jn.define('vibecode/catalog/src/items-factory', (require, exports, module) => {
	const { VibeCodeCatalogItem } = require('vibecode/catalog/item');

	const VibeCodeCatalogItemsFactory = Object.freeze({
		create: (type, data) => VibeCodeCatalogItem(data),
	});

	module.exports = {
		VibeCodeCatalogItemsFactory,
	};
});
