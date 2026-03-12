/**
 * @module in-app-url/routes
 */
jn.define('in-app-url/routes', (require, exports, module) => {
	const { UserProfile } = require('user-profile');
	const { WorkgroupUtil } = require('project/utils');

	/**
	 * @param {InAppUrl} inAppUrl
	 */
	module.exports = function(inAppUrl) {
		inAppUrl.register('/company/personal/user/:userId/(\\?\\w+)?$', ({ userId }, { context = {} }) => {
			void UserProfile.open({
				ownerId: userId,
				analyticsSection: context.analyticsSection ?? '',
			});
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

		inAppUrl.register('/workgroups/group/:groupId/', ({ groupId }) => {
			void WorkgroupUtil.openProject(null, {
				projectId: groupId,
				siteId: env.siteId,
				siteDir: env.siteDir,
			});
		}).name('group:open');
	};
});
