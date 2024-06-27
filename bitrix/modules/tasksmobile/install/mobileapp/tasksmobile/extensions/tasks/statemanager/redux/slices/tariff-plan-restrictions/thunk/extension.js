/**
 * @module tasks/statemanager/redux/slices/tariff-plan-restrictions/thunk
 */
jn.define('tasks/statemanager/redux/slices/tariff-plan-restrictions/thunk', (require, exports, module) => {
	const { createAsyncThunk } = require('statemanager/redux/toolkit');
	const { sliceName } = require('tasks/statemanager/redux/slices/tariff-plan-restrictions/meta');

	const {
		loadFeatureRestrictions,
	} = require('tasks/statemanager/redux/slices/tariff-plan-restrictions/thunk/src/data-provider');

	const fetchTariffPlanRestrictionsParams = createAsyncThunk(
		`${sliceName}/fetchTariffPlanRestrictionsParams`,
		async (loadDataParams, { rejectWithValue }) => {
			try
			{
				const response = await loadFeatureRestrictions();
				if (response && response.status === 'success')
				{
					return response;
				}

				return rejectWithValue(response);
			}
			catch (error)
			{
				console.error(error);
			}
		},
	);

	module.exports = {
		fetchTariffPlanRestrictionsParams,
	};
});
