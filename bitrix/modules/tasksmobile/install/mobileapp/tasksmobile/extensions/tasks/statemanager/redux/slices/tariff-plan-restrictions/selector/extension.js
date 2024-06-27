/**
 * @module tasks/statemanager/redux/slices/tariff-plan-restrictions/selector
 */
jn.define('tasks/statemanager/redux/slices/tariff-plan-restrictions/selector', (require, exports, module) => {
	const { sliceName, entityAdapter } = require('tasks/statemanager/redux/slices/tariff-plan-restrictions/meta');

	const tariffPlanRestrictionsParamsSelector = entityAdapter.getSelectors((state) => state[sliceName]);

	const {
		selectAll,
		selectById,
		selectEntities,
		selectIds,
		selectTotal,
	} = tariffPlanRestrictionsParamsSelector;

	module.exports = {
		tariffPlanRestrictionsParamsSelector,

		selectAll,
		selectById,
		selectEntities,
		selectIds,
		selectTotal,
	};
});
