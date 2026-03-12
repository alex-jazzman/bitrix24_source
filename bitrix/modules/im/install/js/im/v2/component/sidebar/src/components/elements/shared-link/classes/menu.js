import { Loc } from 'main.core';
import { Outline as OutlineIcons } from 'ui.icon-set.api.core';
import { MenuItemDesign } from 'ui.system.menu';

import { PopupType } from 'im.v2.const';
import { BaseMenu } from 'im.v2.lib.menu';

import { copySharedLink } from '../helpers/helpers';

import type { MenuItemOptions, MenuOptions } from 'ui.system.menu';

export class SharedLinkMenu extends BaseMenu
{
	context: { url: string, code: string };

	static events = {
		onChangeSharedLink: 'onChangeSharedLink',
	};

	constructor()
	{
		super();

		this.id = PopupType.sharedLinkContextMenu;
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
		return [
			this.#getCopyItem(),
			this.#getChangeItem(),
		];
	}

	#getCopyItem(): MenuItemOptions
	{
		return {
			title: Loc.getMessage('IM_SIDEBAR_SHARED_LINK_COPY_MENU'),
			icon: OutlineIcons.COPY,
			onClick: () => {
				void copySharedLink(this.context.url);
			},
		};
	}

	#getChangeItem(): MenuItemOptions
	{
		return {
			title: Loc.getMessage('IM_SIDEBAR_SHARED_LINK_CHANGE_MENU'),
			icon: OutlineIcons.REFRESH,
			design: MenuItemDesign.Alert,
			onClick: () => {
				this.emit(SharedLinkMenu.events.onChangeSharedLink, {
					code: this.context.code,
				});
			},
		};
	}
}
