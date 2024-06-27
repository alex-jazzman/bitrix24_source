/**
 * @module tasks/statemanager/redux/slices/tariff-plan-restrictions/meta
 */
jn.define('tasks/statemanager/redux/slices/tariff-plan-restrictions/meta', (require, exports, module) => {
	const { createEntityAdapter } = require('statemanager/redux/toolkit');
	const { StateCache } = require('statemanager/redux/state-cache');

	const sliceName = 'tasks:tariffPlanRestrictions';
	const entityAdapter = createEntityAdapter({});
	const initialState = StateCache.getReducerState(sliceName, entityAdapter.getInitialState());

	module.exports = {
		sliceName,
		entityAdapter,
		initialState,
	};
});
