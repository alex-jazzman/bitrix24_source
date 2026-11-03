/**
 * @module tasks/statemanager/redux/slices/checklist-items/meta
 */
jn.define('tasks/statemanager/redux/slices/checklist-items/meta', (require, exports, module) => {
	const { StateCache } = require('statemanager/redux/state-cache');
	const { createEntityAdapter } = require('statemanager/redux/toolkit');

	const sliceName = 'tasks:checklistItems';
	const itemsAdapter = createEntityAdapter();
	const initialState = StateCache.getReducerState(sliceName, itemsAdapter.getInitialState());

	module.exports = {
		sliceName,
		itemsAdapter,
		initialState,
	};
});
