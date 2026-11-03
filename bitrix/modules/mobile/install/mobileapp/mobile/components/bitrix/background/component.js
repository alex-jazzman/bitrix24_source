(() => {
	const require = (ext) => jn.require(ext);
	const { isModuleInstalled } = require('module');

	const { AvaMenu } = require('ava-menu');
	const { registerPushNotificationHandlers } = require('push/notifications-register');
	void registerPushNotificationHandlers();

	AvaMenu.init();

	try
	{
		const { IntranetBackground } = require('intranet/intranet-background');
		void IntranetBackground?.init();
	}
	catch (e)
	{
		console.warn(e);
	}

	if (isModuleInstalled('timeman'))
	{
		try
		{
			const { Background } = require('timeman/background');
			void Background?.init();
		}
		catch (e)
		{
			console.error(e);
		}
	}

	const { registerDeeplink } = require('in-app-url/deeplink');
	registerDeeplink();

	// the address with the intent code is spent by the native authentication and does not reach the
	// routes, so the code of the section is taken from the native slot of the last notification
	try
	{
		const { applyIntentFromBridge } = require('intent/entry');
		applyIntentFromBridge();
	}
	catch (e)
	{
		console.error(e);
	}

	const { AppRatingBackgroundClient } = require('app-rating-background-client');
	AppRatingBackgroundClient.subscribeToUserEvents();
	AppRatingBackgroundClient.subscribeToAppPausedEvent();

	const { TimemanAnalytics } = require('timeman/analytics');
	TimemanAnalytics.subscribeEvents();

	const { subscribeToPostEvents } = require('layout/ui/gratitude-list/subscriptions');
	subscribeToPostEvents();

	const { initOnboarding } = require('onboarding/background');
	void initOnboarding();

	const { PullListener } = require('pull-listener');
	const { MartaAIPullEventClient, PullEventId } = require('pull-listener/aiassistant-client');

	new PullListener({
		eventClients: [
			new MartaAIPullEventClient([
				PullEventId.AI_OPEN_CHAT_MOBILE,
				PullEventId.AI_SHOW_FEEDBACK_FORM_MOBILE,
			]),
		],
	}).subscribeAll();

	BX.PULL.subscribe({
		moduleId: 'security',
		command: '2FA',
		type: BX.PullClient.SubscriptionType.Server,
		callback: (params, extra, commandName) => {
			params.type = commandName;
			if (typeof Application?.show2FAIfNeeded === 'function')
			{
				Application.show2FAIfNeeded(params);
			}
		},
	});
})();
