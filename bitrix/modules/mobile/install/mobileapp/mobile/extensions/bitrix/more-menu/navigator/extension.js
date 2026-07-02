/**
 * @module more-menu/navigator
 */
jn.define('more-menu/navigator', (require, exports, module) => {
	const { BaseNavigator } = require('navigator/base');
	const {
		NOTIFICATION_EVENTS,
		SUBSCRIPTION_EVENTS,
		NAVIGATION_EVENTS,
	} = require('navigator/more-tab/meta');
	const {
		handleItemClick,
	} = require('more-menu/utils');
	const { Type } = require('type');
	const { inAppUrl } = require('in-app-url');

	const { RefRegistry } = require('more-menu/ref-registry');

	const MORE_MENU_REFRESH_VIEW_REF_KEY = 'more_menu_refresh_view';

	/**
	 * @class MenuNavigator
	 */
	class MenuNavigator extends BaseNavigator
	{
		/**
		 *
		 * @param props
		 * @param {array} props.menuList
		 */
		constructor(props)
		{
			super(props);

			this.menuList = Type.isArrayFilled(props.menuList) ? props.menuList : [];
		}

		update(menuList, restrictions)
		{
			if (Type.isArrayFilled(menuList))
			{
				this.menuList = menuList;
			}
			else
			{
				this.menuList = [];
			}

			this.restrictions = restrictions;
		}

		subscribeToEvents()
		{
			this.unsubscribeFromEvents();

			this.subscribeToTaskNotification();
			this.subscribeToCrmNotification();
			this.subscribeToInviteNotification();
			this.subscribeToScrollToMenuItem();
		}

		unsubscribeFromEvents()
		{
			BX.removeCustomEvent(NOTIFICATION_EVENTS.TASKS, this.onTaskNotification.bind(this));
			BX.removeCustomEvent(NOTIFICATION_EVENTS.CRM, this.onCrmNotification.bind(this));
			BX.removeCustomEvent(NOTIFICATION_EVENTS.INVITE, this.onInviteNotification.bind(this));
			BX.removeCustomEvent(NAVIGATION_EVENTS.SCROLL_TO_MENU_ITEM, this.onScrollToMenuItem.bind(this));
		}

		subscribeToScrollToMenuItem()
		{
			BX.addCustomEvent(NAVIGATION_EVENTS.SCROLL_TO_MENU_ITEM, this.onScrollToMenuItem.bind(this));
		}

		async onScrollToMenuItem(params = {})
		{
			const menuItemId = params?.menuItemId;
			if (!Type.isStringFilled(menuItemId))
			{
				return;
			}

			if (!this.getItemById(menuItemId))
			{
				console.error(`Menu item is not found in menu: ${menuItemId}`);

				return;
			}

			if (!this.isActiveTab())
			{
				await this.makeTabActive();
			}

			await this.scrollToMenuItem(menuItemId);

			if (params?.highlightItem)
			{
				this.highlightMenuItem(menuItemId);
			}
		}

		async scrollToMenuItem(menuItemId)
		{
			const refreshViewRef = await RefRegistry.waitFor(MORE_MENU_REFRESH_VIEW_REF_KEY, 7000);
			if (!refreshViewRef?.scrollTo)
			{
				console.error('RefreshView ref is not found', refreshViewRef);

				return;
			}

			const itemRef = await RefRegistry.waitFor(menuItemId, 2000);
			const itemPosition = await itemRef.getAbsolutePositionAsync();
			if (!itemPosition)
			{
				console.error(`Menu item ref position is not available: ${menuItemId}`);

				return;
			}

			await this.pauseBeforeScroll();

			const itemHeight = itemPosition.height ?? 0;
			const scrollY = itemPosition.y + itemHeight / 2 - device.screen.height / 2;

			refreshViewRef.scrollTo({ y: Math.max(0, scrollY), animated: true });
		}

		pauseBeforeScroll(timeout = 1000)
		{
			return new Promise((resolve) => {
				setTimeout(resolve, timeout);
			});
		}

		highlightMenuItem(menuItemId)
		{
			const itemComponent = RefRegistry.getRef(`${menuItemId}_component`);
			if (!itemComponent)
			{
				return;
			}

			itemComponent.showHighlight()
				.then(() => {
					setTimeout(() => {
						itemComponent?.hideHighlight();
					}, 5000);
				})
				.catch((error) => {
					console.error(error);
				});
		}

		subscribeToTaskNotification(MoreTabMenu)
		{
			BX.addCustomEvent(NOTIFICATION_EVENTS.TASKS, this.onTaskNotification.bind(this, MoreTabMenu));
			this.onSubscribeToPushNotification(SUBSCRIPTION_EVENTS.TASKS);
		}

		async onTaskNotification()
		{
			if (!this.isActiveTab())
			{
				await this.makeTabActive();
			}
			const taskItem = this.getItemById('tasks');
			if (taskItem)
			{
				handleItemClick(taskItem);
			}
			else
			{
				console.error('Task item is not found in menu');
			}
		}

		subscribeToCrmNotification()
		{
			BX.addCustomEvent(NOTIFICATION_EVENTS.CRM, this.onCrmNotification.bind(this));
			this.onSubscribeToPushNotification(SUBSCRIPTION_EVENTS.CRM);
		}

		async onCrmNotification()
		{
			if (!this.isActiveTab())
			{
				await this.makeTabActive();
			}

			const crmMenuItem = this.getItemById('crm');
			if (crmMenuItem)
			{
				handleItemClick(crmMenuItem);
			}
			else
			{
				console.error('CRM menu item not found');
			}
		}

		getItemById(id)
		{
			for (const section of this.menuList)
			{
				const item = section?.items.find((sectionItem) => sectionItem?.id === id);
				if (item)
				{
					return item;
				}
			}

			return null;
		}

		subscribeToInviteNotification()
		{
			BX.addCustomEvent(NOTIFICATION_EVENTS.INVITE, this.onInviteNotification.bind(this));

			this.onSubscribeToPushNotification(SUBSCRIPTION_EVENTS.INVITE);
		}

		async onInviteNotification(openInviteOnMount = true)
		{
			if (!this.isActiveTab())
			{
				await this.makeTabActive();
			}

			if (this.restrictions?.canInvite)
			{
				inAppUrl.open('/intranetmobile/users', {
					canInvite: this.restrictions?.canInvite,
					canUseTelephony: this.restrictions?.canUseTimeMan,
					openInviteOnMount,
				});
			}
		}
	}

	module.exports = {
		MenuNavigator,
	};
});
