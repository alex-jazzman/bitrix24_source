/**
 * @module background/notifications/open-return
 */
jn.define('background/notifications/open-return', (require, exports, module) => {
	const { BaseNotificationHandler } = require('background/notifications/base');
	const { AnalyticsEvent } = require('analytics');
	const { NOTIFICATION_EVENTS, SUBSCRIPTION_EVENTS } = require('navigator/more-tab/meta');

	/**
	 * @class OpenReturnNotification
	 */
	class OpenReturnNotification extends BaseNotificationHandler
	{
		getNotificationType()
		{
			return 'MOBILE_OPEN_RETURN';
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
				.setEvent('push_mobile_1-8d_return')
				.setCategory('1-8d')
				.setTool('mobile');
		}

		getNotificationEventName()
		{
			return NOTIFICATION_EVENTS.RETURN;
		}

		getSubscriptionEventName()
		{
			return SUBSCRIPTION_EVENTS.RETURN;
		}
	}

	module.exports = {
		OpenReturnNotification,
	};
});
