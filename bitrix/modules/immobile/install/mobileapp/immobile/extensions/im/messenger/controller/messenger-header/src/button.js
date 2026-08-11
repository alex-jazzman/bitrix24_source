/**
 * @module im/messenger/controller/messenger-header/src/button
 *
 * @description Warning! Button callbacks should only contain API calls or event emissions,
 * do not write complex logic in them and do not store state.
 */
jn.define('im/messenger/controller/messenger-header/src/button', (require, exports, module) => {
	const { Type } = require('type');
	const { Icon } = require('assets/icons');

	const { Notification } = require('im/messenger/lib/ui/notification');
	const { RecentFilterId, RecentMenuSection } = require('im/messenger/const');
	const { Feature } = require('im/messenger/lib/feature');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { showNotificationList } = require('im/messenger/api/notifications-opener');
	const { RecentActionsMenu, NestedRecentActionsMenu } = require('im/messenger/lib/popup-menu/recent-actions');
	const { Button } = require('im/messenger/lib/widget/header-button');
	const {
		onClick: onVibecodeClick,
		isIndicatorVisible: isVibecodeIndicatorVisible,
	} = require('im/messenger/lib/integration/mobile/vibecode');

	const HeaderButtonId = Object.freeze({
		search: 'search',
		notification: 'notification',
		more: 'more',
		vibecode: 'vibecode',
		nestedSearch: 'nested-search',
		nestedFilter: 'nested-filter',
		nestedMore: 'nested-more',
		filterAll: RecentFilterId.all,
		filterUnread: RecentFilterId.unread,
		readAll: 'read-all',
		developerConsole: 'developer-console',
		developerMenu: 'developer-menu',
		developerReload: 'developer-reload',
	});

	const ButtonBadgeCode = Object.freeze({
		notifications: 'notifications',
	});

	const searchButton = Button.create({
		id: HeaderButtonId.search,
		iconName: Icon.SEARCH.getIconName(),
		callback: async () => {
			serviceLocator.get('recent-manager').getActiveRecent().openSearch();
		},
	});

	const notificationButton = Button.create({
		id: HeaderButtonId.notification,
		testId: 'notification_badge',
		iconName: Icon.NOTIFICATION.getIconName(),
		badgeCode: ButtonBadgeCode.notifications,
		callback: async () => showNotificationList(),
	});

	const developerItems = [
		{
			id: HeaderButtonId.developerConsole,
			title: 'Developer console',
			iconName: Icon.EDIT.getIconName(),
			sectionCode: RecentMenuSection.developer,
			shouldShow: async () => Feature.isDevModeEnabled,
			callback: async () => {
				const { Console } = await requireLazy('im:messenger/lib/dev/tools');
				Console.open();
			},
		},
		{
			id: HeaderButtonId.developerMenu,
			title: 'Developer menu',
			iconName: Icon.MORE.getIconName(),
			sectionCode: RecentMenuSection.developer,
			shouldShow: async () => Feature.isDevelopmentEnvironment,
			callback: async () => {
				void window.messengerDebug.showDeveloperMenu();
			},
		},
		{
			id: HeaderButtonId.developerReload,
			title: 'reload();',
			iconName: Icon.REFRESH.getIconName(),
			sectionCode: RecentMenuSection.developer,
			shouldShow: async () => Feature.isDevelopmentEnvironment,
			callback: async () => {
				window.reload();
			},
		},
	];

	const nestedSearchButton = Button.create({
		id: HeaderButtonId.nestedSearch,
		iconName: Icon.SEARCH.getIconName(),
		shouldShow: () => true,
		callback: () => {
			serviceLocator.get('recent-manager').getActiveRecent().openSearch();
		},
	});

	const nestedFilterButton = Button.create({
		id: HeaderButtonId.nestedFilter,
		iconName: Icon.FILTER_FUNNEL.getIconName(),
		isAccent: () => serviceLocator.get('recent-manager').getActiveNestedRecent()?.hasSelectedFilter() ?? false,
		shouldShow: () => NestedRecentActionsMenu.hasVisibleItems(),
		callback: async () => {
			const recent = serviceLocator.get('recent-manager').getActiveNestedRecent();

			if (recent?.hasSelectedFilter())
			{
				await recent.resetFilter();

				return;
			}

			const menu = new NestedRecentActionsMenu({
				sections: [RecentMenuSection.filter, RecentMenuSection.general],
				cacheId: 'im-messenger-nested-recent-actions-menu:filter',
			});

			await menu.show();
		},
	});

	const nestedMoreButton = Button.create({
		id: HeaderButtonId.nestedMore,
		iconName: Icon.MORE.getIconName(),
		shouldShow: async () => {
			if (NestedRecentActionsMenu.hasVisibleItems())
			{
				return true;
			}

			const visibility = await Promise.all(
				developerItems.map((item) => item.shouldShow?.() ?? false),
			);

			return visibility.includes(true);
		},
		callback: async () => {
			const menu = new NestedRecentActionsMenu({
				sections: [RecentMenuSection.project],
				additionalItems: developerItems,
				additionalSections: [{ id: RecentMenuSection.developer }],
				cacheId: 'im-messenger-nested-recent-actions-menu:more',
			});

			await menu.show();
		},
	});

	const moreButton = Button.create({
		id: HeaderButtonId.more,
		iconName: Icon.FILTER_FUNNEL.getIconName(),
		isAccent: () => serviceLocator.get('recent-manager').getActiveRecent()?.hasSelectedFilter() ?? false,
		shouldShow: async () => {
			const recent = serviceLocator.get('recent-manager').getActiveRecent();
			const tabId = recent?.id;
			if (!tabId)
			{
				return false;
			}

			if (RecentActionsMenu.hasVisibleItems(tabId))
			{
				return true;
			}

			const visibility = await Promise.all(
				developerItems.map((item) => item.shouldShow?.() ?? false),
			);

			return visibility.includes(true);
		},
		callback: async () => {
			const recentManager = serviceLocator.get('recent-manager');
			const tabId = recentManager.getActiveRecentId();
			const recent = recentManager.getActiveRecent();

			if (recent?.hasSelectedFilter())
			{
				await recent.resetFilter();

				return;
			}

			const menu = new RecentActionsMenu(tabId, {
				additionalItems: developerItems,
				additionalSections: [{ id: RecentMenuSection.developer }],
				cacheId: 'im-messenger-recent-actions-menu:more-button',
			});

			await menu.show();
		},
	});

	const vibecodeButton = Button.create({
		id: HeaderButtonId.vibecode,
		iconName: Icon.VIBECODE_CATALOG.getIconName(),
		isDot: () => Type.isFunction(isVibecodeIndicatorVisible) ? isVibecodeIndicatorVisible() : false,
		isAccent: () => true,
		shouldShow: async () => Feature.isVibecodeButtonAvailable,
		callback: async () => {
			if (Type.isFunction(onVibecodeClick))
			{
				await onVibecodeClick();
			}
		},
	});

	module.exports = {
		searchButton,
		notificationButton,
		moreButton,
		vibecodeButton,
		nestedSearchButton,
		nestedFilterButton,
		nestedMoreButton,
	};
});
