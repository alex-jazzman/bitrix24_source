/**
 * @module tasks/statemanager/redux/slices/tariff-restrictions/tools
 */
jn.define('tasks/statemanager/redux/slices/tariff-restrictions/tools', (require, exports, module) => {
	const store = require('statemanager/redux/store');
	const { dispatch } = store;
	const { selectIsLoaded } = require('tasks/statemanager/redux/slices/tariff-restrictions/selector');
	const { fetch } = require('tasks/statemanager/redux/slices/tariff-restrictions/thunk');

	const loadTariffRestrictions = (isForceLoad = false) => {
		return (!isForceLoad && selectIsLoaded(store.getState()) ? Promise.resolve() : dispatch(fetch()));
	};

	module.exports = {
		loadTariffRestrictions,
	};
});
