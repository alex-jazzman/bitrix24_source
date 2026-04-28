/**
 * @module in-app-url/routes/bitrix24
 */
jn.define('in-app-url/routes/bitrix24', (require, exports, module) => {
	const { Loc } = require('loc');
	const { ComponentOpener } = require('whats-new/ui-manager/component-opener');
	const { requireLazy } = require('require-lazy');

	module.exports = function(inAppUrl) {
		inAppUrl.register('/whats-new/', (params, { context }) => {
			ComponentOpener.open();
		}).name('/bitrix24/whats-new');

		inAppUrl.register('/bitrix24/profile', (params, { context }) => {
			void requireLazy('user-profile')
				.then(async ({ UserProfile }) => {
					await UserProfile?.open({
						openInComponent: true,
						analyticsSection: 'in_app_url_profile',
					});
				})
				.catch(console.error);
		}).name('/bitrix24/profile');

		inAppUrl.register('/support/', (params, { context }) => {
			const { botId } = context;

			if (botId && Number(botId) > 0)
			{
				Promise.all([
					requireLazy('im:messenger/api/dialog-opener'),
					requireLazy('tourist', false),
				]).then(([{ DialogOpener }, { Tourist }]) => {
					return DialogOpener
						.open({ dialogId: Number(botId) })
						.then(() => Tourist.remember('show_support', {}));
				}).catch(async (error) => {
					console.error('Error in support opener:', error);

					const { showErrorToast } = await requireLazy('toast', false);
					showErrorToast(
						{
							message: Loc.getMessage('MENU_BITRIX24_SUPPORT24_ERROR_TEXT'),
						},
						this.layout,
					);
				});
			}
			else
			{
				console.error('Empty or invalid botId', botId);
			}
		});

		inAppUrl.register('/change-portal/', () => {
			Application.exit();
		});
	};
});
