/**
 * @module crm/in-app-url/routes
 */
jn.define('crm/in-app-url/routes', (require, exports, module) => {
	const { openEntityDetail, openEntityList } = require('crm/in-app-url/routes/open-actions');
	const { Type } = require('crm/type');
	let DocumentCardManager = null;
	try
	{
		DocumentCardManager = require('catalog/store/document-card/manager').DocumentCardManager;
	}
	catch (e)
	{
		console.warn('Cannot get DocumentCardManager extension', e);
	}

	/**
	 * @param {InAppUrl} inAppUrl
	 */
	module.exports = (inAppUrl) => {
		inAppUrl.register(
			'/crm/activity/details/:activityId/\\?act=',
			eventOpenCrmSharedMessageHandler,
		).name('crm:activity-shared-mail-message:open');

		inAppUrl.register(
			'/crm/:entityTypeName/details/:id/',
			({ id, entityTypeName }, { context, queryParams }) => {
				const entityTypeId = Type.resolveIdByName(entityTypeName);

				openEntityDetail(
					entityTypeId,
					id,
					{ ...context, queryParams },
				);
			},
		).name('crm:detailStaticEntityTypes');

		inAppUrl.register(
			'/page/:sectionName/:pageName/type/:entityTypeId/details/:id/',
			({ id, entityTypeId }, { context, queryParams }) => {
				openEntityDetail(
					entityTypeId,
					id,
					{ ...context, queryParams },
				);
			},
		).name('crm:detailStaticEntityDynamicTypes');

		inAppUrl.register(
			'/crm/type/:entityTypeId/details/:id/',
			({ id, entityTypeId }, { context, queryParams }) => {
				openEntityDetail(
					entityTypeId,
					id,
					{ ...context, queryParams },
				);
			},
		).name('crm:detailDynamicEntityTypes');

		inAppUrl.register('/crm/:typeName/:typeId/', ({ typeName, typeId }) => {
			const entityTypeId = typeName === 'type' ? typeId : Type.resolveIdByName(typeName);

			openEntityList({
				activeTabName: typeName,
				entityTypeId,
			});
		}).name('crm:entityTypesList');

		inAppUrl.register('/crm/:typeName/', ({ typeName, typeId }) => {
			const entityTypeId = Type.resolveIdByName(typeName);

			openEntityList({
				activeTabName: typeName,
				entityTypeId,
			});
		}).name('crm:entityList');

		if (DocumentCardManager)
		{
			inAppUrl.register('/shop/documents/details/sales_order/:id/', ({ id }, { context }) => {
				DocumentCardManager.open({
					id,
					title: context.linkText,
				});
			}).name('crm:storeDocumentDetail');
		}
	};

	const eventOpenCrmSharedMessageHandler = ({ activityId }, { queryParams = {}, url, context = {} } = {}) => {
		const act = String(queryParams.act ?? '');
		if (!act)
		{
			openFallbackPage(url, context);

			return;
		}

		void jn.import('mail:opener')
			.then(() => {
				const { MailOpener } = require('mail/opener');

				if (MailOpener?.openCrmSharedMessage)
				{
					MailOpener.openCrmSharedMessage({ activityId, act });

					return;
				}

				openFallbackPage(url, context);
			})
			.catch(() => openFallbackPage(url, context));
	};

	const openFallbackPage = (url, context = {}) => {
		PageManager.openPage({
			bx24ModernStyle: true,
			...context,
			url,
		});
	};
});
