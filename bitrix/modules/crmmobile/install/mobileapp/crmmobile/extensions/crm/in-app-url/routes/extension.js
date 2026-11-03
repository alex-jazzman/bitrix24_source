/**
 * @module crm/in-app-url/routes
 */
jn.define('crm/in-app-url/routes', (require, exports, module) => {
	const { Type } = require('crm/type');
	const { openEntityDetail, openEntityList } = require('crm/in-app-url/routes/src/open-actions');
	const { resolveEntityListTarget } = require('crm/in-app-url/routes/entity-list-target');
	const { requireLazy } = require('require-lazy');
	const { openPortalPage } = require('in-app-url/portal-page');

	/**
	 * The card and the list open through their own screens, and a link they cannot show
	 * (unsupported entity, a failure on the way) still has to reach the portal page.
	 *
	 * @param {Promise<boolean>} opening
	 * @return {Promise<boolean>}
	 */
	const openedOrReported = (opening) => opening.catch((error) => {
		console.error('crm/in-app-url: unable to open the crm screen', error);

		return false;
	});

	/**
	 * @param {InAppUrl} inAppUrl
	 */
	module.exports = (inAppUrl) => {
		inAppUrl.register(
			'/crm/activity/details/:activityId/\\?act=',
			eventOpenCrmSharedMessageHandler,
		).name('crm:activity-shared-mail-message:open');

		inAppUrl
			.addRoute('/crm/:entityTypeName/details/:id/')
			.addRoute('/page/:sectionName/:pageName/type/:entityTypeId/details/:id/')
			.addRoute('/crm/type/:entityTypeId/details/:id/')
			.handler(async ({ id, entityTypeId, entityTypeName }, { context, queryParams, url }) => {
				const { canOpenInDefault, deeplink, ...restContext } = context ?? {};

				const opened = await openedOrReported(openEntityDetail(
					entityTypeId ?? Type.resolveIdByName(entityTypeName),
					id,
					{
						...restContext,
						queryParams,
						canOpenInDefault: canOpenInDefault ?? Boolean(deeplink),
					},
				));

				if (!opened)
				{
					return openPortalPage(url, context);
				}

				return null;
			})
			.name('crm:detail');

		inAppUrl
			.addRoute('/crm/:typeName/:typeId/')
			.addRoute('/crm/:typeName/')
			.handler(async ({ typeName, typeId }, { context, url }) => {
				const { entityTypeId, activeTabName } = resolveEntityListTarget({ typeName, typeId });

				const opened = await openedOrReported(openEntityList({
					activeTabName,
					entityTypeId,
					presentation: context?.presentation,
				}));

				if (!opened)
				{
					return openPortalPage(url, context);
				}

				return null;
			})
			.name('crm:entityList');

		inAppUrl
			.addRoute('/shop/documents/details/sales_order/:id/')
			.handler(({ id }, { context, url }) => {
				const { canOpenInDefault, deeplink, linkText, presentation } = context ?? {};

				return requireLazy('catalog:store/document-card/manager')
					.then(({ DocumentCardManager } = {}) => {
						if (!DocumentCardManager)
						{
							return openPortalPage(url, context);
						}

						return DocumentCardManager.open({
							id,
							title: linkText,
							presentation,
							canOpenInDefault: canOpenInDefault ?? Boolean(deeplink),
						});
					})
					.catch((error) => {
						console.error('crm/in-app-url: unable to open the store document', error);

						return openPortalPage(url, context);
					});
			})
			.name('crm:storeDocumentDetail');
	};

	const eventOpenCrmSharedMessageHandler = ({ activityId }, { queryParams = {}, url, context = {} } = {}) => {
		const act = String(queryParams.act ?? '');
		if (!act)
		{
			return openPortalPage(url, context);
		}

		return requireLazy('mail:opener', false)
			.then(({ MailOpener } = {}) => {
				if (MailOpener?.openCrmSharedMessage)
				{
					return MailOpener.openCrmSharedMessage({ activityId, act });
				}

				return openPortalPage(url, context);
			})
			.catch(() => openPortalPage(url, context));
	};
});
