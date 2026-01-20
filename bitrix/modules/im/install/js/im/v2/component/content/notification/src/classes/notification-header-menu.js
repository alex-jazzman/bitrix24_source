import { Loc } from 'main.core';
import { Menu, MenuItemDesign, type MenuItemOptions } from 'ui.system.menu';
import { NotificationReadService } from './notification-read-service';

export class NotificationHeaderMenu
{
	menu: Menu;

	constructor()
	{
		this.notificationReadService = new NotificationReadService();
	}

	openMenu(isReadAllAvailable, bindElement): void
	{
		if (this.menu)
		{
			this.menu.destroy();
			this.menu = null;
		}

		this.menu = new Menu({
			id: 'im-notifications-header-menu',
			items: this.getHeaderMenuItems(isReadAllAvailable),
			closeOnItemClick: true,
			autoHide: true,
		});

		this.menu.show(bindElement);
	}

	getHeaderMenuItems(isReadAllAvailable): MenuItemOptions[]
	{
		return [
			this.getReadAllItem(isReadAllAvailable),
		];
	}

	getReadAllItem(isReadAllAvailable): MenuItemOptions
	{
		return {
			title: Loc.getMessage('IM_NOTIFICATIONS_READ_ALL_BUTTON'),
			design: isReadAllAvailable ? MenuItemDesign.Default : MenuItemDesign.Disabled,
			onClick: () => {
				this.notificationReadService.readAll();
				this.menu.close();
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
