import { Loc } from 'main.core';
import { type MenuItemOptions } from 'ui.system.menu';

import { BaseMenu } from 'im.v2.lib.menu';
import { FolderManager } from 'im.v2.lib.folder';

export class PanelSettingsMenu extends BaseMenu
{
	static events = {
		openFolderList: 'openFolderList',
	};

	constructor()
	{
		super();

		this.id = 'im-folder-panel-settings-menu';
	}

	getMenuItems(): MenuItemOptions | null[]
	{
		return [
			this.getCreateItem(),
			this.getListItem(),
		];
	}

	getCreateItem(): MenuItemOptions
	{
		return {
			title: Loc.getMessage('IM_MESSENGER_FOLDER_PANEL_MENU_CREATE'),
			onClick: () => {
				FolderManager.startCreation();
			},
		};
	}

	getListItem(): MenuItemOptions
	{
		return {
			title: Loc.getMessage('IM_MESSENGER_FOLDER_PANEL_MENU_LIST'),
			onClick: () => {
				this.emit(PanelSettingsMenu.events.openFolderList);
			},
		};
	}
}
