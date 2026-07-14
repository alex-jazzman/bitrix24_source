/**
 * @module im/messenger/controller/navigation/src/nested/open-filter/projects-tariff-restriction
 */
jn.define('im/messenger/controller/navigation/src/nested/open-filter/projects-tariff-restriction', (require, exports, module) => {
	const { showProjectsGroupsRestrictionIfNeeded } = require('im/messenger/lib/plan-limit');
	const {
		BaseNestedNavigationOpenFilter,
	} = require('im/messenger/controller/navigation/src/nested/open-filter/base');

	/**
	 * @class ProjectsTariffRestrictionFilter
	 *
	 * Blocks nested navigation opening when the projects/groups feature is tariff-restricted
	 * and shows the standard PlanRestriction widget. Nested navigation is opened only for
	 * project parents, so the check runs unconditionally.
	 */
	class ProjectsTariffRestrictionFilter extends BaseNestedNavigationOpenFilter
	{
		/**
		 * @param {NestedNavigationOpenFilterContext} context
		 * @return {Promise<boolean>}
		 */
		async allow(context)
		{
			const isRestricted = await showProjectsGroupsRestrictionIfNeeded();

			return !isRestricted;
		}
	}

	module.exports = { ProjectsTariffRestrictionFilter };
});