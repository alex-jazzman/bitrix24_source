/**
 * @module background/notifications/set-notifications
 */
jn.define('background/notifications/set-notifications', (require, exports, module) => {
	const { BaseNotificationHandler } = require('background/notifications/base');
	const { AnalyticsEvent } = require('analytics');
	const { NOTIFICATION_EVENTS, SUBSCRIPTION_EVENTS } = require('navigator/more-tab/meta');

	/**
	 * @class SetNotificationsNotification
	 */
	class SetNotificationsNotification extends BaseNotificationHandler
	{
		getNotificationType()
		{
			return 'MOBILE_OPEN_SET_NOTIFICATIONS';
		}

		getNotificationEventName()
		{
			return NOTIFICATION_EVENTS.SET_NOTIFICATIONS;
		}

		getSubscriptionEventName()
		{
			return SUBSCRIPTION_EVENTS.SET_NOTIFICATIONS;
		}

		getAnalytics()
		{
			return new AnalyticsEvent()
				.setEvent('push_mobile_1-8d_set_notifications')
				.setCategory('1-8d')
				.setTool('mobile');
		}
	}

	module.exports = {
		SetNotificationsNotification,
	};
});

