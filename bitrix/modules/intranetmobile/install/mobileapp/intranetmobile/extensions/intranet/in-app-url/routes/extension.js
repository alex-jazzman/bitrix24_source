/**
 * @module intranet/in-app-url/routes
 */
jn.define('intranet/in-app-url/routes', (require, exports, module) => {
	const { Loc } = require('loc');
	const { requireLazy } = require('require-lazy');

	module.exports = (inAppUrl) => {
		inAppUrl
			.addRoute('/intranetmobile/users')
			.handler((params, { context }) => {
				const {
					canInvite = false,
					canUseTelephony = false,
					title = null,
					openInviteOnMount = false,
					canOpenInDefault,
					deeplink,
				} = context ?? {};

				const componentParams = {
					canInvite,
					canUseTelephony,
					openInviteOnMount,
				};
				const titleText = title || Loc.getMessage('IN_APP_URL_INTRANET_USER_LIST_TITLE');

				void requireLazy('in-app-url/widget-presenter')
					.then(({ WidgetPresenter } = {}) => {
						if (!WidgetPresenter)
						{
							PageManager.openComponent('JSStackComponent', {
								// eslint-disable-next-line no-undef
								scriptPath: availableComponents['intranet:user.list'].publicUrl,
								componentCode: 'intranet.user.list',
								params: componentParams,
								rootWidget: {
									name: 'layout',
									componentCode: 'users',
									settings: {
										objectName: 'layout',
										titleParams: {
											text: titleText,
											type: 'section',
										},
									},
								},
							});

							return;
						}

						void WidgetPresenter.fromContext(context)
							.setComponentName('intranet:user.list', { componentParams })
							.setTitleParams({
								text: titleText,
								type: 'section',
							})
							.setCanOpenInDefault(canOpenInDefault ?? Boolean(deeplink))
							.open();
					});
			})
			.name('intranetmobile-users-list');
	};
});
