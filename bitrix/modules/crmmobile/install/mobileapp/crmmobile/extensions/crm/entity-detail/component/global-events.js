/**
 * @module crm/entity-detail/component/global-events
 */
jn.define('crm/entity-detail/component/global-events', (require, exports, module) => {
	/**
	 * @type {(string, function(DetailCardComponent, ...*): void)[][]}
	 */
	const globalEvents = [
		[
			'Crm.Activity.Todo::onChangeNotifications',
			/**
			 * @param {DetailCardComponent} detailCard
			 * @param {Boolean} enabled
			 */
			(detailCard, enabled) => {
				const { todoNotificationParams } = detailCard.getComponentParams();
				if (!todoNotificationParams)
				{
					return;
				}

				todoNotificationParams.notificationEnabled = enabled;
			},
		],
		[
			'OpportunityButton::DidMount',
			/**
			 * @param {DetailCardComponent} detailCard
			 * @param {Object} ref
			 */
			(detailCard, ref) => {
				if (!detailCard?.entityModel?.IS_SALESCENTER_TOOL_ENABLED || !ref)
				{
					return;
				}

				const { entityId, entityTypeId, entityTypeName } = detailCard.getComponentParams();
				if (!entityId || !entityTypeId)
				{
					return;
				}

				requireLazy('crm:onboarding', false)
					.then(({ Onboarding, CaseName }) => {
						if (Onboarding)
						{
							void Onboarding.tryToShow(CaseName.ON_PAYMENT_ON_DEAL, {
								targetRef: ref,
								entityId,
								entityTypeId,
								entityType: entityTypeName,
							});
						}
					})
					.catch((error) => {
						console.error(error);
					});
			},
		],
	];

	module.exports = { globalEvents };
});
