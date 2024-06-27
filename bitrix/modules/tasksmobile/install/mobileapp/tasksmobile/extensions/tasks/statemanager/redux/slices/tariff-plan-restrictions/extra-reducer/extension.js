/* eslint-disable no-param-reassign */
/**
 * @module tasks/statemanager/redux/slices/tariff-plan-restrictions/extra-reducer
 */
jn.define('tasks/statemanager/redux/slices/tariff-plan-restrictions/extra-reducer', (require, exports, module) => {
	const { statusTypes } = require('tasks/statemanager/redux/types');
	const { entityAdapter } = require('tasks/statemanager/redux/slices/tariff-plan-restrictions/meta');

	const TARIFF_PLAN_RESTRICTIONS_PARAMS_ID = 'tariffPlanRestrictionsParams';

	const fetchTariffPlanRestrictionsParamsPending = (state, action) => {
		state.status = statusTypes.pending;
	};

	const fetchTariffPlanRestrictionsParamsFulfilled = (state, action) => {
		state.status = statusTypes.success;

		if (action.payload.data)
		{
			const preparedData = {
				id: TARIFF_PLAN_RESTRICTIONS_PARAMS_ID,
				params: action.payload.data,
			};

			entityAdapter.upsertOne(state, preparedData);
		}
	};

	const fetchTariffPlanRestrictionsParamsRejected = (state, action) => {
		state.status = statusTypes.failure;
	};

	module.exports = {
		fetchTariffPlanRestrictionsParamsPending,
		fetchTariffPlanRestrictionsParamsFulfilled,
		fetchTariffPlanRestrictionsParamsRejected,
		TARIFF_PLAN_RESTRICTIONS_PARAMS_ID,
	};
});
