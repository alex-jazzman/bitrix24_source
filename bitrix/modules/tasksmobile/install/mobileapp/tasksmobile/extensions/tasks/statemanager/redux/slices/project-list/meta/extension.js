/**
 * @module tasks/statemanager/redux/slices/project-list/meta
 */
jn.define('tasks/statemanager/redux/slices/project-list/meta', (require, exports, module) => {
	const { createEntityAdapter } = require('statemanager/redux/toolkit');
	const { StateCache } = require('statemanager/redux/state-cache');

	/** @type {string} */
	const sliceName = 'tasks:project-list';
	/** @type {object} */
	const entityAdapter = createEntityAdapter();
	/** @type {ProjectListState} */
	const initialState = StateCache.getReducerState(sliceName, entityAdapter.getInitialState());

	module.exports = {
		sliceName,
		entityAdapter,
		initialState,
	};
});
