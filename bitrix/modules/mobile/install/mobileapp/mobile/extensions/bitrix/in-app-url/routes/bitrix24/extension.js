/**
 * @module in-app-url/routes/bitrix24
 */
jn.define('in-app-url/routes/bitrix24', (require, exports, module) => {
	const { Loc } = require('loc');
	const { ComponentOpener } = require('whats-new/ui-manager/component-opener');
	const { requireLazy } = require('require-lazy');
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { showErrorToast } = require('toast');
	const { Tourist } = require('tourist');

	const GET_BOT_ID_ACTION = 'mobile.Support.getBotId';

	/**
	 * A link opened from outside the app brings no menu context, so the support bot is
	 * resolved on the spot when the context has none.
	 * @return {Promise<?number>}
	 */
	const resolveSupportBotId = async (context) => {
		const contextBotId = Number(context?.botId);
		if (contextBotId > 0)
		{
			return contextBotId;
		}

		// the answer is not cached: an absent bot is a portal setting that may change at any
		// moment, and a cached "no bot" would keep refusing the link long after support is on
		const response = await (new RunActionExecutor(GET_BOT_ID_ACTION))
			.setSkipDuplicateRequests()
			.call(false);

		// call() resolves even on an error response (does not reject), so check the answer explicitly.
		const { botId, isSupportActive } = response?.data ?? {};
		if (isSupportActive === false)
		{
			// the same switch the profile menu applies: support turned off for mobile opens no chat
			return null;
		}

		return Number(botId) > 0 ? Number(botId) : null;
	};

	const openSupportDialog = async (botId, context) => {
		const { DialogOpener } = await requireLazy('im:messenger/api/dialog-opener');

		await DialogOpener.open({
			dialogId: botId,
			parentWidget: context?.parentWidget,
		});
	};

	// bookkeeping only: its failure must not be reported as a failure to open the chat
	const rememberSupportShown = () => {
		try
		{
			Tourist.remember('show_support', {});
		}
		catch (error)
		{
			console.error('in-app-url: unable to remember the support event', error);
		}
	};

	const notifySupportFailure = (context, messageCode) => {
		showErrorToast({ message: Loc.getMessage(messageCode) }, context?.parentWidget);
	};

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

		inAppUrl.register('/support/', async (params, { context }) => {
			try
			{
				const botId = await resolveSupportBotId(context);
				if (!botId)
				{
					notifySupportFailure(context, 'IN_APP_URL_SUPPORT_UNAVAILABLE');

					return;
				}

				await openSupportDialog(botId, context);
				rememberSupportShown();
			}
			catch (error)
			{
				console.error('in-app-url: unable to open support chat', error);
				notifySupportFailure(context, 'MENU_BITRIX24_SUPPORT24_ERROR_TEXT');
			}
		}).name('bitrix24:support');

		inAppUrl.register('/change-portal/', () => {
			Application.exit();
		});
	};
});
