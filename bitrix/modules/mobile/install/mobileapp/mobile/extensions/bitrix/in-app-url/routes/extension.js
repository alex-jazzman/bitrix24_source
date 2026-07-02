/**
 * @module in-app-url/routes
 */
jn.define('in-app-url/routes', (require, exports, module) => {
	const { ProjectOpener } = require('project/opener');
	const { requireLazy } = require('require-lazy');
	const { FeatureFlagType, checkFeatureFlag } = require('feature-flag');
	const { RunActionExecutor } = require('rest/run-action-executor');

	/**
	 * @param {InAppUrl} inAppUrl
	 */
	module.exports = function(inAppUrl) {
		inAppUrl.register('/company/personal/user/:userId/(\\?\\w+)?$', ({ userId }, { context = {} }) => {
			requireLazy('user-profile')
				.then(({ UserProfile }) => {
					void UserProfile.open({
						ownerId: userId,
						analyticsSection: context.analyticsSection ?? '',
						openInComponent: Boolean(context.deeplink),
					});
				})
				.catch(console.error);
		}).name('open:user');

		inAppUrl.register('/company/personal/user/:userId/blog/:postId/$', ({ postId }) => {
			PageManager.openPage({
				url: `mobile/log/?ACTION=CONVERT&ENTITY_TYPE_ID=BLOG_POST&ENTITY_ID=${postId}`,
			});
		}).name('blog:post');

		inAppUrl.register(
			'/company/personal/user/:userId/blog/:postId/\\?commentId=:commentId#com:com',
			({ postId, commentId, com }) => {
				PageManager.openPage({
					url: `mobile/log/?ACTION=CONVERT&ENTITY_TYPE_ID=BLOG_POST&ENTITY_ID=${postId}&commentId=${commentId}#com${com}`,
				});
			},
		).name('blog:post:comment');

		inAppUrl.register('/company/personal/log/:logId/$', ({ logId }) => {
			PageManager.openPage({
				url: `mobile/log/?ACTION=CONVERT&ENTITY_TYPE_ID=LOG_ENTRY&ENTITY_ID=${logId}`,
			});
		}).name('log:entry');

		inAppUrl.register('/workgroups/group/:groupId/', async ({ groupId }) => {
			const isProjectV2enabled = await checkFeatureFlag(FeatureFlagType.PROJECTS_V2);

			if (isProjectV2enabled)
			{
				try
				{
					const response = await (new RunActionExecutor('mobile.Project.getChatId', {
						projectId: groupId,
					}))
						.enableJson()
						.call(false);
					const chatId = Number(response.data?.chatId || 0);

					if (chatId > 0)
					{
						const { openNestedNavigation } = await requireLazy('im:messenger/api/navigation');
						await openNestedNavigation(chatId);
					}

					return;
				}
				catch(e)
				{
					console.error(e);
				}
			}

			void ProjectOpener.open({
				projectId: groupId,
				siteId: env.siteId,
				siteDir: env.siteDir,
			});
		}).name('group:open');
	};
});
