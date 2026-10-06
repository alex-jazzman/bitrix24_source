/**
 * @module background/notifications/demo-web
 */
jn.define('background/notifications/demo-web', (require, exports, module) => {
	const { BaseNotificationHandler } = require('background/notifications/base');
	const { AnalyticsEvent } = require('analytics');
	const { NOTIFICATION_EVENTS, SUBSCRIPTION_EVENTS } = require('navigator/more-tab/meta');

	/**
	 * @class DemoWebNotification
	 */
	class DemoWebNotification extends BaseNotificationHandler
	{
		getNotificationType()
		{
			return 'MOBILE_OPEN_DEMO_WEB';
		}

		handleNotificationClick(message)
		{
			const analytics = this.getAnalytics();
			if (analytics)
			{
				analytics.send();
			}
		}

		getAnalytics()
		{
			return new AnalyticsEvent()
				.setEvent('push_mobile_1-8d_web')
				.setCategory('1-8d')
				.setTool('mobile');
		}

		getNotificationEventName()
		{
			return NOTIFICATION_EVENTS.DEMO_WEB;
		}

		getSubscriptionEventName()
		{
			return SUBSCRIPTION_EVENTS.DEMO_WEB;
		}
	}

	module.exports = {
		DemoWebNotification,
	};
});

