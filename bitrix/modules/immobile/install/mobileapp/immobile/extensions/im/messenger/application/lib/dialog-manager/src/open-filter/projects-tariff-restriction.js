/**
 * @module im/messenger/application/lib/dialog-manager/src/open-filter/projects-tariff-restriction
 */
jn.define('im/messenger/application/lib/dialog-manager/src/open-filter/projects-tariff-restriction', (require, exports, module) => {
	const { isProjectsGroupsRestricted, showProjectsGroupsRestrictionIfNeeded } = require('im/messenger/lib/plan-limit');
	const {
		BaseOpenDialogFilter,
	} = require('im/messenger/application/lib/dialog-manager/src/open-filter/base');

	/**
	 * @class ProjectsTariffRestrictionFilter
	 *
	 * Blocks opening a project or a child of a project when the projects/groups feature
	 * is tariff-restricted and shows the standard PlanRestriction widget.
	 *
	 * Two seams for tests — {@link #isTariffRestricted} and {@link #showRestriction} are
	 * `@protected` and meant to be overridden in a test subclass so unit tests can drive
	 * the branches without touching MessengerParams or opening a real widget.
	 */
	class ProjectsTariffRestrictionFilter extends BaseOpenDialogFilter
	{
		/**
		 * @param {DialogOpenContext} context
		 * @return {Promise<boolean>}
		 */
		async allow(context)
		{
			// Cheap sync gate first — skip the project/parent lookup entirely when the
			// tariff doesn't restrict projects/groups (most users). The parent REST in
			// DialogOpenContext only runs for restricted tariffs that need this gate.
			if (!this.isTariffRestricted())
			{
				return true;
			}

			if (!await context.isProjectOrChildOfProject())
			{
				return true;
			}

			const isRestricted = await this.showRestriction({ parentWidget: context.parentWidget });

			return !isRestricted;
		}

		/**
		 * @protected
		 * @return {boolean}
		 */
		isTariffRestricted()
		{
			return isProjectsGroupsRestricted();
		}

		/**
		 * @protected
		 * @param {object} params
		 * @param {PageManager} [params.parentWidget]
		 * @return {Promise<boolean>} true when the restriction widget was shown
		 */
		showRestriction(params)
		{
			return showProjectsGroupsRestrictionIfNeeded(params);
		}
	}

	module.exports = { ProjectsTariffRestrictionFilter };
});