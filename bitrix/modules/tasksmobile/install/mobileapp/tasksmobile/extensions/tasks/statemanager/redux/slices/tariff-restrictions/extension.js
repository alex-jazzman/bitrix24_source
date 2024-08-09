/**
 * @module tasks/statemanager/redux/slices/tariff-restrictions
 */
jn.define('tasks/statemanager/redux/slices/tariff-restrictions', (require, exports, module) => {
	const { ReducerRegistry } = require('statemanager/redux/reducer-registry');
	const { createSlice } = require('statemanager/redux/toolkit');

	const { sliceName, initialState } = require('tasks/statemanager/redux/slices/tariff-restrictions/meta');
	const { fetch } = require('tasks/statemanager/redux/slices/tariff-restrictions/thunk');
	const { fetchFulfilled } = require('tasks/statemanager/redux/slices/tariff-restrictions/extra-reducer');
	const {
		selectIsLoaded,
		selectIsFlowTaskCreationProhibited,
	} = require('tasks/statemanager/redux/slices/tariff-restrictions/selector');
	const { loadTariffRestrictions } = require('tasks/statemanager/redux/slices/tariff-restrictions/tools');

	const tariffRestrictionsSlice = createSlice({
		initialState,
		name: sliceName,
		reducers: {},
		extraReducers: (builder) => builder.addCase(fetch.fulfilled, fetchFulfilled),
	});

	ReducerRegistry.register(sliceName, tariffRestrictionsSlice.reducer);

	module.exports = {
		selectIsLoaded,
		selectIsFlowTaskCreationProhibited,
		loadTariffRestrictions,
	};
});
