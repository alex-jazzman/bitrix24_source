/**
 * @module tasks/statemanager/redux/slices/checklists/meta
 */
jn.define('tasks/statemanager/redux/slices/checklists/meta', (require, exports, module) => {
	const { StateCache } = require('statemanager/redux/state-cache');
	const { createEntityAdapter } = require('statemanager/redux/toolkit');

	const sliceName = 'tasks:checklists';
	const checklistsAdapter = createEntityAdapter();
	const initialState = StateCache.getReducerState(sliceName, checklistsAdapter.getInitialState());

	module.exports = {
		sliceName,
		checklistsAdapter,
		initialState,
	};
});
