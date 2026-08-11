/**
 * @module vibecode/catalog/src/empty-states/hidden-empty-state
 */
jn.define('vibecode/catalog/src/empty-states/hidden-empty-state', (require, exports, module) => {
	const { Loc } = require('loc');
	const { renderVibeCodeCatalogState } = require('vibecode/catalog/src/empty-states/state');

	module.exports = {
		VibeCodeCatalogHiddenEmptyState: ({ testId }) => renderVibeCodeCatalogState({
			testId,
			title: Loc.getMessage('MOBILE_VIBECODE_CATALOG_HIDDEN_EMPTY_TITLE'),
		}),
	};
});
