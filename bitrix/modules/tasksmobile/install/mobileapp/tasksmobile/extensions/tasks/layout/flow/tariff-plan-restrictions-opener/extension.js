/**
 * @module tasks/layout/flow/tariff-plan-restrictions-opener
 */
jn.define('tasks/layout/flow/tariff-plan-restrictions-opener', (require, exports, module) => {
	const { Loc } = require('loc');

	const openPlanRestriction = async (parentWidget = PageManager) => {
		const { PlanRestriction } = await requireLazy('layout/ui/plan-restriction');

		PlanRestriction.open(
			{
				title: Loc.getMessage('TASKSMOBILE_FLOW_TARIFF_PLAN_RESTRICTIONS_TITLE'),
				text: Loc.getMessage('TASKSMOBILE_FLOW_TARIFF_PLAN_RESTRICTIONS_DESCRIPTION'),
			},
			parentWidget,
		);
	};

	module.exports = { openPlanRestriction };
});
