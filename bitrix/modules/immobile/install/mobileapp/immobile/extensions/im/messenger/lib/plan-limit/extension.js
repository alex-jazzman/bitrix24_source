/**
 * @module im/messenger/lib/plan-limit
 */
jn.define('im/messenger/lib/plan-limit', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { AnalyticsEvent } = require('analytics');
	const { getFeatureRestriction, tariffPlanRestrictionsReady } = require('tariff-plan-restriction');

	const { Logger } = require('im/messenger/lib/logger');
	const { ErrorType, Analytics } = require('im/messenger/const');
	const { MessengerParams } = require('im/messenger/lib/params');
	const { AnalyticsService } = require('im/messenger/provider/services/analytics');
	const { Feature } = require('im/messenger/lib/feature');

	const PROJECTS_GROUPS_FEATURE_ID = 'socialnetwork_projects_groups';

	/**
	 * @param {AnalyticsEvent} analytics
	 */
	async function openPlanLimitsWidget(analytics)
	{
		try
		{
			const { PlanRestriction } = await requireLazy('layout/ui/plan-restriction');
			const title = Loc.getMessage('IMMOBILE_PLAN_LIMITS_WIDGET_TITTLE');
			PlanRestriction.open({ title, featureId: 'im_full_chat_history' });
			sendAnalyticsOpenPlanLimitWidget(analytics);
		}
		catch (error)
		{
			Logger.error(`${this.constructor.name}.openPlanLimitsWidget catch:`, error);
		}
	}

	async function openPlanLimitsWidgetByError({ error = '', error_description: errorDescription = '', message = '' })
	{
		if (error === ErrorType.planLimit.MESSAGE_ACCESS_DENIED_BY_TARIFF
			|| errorDescription === ErrorType.planLimit.MESSAGE_ACCESS_DENIED_BY_TARIFF
			|| message === ErrorType.planLimit.MESSAGE_ACCESS_DENIED_BY_TARIFF
		)
		{
			const analytics = new AnalyticsEvent()
				.setSection(Analytics.Section.messageLink);

			await openPlanLimitsWidget(analytics);

			return;
		}

		if (error === ErrorType.planLimit.COLLAB_TARIFF_RESTRICTED
			|| errorDescription === ErrorType.planLimit.COLLAB_TARIFF_RESTRICTED
			|| message === ErrorType.planLimit.COLLAB_TARIFF_RESTRICTED
		)
		{
			await tariffPlanRestrictionsReady();
			getFeatureRestriction(PROJECTS_GROUPS_FEATURE_ID).showRestriction();
		}
	}

	/**
	 * @param {AnalyticsEvent} analyticsData
	 */
	function sendAnalyticsOpenPlanLimitWidget(analyticsData)
	{
		AnalyticsService.getInstance().sendAnalyticsOpenPlanLimitWidget(analyticsData);
	}

	/**
	 * @return {boolean}
	 */
	function isProjectsGroupsRestricted()
	{
		if (!Feature.isNestedChatAvailable)
		{
			return false;
		}

		return MessengerParams.get('PLAN_LIMITS', {})?.collab?.isAvailable !== true;
	}

	/**
	 * @param {object} [params={}]
	 * @param {PageManager} [params.parentWidget]
	 * @param {boolean} [params.showInComponent]
	 * @param {function} [params.onHidden]
	 * @param {AnalyticsEvent|AnalyticsDTO} [params.analyticsData]
	 * @return {Promise<boolean>} true when restriction widget was shown
	 */
	async function showProjectsGroupsRestrictionIfNeeded(params = {})
	{
		if (!isProjectsGroupsRestricted())
		{
			return false;
		}

		await tariffPlanRestrictionsReady();
		getFeatureRestriction(PROJECTS_GROUPS_FEATURE_ID).showRestriction(params);

		return true;
	}

	module.exports = {
		openPlanLimitsWidget,
		openPlanLimitsWidgetByError,
		isProjectsGroupsRestricted,
		showProjectsGroupsRestrictionIfNeeded,
	};
});
