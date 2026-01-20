/**
 * @module tasks/statemanager/redux/slices/tasks-results-v2/meta
 */
jn.define('tasks/statemanager/redux/slices/tasks-results-v2/meta', (require, exports, module) => {
	const { StateCache } = require('statemanager/redux/state-cache');
	const { createEntityAdapter } = require('statemanager/redux/toolkit');

	const sliceName = 'tasks:tasksResultsV2';
	const tasksResultsAdapter = createEntityAdapter();
	const defaultState = {
		results: tasksResultsAdapter.getInitialState(),
		map: {},
	};
	const initialState = StateCache.getReducerState(sliceName, defaultState);

	module.exports = {
		sliceName,
		tasksResultsAdapter,
		initialState,
	};
});
