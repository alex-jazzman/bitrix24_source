/**
 * @module navigator/more-tab/meta
 */
jn.define('navigator/more-tab/meta', (require, exports, module) => {
	const NOTIFICATION_EVENTS = {
		TASKS: 'PushNotifications::TasksTabsOpenFromMore',
		CRM: 'PushNotifications::CrmTabsOpenFromMore',
		CALENDAR: 'PushNotifications::CalendarEventsOpenFromMore',
		INVITE: 'PushNotifications::OpenInvite',
		RETURN: 'PushNotifications::OpenReturn',
		SET_NOTIFICATIONS: 'PushNotifications::OpenSetNotifications',
		DEMO_WEB: 'PushNotifications::OpenDemoWeb',
		PROMOTION: 'PushNotifications::OpenPromotion',
	};

	const SUBSCRIPTION_EVENTS = {
		TASKS: 'PushNotifications::SubscribeToTasksTabsOpenFromMore',
		CRM: 'PushNotifications::SubscribeToCrmTabsOpenFromMore',
		CALENDAR: 'PushNotifications::SubscribeToCalendarOpenFromMore',
		INVITE: 'PushNotifications::SubscribeToOpenInvite',
		RETURN: 'PushNotifications::SubscribeToOpenReturn',
		SET_NOTIFICATIONS: 'PushNotifications::SubscribeToOpenSetNotifications',
		DEMO_WEB: 'PushNotifications::SubscribeToOpenDemoWeb',
		PROMOTION: 'PushNotifications::SubscribeToOpenPromotion',
	};

	const NAVIGATION_EVENTS = {
		SCROLL_TO_MENU_ITEM: 'MoreMenu::ScrollToMenuItem',
	};

	module.exports = {
		NOTIFICATION_EVENTS,
		SUBSCRIPTION_EVENTS,
		NAVIGATION_EVENTS,
	};
});
