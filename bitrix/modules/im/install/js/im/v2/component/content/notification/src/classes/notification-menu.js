import { Loc, Event } from 'main.core';
import { Menu, type MenuItemOptions } from 'ui.system.menu';
import { SettingsService } from 'im.v2.provider.service.settings';
import { Settings, type NotificationSettingsItem, NotificationSettingsType } from 'im.v2.const';
import { Notifier } from 'im.v2.lib.notifier';
import { Analytics } from 'im.v2.lib.analytics';

export class NotificationMenu
{
	menu: Menu;
	notificationItem: ?Object;
	store: Object;

	static events = {
		markAsUnreadClick: 'markAsUnreadClick',
	};

	static lastMenu: ?Menu = null;
	static lastMenuId: ?(string | number) = null;

	static closeMenuOnScroll(): void
	{
		try
		{
			NotificationMenu.lastMenu?.close();
		}
		catch (e)
		{
			console.error(e);
		}
		finally
		{
			NotificationMenu.lastMenu = null;
			NotificationMenu.lastMenuId = null;
		}
	}

	constructor({ store })
	{
		this.store = store;
	}

	openMenu(notificationItem, bindElement): void
	{
		if (
			NotificationMenu.lastMenu
			&& NotificationMenu.lastMenuId === notificationItem.id
			&& NotificationMenu.lastMenu.getPopup()?.isShown()
		)
		{
			NotificationMenu.lastMenu.close();
			NotificationMenu.lastMenu = null;
			NotificationMenu.lastMenuId = null;

			return;
		}

		if (this.menu)
		{
			this.menu.destroy();
			this.menu = null;
		}

		this.notificationItem = notificationItem;

		const items = this.#getMenuItems();
		if (items.length === 0)
		{
			return;
		}

		this.menu = new Menu({
			id: `im-notification-menu-${this.notificationItem.id}`,
			items,
			events: {
				onClose: () => {
					if (NotificationMenu.lastMenu === this.menu)
					{
						this.#onCloseMenu();
					}
				},
				onDestroy: () => {
					if (NotificationMenu.lastMenu === this.menu)
					{
						this.#onCloseMenu();
					}
				},
			},
		});

		this.menu.show(bindElement);
		NotificationMenu.lastMenu = this.menu;
		NotificationMenu.lastMenuId = this.notificationItem.id;
	}

	#onCloseMenu(): void
	{
		NotificationMenu.lastMenu = null;
		NotificationMenu.lastMenuId = null;
	}

	async toggleSubscription(): void
	{
		const currentSettings = this.#getCurrentItemSettings();
		if (this.#areSubscribedTypesExist())
		{
			const typesToRestore = this.#getLastSubscribedTypes();

			const settingsToUnsubscribe = {
				...this.#getParsedSettingName(),
				lastSubscribedTypes: this.#getLastSubscribedTypes(),
				shouldSubscribe: false,
			};
			void (new SettingsService()).toggleSubscription(settingsToUnsubscribe);

			Notifier.notification.onUnsubscribeComplete(currentSettings.label, (event, balloon) => {
				const settingsToResubscribe = {
					...this.#getParsedSettingName(),
					lastSubscribedTypes: typesToRestore,
					shouldSubscribe: true,
				};
				void (new SettingsService()).toggleSubscription(settingsToResubscribe);
				balloon.close();
			});

			Analytics.getInstance().notification.onUnsubscribeFromNotification({
				moduleId: settingsToUnsubscribe.notifyModule,
				optionName: settingsToUnsubscribe.notifyEvent,
			});
		}
		else
		{
			const settingsToSubscribe = {
				...this.#getParsedSettingName(),
				lastSubscribedTypes: this.#getLastSubscribedTypes(),
				shouldSubscribe: true,
			};
			void (new SettingsService()).toggleSubscription(settingsToSubscribe);

			Notifier.notification.onSubscribeComplete(currentSettings.label);
		}
	}

	#getMenuItems(): MenuItemOptions[]
	{
		return [
			this.#getUnSubscribeItem(),
			this.#getMarkAsUnreadItem(),
		].filter(Boolean);
	}

	#getMarkAsUnreadItem(): ?MenuItemOptions
	{
		return {
			title: this.notificationItem.read
				? Loc.getMessage('IM_NOTIFICATIONS_ITEM_MENU_MARK_UNREAD')
				: Loc.getMessage('IM_NOTIFICATIONS_ITEM_MENU_MARK_READ'),
			onClick: () => {
				Event.EventEmitter.emit(NotificationMenu.events.markAsUnreadClick, this.notificationItem);
			},
		};
	}

	#getUnSubscribeItem(): ?MenuItemOptions
	{
		if (!this.#shouldShowItem())
		{
			return null;
		}

		return {
			title: this.#areSubscribedTypesExist()
				? Loc.getMessage('IM_NOTIFICATIONS_ITEM_MENU_UNSUBSCRIBE')
				: Loc.getMessage('IM_NOTIFICATIONS_ITEM_MENU_SUBSCRIBE'),
			onClick: () => {
				this.toggleSubscription();
			},
		};
	}

	#getCurrentItemSettings(): ?NotificationSettingsItem
	{
		const notificationsSettings = this.store.getters['application/settings/get'](Settings.notifications);
		const { notifyModule, notifyEvent } = this.#getParsedSettingName();

		return notificationsSettings[notifyModule]?.items[notifyEvent];
	}

	#getParsedSettingName(): { notifyModule: string; notifyEvent: string; }
	{
		const { settingName } = this.notificationItem;
		const [notifyModule, notifyEvent] = settingName.split('|');

		return {
			notifyModule,
			notifyEvent,
		};
	}

	#isAtLeastWebEnabled(): boolean
	{
		return !this.#getCurrentItemSettings().disabled.includes(NotificationSettingsType.web);
	}

	#hasNotificationButtons(): boolean
	{
		return this.notificationItem.notifyButtons && this.notificationItem.notifyButtons.length > 0;
	}

	#getSubscribedTypes(): Array<string>
	{
		const settings = this.#getCurrentItemSettings();

		return this.#getNotificationSettingsTypeValues().filter((type) => {
			return !settings.disabled.includes(type) && settings[type] === true;
		});
	}

	#areSubscribedTypesExist(): boolean
	{
		return this.#getSubscribedTypes().length > 0;
	}

	#getNotificationSettingsTypeValues(): Array<string>
	{
		return Object.values(NotificationSettingsType);
	}

	#shouldShowItem(): boolean
	{
		return this.#getCurrentItemSettings() && this.#isAtLeastWebEnabled() && !this.#hasNotificationButtons();
	}

	#getLastSubscribedTypes(): Array<string>
	{
		if (this.#areSubscribedTypesExist())
		{
			return this.#getSubscribedTypes();
		}

		if (this.#isAtLeastWebEnabled())
		{
			return [NotificationSettingsType.web];
		}

		return [];
	}

	isEmpty(notificationItem): boolean
	{
		const prevItem = this.notificationItem;
		this.notificationItem = notificationItem;
		const items = this.#getMenuItems();
		this.notificationItem = prevItem;

		return items.length === 0;
	}
}