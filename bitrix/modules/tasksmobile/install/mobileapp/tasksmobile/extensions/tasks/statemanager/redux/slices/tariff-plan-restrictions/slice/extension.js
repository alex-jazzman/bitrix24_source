/**
 * @module tasks/statemanager/redux/slices/tariff-plan-restrictions/slice
 */
jn.define('tasks/statemanager/redux/slices/tariff-plan-restrictions/slice', (require, exports, module) => {
	const { ReducerRegistry } = require('statemanager/redux/reducer-registry');
	const { createSlice } = require('statemanager/redux/toolkit');

	const {
		fetchTariffPlanRestrictionsParams,
	} = require('tasks/statemanager/redux/slices/tariff-plan-restrictions/thunk');

	const { sliceName, initialState } = require('tasks/statemanager/redux/slices/tariff-plan-restrictions/meta');

	const {
		fetchTariffPlanRestrictionsParamsPending,
		fetchTariffPlanRestrictionsParamsFulfilled,
		fetchTariffPlanRestrictionsParamsRejected,
	} = require('tasks/statemanager/redux/slices/tariff-plan-restrictions/extra-reducer');

	function getExtraReducers()
	{
		return (builder) => {
			builder
				.addCase(fetchTariffPlanRestrictionsParams.pending, fetchTariffPlanRestrictionsParamsPending)
				.addCase(fetchTariffPlanRestrictionsParams.fulfilled, fetchTariffPlanRestrictionsParamsFulfilled)
				.addCase(fetchTariffPlanRestrictionsParams.rejected, fetchTariffPlanRestrictionsParamsRejected);
		};
	}

	const slice = createSlice({
		name: sliceName,
		initialState,
		reducers: {},
		extraReducers: getExtraReducers(),
	});

	ReducerRegistry.register(sliceName, slice.reducer);

	module.exports = {
		slice,
	};
});
