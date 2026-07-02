/**
 * @module navigator/more-tab/meta
 */
jn.define('navigator/more-tab/meta', (require, exports, module) => {
	const NOTIFICATION_EVENTS = {
		TASKS: 'PushNotifications::TasksTabsOpenFromMore',
		CRM: 'PushNotifications::CrmTabsOpenFromMore',
		INVITE: 'PushNotifications::OpenInvite',
	};

	const SUBSCRIPTION_EVENTS = {
		TASKS: 'PushNotifications::SubscribeToTasksTabsOpenFromMore',
		CRM: 'PushNotifications::SubscribeToCrmTabsOpenFromMore',
		INVITE: 'PushNotifications::SubscribeToOpenInvite',
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
