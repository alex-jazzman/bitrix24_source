import { Loc } from 'main.core';
import { Outline as OutlineIcons } from 'ui.icon-set.api.core';
import { type MenuItemOptions, type MenuOptions, type MenuSectionOptions } from 'ui.system.menu';

import { PopupType } from 'im.v2.const';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { BaseMenu } from 'im.v2.lib.menu';

const MenuSectionCode = {
	first: 'first',
	second: 'second',
};

export class BaseRecentHeaderMenu extends BaseMenu
{
	context: { unreadMode: boolean };

	static events = {
		onToggleUnreadMode: 'onToggleUnreadMode',
	};

	constructor()
	{
		super();

		this.id = PopupType.recentHeaderMenu;
	}

	getMenuOptions(): MenuOptions
	{
		return {
			...super.getMenuOptions(),
			angle: false,
		};
	}

	getMenuItems(): MenuItemOptions
	{
		const isUnreadRecentModeAvailable = FeatureManager.isFeatureAvailable(Feature.unreadRecentModeAvailable);

		if (!isUnreadRecentModeAvailable)
		{
			return [this.getReadAllItem()];
		}

		const firstGroupItems = [this.getDefaultModeItem(), this.getUnreadModeItem()];

		const secondGroupItems = [this.getReadAllItem()];

		return [
			...this.groupItems(firstGroupItems, MenuSectionCode.first),
			...this.groupItems(secondGroupItems, MenuSectionCode.second),
		];
	}

	getMenuGroups(): MenuSectionOptions[]
	{
		return [
			{ code: MenuSectionCode.first },
			{ code: MenuSectionCode.second },
		];
	}

	getUnreadModeItem(): MenuItemOptions
	{
		const menuItem = {
			title: Loc.getMessage('IM_LIB_MENU_OPEN_UNREAD_MODE'),
			isSelected: this.context.unreadMode,
			onClick: () => this.onSelectUnreadMode(),
		};

		if (!this.context.unreadMode)
		{
			menuItem.counter = {
				value: this.getUnreadCounter(),
			};
		}

		return menuItem;
	}

	getDefaultModeItem(): MenuItemOptions
	{
		return {
			title: Loc.getMessage('IM_LIB_MENU_OPEN_ALL_MODE'),
			isSelected: !this.context.unreadMode,
			onClick: () => {
				if (!this.context.unreadMode)
				{
					return;
				}

				this.emit(BaseRecentHeaderMenu.events.onToggleUnreadMode);
			},
		};
	}

	getReadAllItem(): MenuItemOptions
	{
		return {
			title: Loc.getMessage('IM_LIB_MENU_READ_ALL_CHATS'),
			icon: OutlineIcons.CHATS_WITH_CHECK,
			onClick: () => this.onReadAllClick(),
		};
	}

	onReadAllClick()
	{
		// you should implement this method for child class
	}

	onSelectUnreadMode()
	{
		// you should implement this method for child class
	}

	getUnreadCounter(): number
	{
		return 0;
	}
}
