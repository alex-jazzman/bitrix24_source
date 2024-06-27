/**
 * @module tasks/statemanager/redux/slices/tariff-plan-restrictions/tools
 */
jn.define('tasks/statemanager/redux/slices/tariff-plan-restrictions/tools', (require, exports, module) => {
	const { TARIFF_PLAN_RESTRICTIONS_PARAMS_ID } = require('tasks/statemanager/redux/slices/tariff-plan-restrictions/extra-reducer');
	const store = require('statemanager/redux/store');
	const { dispatch } = store;
	const {
		selectById,
	} = require('tasks/statemanager/redux/slices/tariff-plan-restrictions/selector');
	const {
		fetchTariffPlanRestrictionsParams,
	} = require('tasks/statemanager/redux/slices/tariff-plan-restrictions/thunk');
	const { Type } = require('type');

	const isFlowTaskCreationProhibited = () => {
		const featureRestrictions = selectById(store.getState(), TARIFF_PLAN_RESTRICTIONS_PARAMS_ID);

		if (Type.isNil(featureRestrictions)
			|| Type.isNil(featureRestrictions.params))
		{
			return false;
		}

		return featureRestrictions.params.isFlowTaskCreationProhibited;
	};

	const isTariffPlanRestrictionsLoaded = () => {
		const featureRestrictions = selectById(store.getState(), TARIFF_PLAN_RESTRICTIONS_PARAMS_ID);

		return !Type.isNil(featureRestrictions);
	};

	const loadTariffPlanRestrictionsIfNecessary = () => {
		if (!isTariffPlanRestrictionsLoaded())
		{
			dispatch(fetchTariffPlanRestrictionsParams());
		}
	};

	module.exports = {
		isFlowTaskCreationProhibited,
		isTariffPlanRestrictionsLoaded,
		loadTariffPlanRestrictionsIfNecessary,
	};
});
