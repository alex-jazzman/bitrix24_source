import { Loc } from 'main.core';
import { Menu, MenuItemDesign, type MenuItemOptions } from 'ui.system.menu';
import { Messenger } from 'im.public';
import { SettingsSection } from 'im.v2.const';
import { Core } from 'im.v2.application.core';
import { NotificationReadService } from './notification-read-service';

export class NotificationHeaderMenu
{
	menu: Menu;
	store: Object;

	constructor()
	{
		this.notificationReadService = new NotificationReadService();
		this.store = Core.getStore();
	}

	openMenu(isReadAllAvailable: boolean, bindElement: HTMLElement): void
	{
		if (this.menu)
		{
			this.menu.destroy();
			this.menu = null;
		}

		this.menu = new Menu({
			id: 'im-notifications-header-menu',
			items: this.getHeaderMenuItems(isReadAllAvailable),
			// Closing is added per item by withMenuClose() instead.
			closeOnItemClick: false,
			autoHide: true,
		});

		this.menu.show(bindElement);
	}

	getHeaderMenuItems(isReadAllAvailable: boolean): MenuItemOptions[]
	{
		return [
			this.getOptionsItem(),
			this.getReadAllItem(isReadAllAvailable),
		].map((item: MenuItemOptions) => this.withMenuClose(item));
	}

	withMenuClose(item: MenuItemOptions): MenuItemOptions
	{
		// An item without an action leaves the menu open: that is what unavailable looks like.
		if (!item.onClick)
		{
			return item;
		}

		return {
			...item,
			onClick: () => {
				item.onClick();
				this.menu.close();
			},
		};
	}

	getReadAllItem(isReadAllAvailable: boolean): MenuItemOptions
	{
		const item = {
			title: Loc.getMessage('IM_NOTIFICATIONS_READ_ALL_BUTTON'),
			design: isReadAllAvailable ? MenuItemDesign.Default : MenuItemDesign.Disabled,
		};

		if (!isReadAllAvailable)
		{
			return item;
		}

		return {
			...item,
			onClick: () => this.notificationReadService.readAll(),
		};
	}

	getOptionsItem(): MenuItemOptions
	{
		return {
			title: Loc.getMessage('IM_NOTIFICATIONS_OPTIONS_BUTTON'),
			onClick: () => {
				void Messenger.openSettings({ onlyPanel: SettingsSection.notification });
			},
		};
	}

	destroy(): void
	{
		if (this.menu)
		{
			this.menu.destroy();
			this.menu = null;
		}

		if (this.notificationReadService)
		{
			this.notificationReadService.destroy();
		}
	}
}
