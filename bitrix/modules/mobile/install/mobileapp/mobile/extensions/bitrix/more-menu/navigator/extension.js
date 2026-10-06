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
	const { handleItemClick } = require('more-menu/utils');
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

		static #subscriptions = [
			{ event: NOTIFICATION_EVENTS.TASKS, push: SUBSCRIPTION_EVENTS.TASKS, handler: 'onTaskNotification' },
			{ event: NOTIFICATION_EVENTS.CRM, push: SUBSCRIPTION_EVENTS.CRM, handler: 'onCrmNotification' },
			{ event: NOTIFICATION_EVENTS.INVITE, push: SUBSCRIPTION_EVENTS.INVITE, handler: 'onInviteNotification' },
			{ event: NOTIFICATION_EVENTS.CALENDAR, push: SUBSCRIPTION_EVENTS.CALENDAR, handler: 'onCalenderNotification' },
			{ event: NAVIGATION_EVENTS.SCROLL_TO_MENU_ITEM, handler: 'onScrollToMenuItem' },
		];

		subscribeToEvents()
		{
			this.unsubscribeFromEvents();

			MenuNavigator.#subscriptions.forEach(({ event, push, handler }) => {
				BX.addCustomEvent(event, this[handler].bind(this));
				if (push)
				{
					this.onSubscribeToPushNotification(push);
				}
			});
		}

		unsubscribeFromEvents()
		{
			MenuNavigator.#subscriptions.forEach(({ event, handler }) => {
				BX.removeCustomEvent(event, this[handler].bind(this));
			});
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

		async onTaskNotification()
		{
			void this.#openItem('tasks');
		}

		async onCrmNotification()
		{
			void this.#openItem('crm');
		}

		async onCalenderNotification()
		{
			void this.#openItem('calendar');
		}

		async onInviteNotification(openInviteOnMount = true)
		{
			await this.#ensureActiveTab();

			// cold start: restrictions arrive later via update(), same reason as #waitForItemById
			const restrictions = await this.#waitForRestrictions();
			if (restrictions?.canInvite)
			{
				inAppUrl.open('/intranetmobile/users', {
					canInvite: restrictions.canInvite,
					canUseTelephony: restrictions.canUseTimeMan,
					openInviteOnMount,
				});
			}
		}

		#waitForRestrictions(timeout = 5000, interval = 100)
		{
			return new Promise((resolve) => {
				let elapsed = 0;

				const check = () => {
					if (this.restrictions)
					{
						resolve(this.restrictions);

						return;
					}

					elapsed += interval;
					if (elapsed >= timeout)
					{
						resolve(null);

						return;
					}

					setTimeout(check, interval);
				};

				check();
			});
		}

		async #openItem(itemKey)
		{
			await this.#ensureActiveTab();

			// При холодном старте menuList заполняется позже (через update()), а push-обработчик
			// уже сработал — без ожидания getItemById вернёт null и мы останемся на вкладке «Ещё».
			const item = await this.#waitForItemById(itemKey);
			if (item)
			{
				handleItemClick(item);
			}
			else
			{
				console.error(`${itemKey} menu item not found`);
			}
		}

		#waitForItemById(itemKey, timeout = 5000, interval = 100)
		{
			return new Promise((resolve) => {
				let elapsed = 0;

				const check = () => {
					const item = this.getItemById(itemKey);
					if (item)
					{
						resolve(item);

						return;
					}

					elapsed += interval;
					if (elapsed >= timeout)
					{
						resolve(null);

						return;
					}

					setTimeout(check, interval);
				};

				check();
			});
		}

		async #ensureActiveTab()
		{
			if (!this.isActiveTab())
			{
				await this.makeTabActive();
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
	}

	module.exports = {
		MenuNavigator,
	};
});
