/**
 * @module layout/ui/field-filter/filter/src/enums/saved-filter-action
 */
jn.define('layout/ui/field-filter/filter/src/enums/saved-filter-action', (require, exports, module) => {
	const { BaseEnum } = require('utils/enums/base');

	/**
	 * Saved filter actions (CONTRACT-API-02). The namespace is supplied by the consumer,
	 * the method names are fixed by the contract.
	 * @extends {BaseEnum<SavedFilterAction>}
	 */
	class SavedFilterAction extends BaseEnum
	{
		static GET = new SavedFilterAction('GET', 'getSavedFilters');

		static SAVE = new SavedFilterAction('SAVE', 'saveFilter');

		static REORDER = new SavedFilterAction('REORDER', 'reorderFilters');

		static DELETE = new SavedFilterAction('DELETE', 'deleteFilter');

		static PIN = new SavedFilterAction('PIN', 'pinFilter');

		static SET_FOR_ALL = new SavedFilterAction('SET_FOR_ALL', 'setForAll');

		static UNSET_FOR_ALL = new SavedFilterAction('UNSET_FOR_ALL', 'unsetForAll');

		static RESTORE = new SavedFilterAction('RESTORE', 'restoreFilters');
	}

	module.exports = {
		SavedFilterAction: SavedFilterAction.export(),
	};
});
