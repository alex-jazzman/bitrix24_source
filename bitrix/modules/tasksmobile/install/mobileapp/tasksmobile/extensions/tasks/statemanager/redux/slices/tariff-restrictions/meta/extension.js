/**
 * @module tasks/statemanager/redux/slices/tariff-restrictions/meta
 */
jn.define('tasks/statemanager/redux/slices/tariff-restrictions/meta', (require, exports, module) => {
	const { StateCache } = require('statemanager/redux/state-cache');

	const sliceName = 'tasks:tariffRestrictions';
	const defaultState = {
		isLoaded: false,
		restrictions: {},
	};
	const initialState = StateCache.getReducerState(sliceName, defaultState);

	module.exports = {
		sliceName,
		initialState,
	};
});
