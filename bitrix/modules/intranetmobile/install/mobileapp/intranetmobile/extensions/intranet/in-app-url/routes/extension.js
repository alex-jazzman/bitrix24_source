/**
 * @module intranet/in-app-url/routes
 */
jn.define('intranet/in-app-url/routes', (require, exports, module) => {
	const { Loc } = require('loc');

	module.exports = (inAppUrl) => {
		inAppUrl.register('/intranetmobile/users', (params, { context }) => {
			const {
				canInvite = false,
				canUseTelephony = false,
				title = null,
				openInviteOnMount = false,
			} = context;

			const defaultTitle = Loc.getMessage('IN_APP_URL_INTRANET_USER_LIST_TITLE');

			PageManager.openComponent('JSStackComponent', {
				// eslint-disable-next-line no-undef
				scriptPath: availableComponents['intranet:user.list'].publicUrl,
				componentCode: 'intranet.user.list',
				params: {
					canInvite,
					canUseTelephony,
					openInviteOnMount,
				},
				rootWidget: {
					name: 'layout',
					componentCode: 'users',
					settings: {
						objectName: 'layout',
						titleParams: {
							text: title || defaultTitle,
							type: 'section',
						},
					},
				},
			});
		}).name('intranetmobile-users-list');
	};
});
