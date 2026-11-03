/**
 * @module vibecode/catalog/src/empty-states/favorite-empty-state
 */
jn.define('vibecode/catalog/src/empty-states/favorite-empty-state', (require, exports, module) => {
	const { Loc } = require('loc');
	const { renderVibeCodeCatalogState } = require('vibecode/catalog/src/empty-states/state');

	module.exports = {
		VibeCodeCatalogFavoriteEmptyState: ({ testId }) => renderVibeCodeCatalogState({
			testId,
			title: Loc.getMessage('MOBILE_VIBECODE_CATALOG_FAVORITE_EMPTY_TITLE'),
		}),
	};
});
