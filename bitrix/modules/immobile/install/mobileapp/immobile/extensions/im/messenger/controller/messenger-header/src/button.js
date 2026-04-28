/**
 * @module im/messenger/controller/messenger-header/button
 *
 * @description Warning! Button callbacks should only contain API calls or event emissions,
 * do not write complex logic in them and do not store state.
 */
jn.define('im/messenger/controller/messenger-header/button', (require, exports, module) => {
	const { Icon } = require('assets/icons');
	const { Type } = require('type');

	const { Loc } = require('im/messenger/loc');
	const { NavigationTabId, RecentFilterId } = require('im/messenger/const');
	const { Feature } = require('im/messenger/lib/feature');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { showNotificationList } = require('im/messenger/api/notifications-opener');
	const { RecentManager } = require('im/messenger/controller/recent/manager');
	const { readAllChatsByActiveRecentTab } = require('im/messenger/lib/read-all-chats');
	const {
		Button,
		PopupCreateButton,
		PopupButton,
	} = require('im/messenger/lib/widget/header-button');

	const HeaderButtonSection = Object.freeze({
		general: 'general',
		filter: 'filter',
		developer: 'developer',
	});

	const HeaderButtonId = Object.freeze({
		search: 'search',
		notification: 'notification',
		more: 'more',
		filterAll: RecentFilterId.all,
		filterUnread: RecentFilterId.unread,
		readAll: 'read-all',
		developerConsole: 'developer-console',
		developerMenu: 'developer-menu',
		developerReload: 'developer-reload',
	});

	const ButtonType = Object.freeze({
		search: 'search',
		notification: 'notification',
		more: 'more',
		filter: 'filter_funnel',
	});

	const ButtonBadgeCode = Object.freeze({
		notifications: 'notifications',
	});

	const searchButton = Button.create({
		id: HeaderButtonId.search,
		type: ButtonType.search,
		callback: async () => {
			serviceLocator.get('recent-manager').getActiveRecent().openSearch();
		},
	});

	const notificationButton = Button.create({
		id: HeaderButtonId.notification,
		testId: 'notification_badge',
		type: ButtonType.notification,
		badgeCode: ButtonBadgeCode.notifications,
		callback: async () => showNotificationList(),
	});

	const readAllPopupButton = PopupButton.create({
		id: HeaderButtonId.readAll,
		getTitle: () => {
			const currentRecentId = serviceLocator.get('recent-manager').getActiveRecentId();
			if (currentRecentId === NavigationTabId.task)
			{
				return Loc.getMessage('IMMOBILE_MESSENGER_HEADER_BUTTON_READ_ALL_TASKS');
			}

			return Loc.getMessage('IMMOBILE_MESSENGER_HEADER_BUTTON_READ_ALL');
		},
		iconName: Icon.DOUBLE_CHECK.getIconName(),
		shouldShow: async () => RecentManager.getInstance().getActiveRecentId() !== NavigationTabId.openlines,
		callback: async () => {
			void readAllChatsByActiveRecentTab();
		},
	});

	const filterAllPopupButton = PopupButton.create({
		id: HeaderButtonId.filterAll,
		title: Loc.getMessage('IMMOBILE_MESSENGER_HEADER_BUTTON_FILTER_ALL'),
		sectionCode: HeaderButtonSection.filter,
		checked: () => {
			const activeRecent = serviceLocator.get('recent-manager').getActiveRecent();

			return activeRecent?.getCurrentFilterId() === HeaderButtonId.filterAll;
		},
		callback: () => {
			void serviceLocator.get('recent-manager').getActiveRecent().applyFilter(HeaderButtonId.filterAll);
		},
		shouldShow: () => (
			Feature.isRecentFilterAvailable && serviceLocator.get('recent-manager').getActiveRecent().isSupportedFilter()
		),
	});

	const filterUnreadPopupButton = PopupButton.create({
		id: HeaderButtonId.filterUnread,
		title: Loc.getMessage('IMMOBILE_MESSENGER_HEADER_BUTTON_FILTER_UNREAD'),
		sectionCode: HeaderButtonSection.filter,
		checked: () => {
			const activeRecent = serviceLocator.get('recent-manager').getActiveRecent();

			return activeRecent?.getCurrentFilterId() === HeaderButtonId.filterUnread;
		},
		callback: () => {
			void serviceLocator.get('recent-manager').getActiveRecent().applyFilter(HeaderButtonId.filterUnread);
		},
		shouldShow: () => (
			Feature.isRecentFilterAvailable && serviceLocator.get('recent-manager').getActiveRecent().isSupportedFilter()
		),
	});

	const developerConsolePopupButton = PopupButton.create({
		id: HeaderButtonId.developerConsole,
		title: 'Developer console',
		iconName: Icon.EDIT.getIconName(),
		sectionCode: HeaderButtonSection.developer,
		shouldShow: async () => Feature.isDevModeEnabled,
		callback: async () => {
			const { Console } = await requireLazy('im:messenger/lib/dev/tools');
			Console.open();
		},
	});

	const developerMenuPopupButton = PopupButton.create({
		id: HeaderButtonId.developerMenu,
		title: 'Developer menu',
		iconName: Icon.MORE.getIconName(),
		sectionCode: HeaderButtonSection.developer,
		shouldShow: async () => Feature.isDevelopmentEnvironment,
		callback: async () => {
			void window.messengerDebug.showDeveloperMenu();
		},
	});

	const developerReloadPopupButton = PopupButton.create({
		id: HeaderButtonId.developerReload,
		title: 'reload();',
		iconName: Icon.REFRESH.getIconName(),
		sectionCode: HeaderButtonSection.developer,
		shouldShow: async () => Feature.isDevelopmentEnvironment,
		callback: async () => {
			window.reload();
		},
	});

	const moreButton = PopupCreateButton.create({
		id: HeaderButtonId.more,
		type: ButtonType.filter,
		isAccent: () => serviceLocator.get('recent-manager').getActiveRecent().hasSelectedFilter(),
		getSections() {
			const isSupportedFilter = serviceLocator.get('recent-manager').getActiveRecent().isSupportedFilter();
			const isShowFilterSection = Feature.isRecentFilterAvailable && isSupportedFilter;
			const isShowDeveloperSection = Feature.isDevModeEnabled || Feature.isDevelopmentEnvironment;

			return [
				isShowFilterSection && { id: HeaderButtonSection.filter },
				{ id: HeaderButtonSection.general },
				isShowDeveloperSection && { id: HeaderButtonSection.developer },
			].filter((item) => Type.isPlainObject(item));
		},
		buttons: [
			filterAllPopupButton,
			filterUnreadPopupButton,
			readAllPopupButton,
			developerConsolePopupButton,
			developerMenuPopupButton,
			developerReloadPopupButton,
		],
	});

	module.exports = {
		searchButton,
		notificationButton,
		moreButton,
		readAllPopupButton,
		filterAllPopupButton,
		filterUnreadPopupButton,
		developerConsolePopupButton,
		developerMenuPopupButton,
		developerReloadPopupButton,
	};
});
