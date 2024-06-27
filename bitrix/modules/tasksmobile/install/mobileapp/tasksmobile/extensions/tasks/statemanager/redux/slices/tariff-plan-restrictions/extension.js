/**
 * @module tasks/statemanager/redux/slices/tariff-plan-restrictions
 */
jn.define('tasks/statemanager/redux/slices/tariff-plan-restrictions', (require, exports, module) => {
	const { slice } = require('tasks/statemanager/redux/slices/tariff-plan-restrictions/slice');
	const { TARIFF_PLAN_RESTRICTIONS_PARAMS_ID } = require('tasks/statemanager/redux/slices/tariff-plan-restrictions/extra-reducer');
	const {
		isFlowTaskCreationProhibited,
		isTariffPlanRestrictionsLoaded,
		loadTariffPlanRestrictionsIfNecessary,
	} = require('tasks/statemanager/redux/slices/tariff-plan-restrictions/tools');
	const {
		fetchTariffPlanRestrictionsParams,
	} = require('tasks/statemanager/redux/slices/tariff-plan-restrictions/thunk');

	const {
		tariffPlanRestrictionsParamsSelector,
		selectAll,
		selectById,
		selectEntities,
		selectIds,
		selectTotal,
	} = require('tasks/statemanager/redux/slices/tariff-plan-restrictions/selector');

	module.exports = {
		tariffPlanRestrictionsParamsSelector,
		selectAll,
		selectById,
		selectEntities,
		selectIds,
		selectTotal,

		fetchTariffPlanRestrictionsParams,

		slice,

		TARIFF_PLAN_RESTRICTIONS_PARAMS_ID,
		isFlowTaskCreationProhibited,
		isTariffPlanRestrictionsLoaded,
		loadTariffPlanRestrictionsIfNecessary,
	};
});
