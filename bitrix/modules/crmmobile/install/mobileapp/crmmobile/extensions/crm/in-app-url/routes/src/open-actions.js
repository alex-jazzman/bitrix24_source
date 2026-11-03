/**
 * @module crm/in-app-url/routes/src/open-actions
 */
jn.define('crm/in-app-url/routes/src/open-actions', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');
	const { Type } = require('crm/type');
	const { Presentation } = require('in-app-url/presentation');
	const { WidgetPresenter } = require('in-app-url/widget-presenter');
	const { DisablingTools } = require('crm/disabling-tools');
	const { InfoHelper } = require('layout/ui/info-helper');
	const { requireLazy } = require('require-lazy');
	const { filterSupportedQueryParams } = require('crm/in-app-url/routes/query-params');

	/**
	 * @function openEntityDetail
	 * @param {number} entityTypeId
	 * @param {number} entityId
	 * @param {CrmOpenEntityDetailOptions} [options]
	 * @return {Promise<boolean>} whether the link reached a screen of its own
	 */
	const openEntityDetail = async (
		entityTypeId,
		entityId,
		{
			linkText = '',
			canOpenInDefault,
			queryParams,
			parentWidget,
			analytics,
			presentation,
			...restPayload
		} = {},
	) => {
		if (!Type.isEntitySupportedById(entityTypeId))
		{
			return false;
		}

		const sliderCode = await DisablingTools.getSliderCode(entityTypeId);
		if (sliderCode)
		{
			const sliderUrl = await InfoHelper.getUrlByCode(sliderCode);

			helpdesk.openHelp(sliderUrl);

			return true;
		}

		const filteredQueryParams = filterSupportedQueryParams(queryParams);

		const payload = {
			entityId: Number(entityId),
			entityTypeId: Number(entityTypeId),
			...restPayload,
			...filteredQueryParams,
		};

		const widgetParams = {};
		if (linkText)
		{
			widgetParams.titleParams = { text: linkText };
		}

		const { EntityDetailOpener } = await requireLazy('crm:entity-detail/opener');
		const preparedAnalytics = analytics ?? new AnalyticsEvent(BX.componentParameters.get('analytics', {}));
		EntityDetailOpener.open({
			payload,
			widgetParams,
			parentWidget: parentWidget || null,
			canOpenInDefault,
			analytics: preparedAnalytics,
			presentation,
		});

		return true;
	};

	/**
	 * @function openEntityList
	 * @param {CrmOpenEntityListOptions} options
	 * @return {Promise<boolean>} whether the link reached a screen of its own
	 */
	const openEntityList = async ({ activeTabName, entityTypeId, presentation }) => {
		if (!Type.isEntitySupportedByName(activeTabName))
		{
			return false;
		}

		const sliderCode = await DisablingTools.getSliderCode(entityTypeId);
		if (sliderCode)
		{
			const sliderUrl = await InfoHelper.getUrlByCode(sliderCode);

			helpdesk.openHelp(sliderUrl);

			return true;
		}

		new WidgetPresenter()
			.setPresentation(Presentation.resolve(presentation, Presentation.LAYOUT))
			.setCanOpenInDefault(true)
			.setTitleParams({ text: 'CRM' })
			.setComponentName('crm:crm.tabs', {
				componentParams: { activeTabName },
			})
			.open()
			.catch(console.error)
		;

		return true;
	};

	module.exports = { openEntityDetail, openEntityList };
});
