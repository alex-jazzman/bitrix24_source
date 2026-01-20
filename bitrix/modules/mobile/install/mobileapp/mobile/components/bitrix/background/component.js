(() => {
	const require = (ext) => jn.require(ext);
	const { AvaMenu } = require('ava-menu');
	AvaMenu.init();

	try
	{
		const { IntranetBackground } = require('intranet/background');
		IntranetBackground?.init();
	}
	catch (e)
	{
		console.warn(e);
	}

	const { OpenDesktopNotification } = require('background/notifications/open-desktop');
	OpenDesktopNotification.bindOpenDesktopEvent();

	const { OpenHelpdeskNotification } = require('background/notifications/open-helpdesk');
	OpenHelpdeskNotification.bindOpenHelpdeskEvent();

	const { OpenPromotionNotification } = require('background/notifications/promotion');
	OpenPromotionNotification.bindPromotionEvent();

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
			params["type"] = commandName;
			if (typeof Application["show2FAIfNeeded"] === 'function')
			{
				Application.show2FAIfNeeded(params)
			}
		}
	});
})();
