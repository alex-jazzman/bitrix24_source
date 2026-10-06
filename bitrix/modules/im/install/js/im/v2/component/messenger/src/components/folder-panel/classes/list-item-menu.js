import { Loc } from 'main.core';
import { MenuItemDesign, type MenuItemOptions } from 'ui.system.menu';

import { BaseMenu } from 'im.v2.lib.menu';
import { LayoutManager } from 'im.v2.lib.layout';
import { Layout } from 'im.v2.const';
import { FolderDeletePopup } from 'im.v2.lib.folder';
import { FolderService } from 'im.v2.provider.service.folder';

export class FolderListItemMenu extends BaseMenu
{
	static events = {
		editFolder: 'editFolder',
	};

	context: { folderId: number };

	constructor()
	{
		super();

		this.id = 'im-folder-list-item-menu';
	}

	getMenuItems(): MenuItemOptions[]
	{
		return [
			this.getUpdateItem(),
			this.getDeleteItem(),
		];
	}

	getUpdateItem(): MenuItemOptions
	{
		return {
			title: Loc.getMessage('IM_MESSENGER_FOLDER_PANEL_ITEM_MENU_UPDATE'),
			onClick: () => {
				void LayoutManager.getInstance().setLayout({
					name: Layout.updateFolder,
					entityId: String(this.context.folderId),
				});

				this.emit(FolderListItemMenu.events.editFolder);
			},
		};
	}

	getDeleteItem(): MenuItemOptions
	{
		return {
			title: Loc.getMessage('IM_MESSENGER_FOLDER_PANEL_ITEM_MENU_DELETE'),
			design: MenuItemDesign.Alert,
			onClick: () => {
				const popup = new FolderDeletePopup();
				popup.subscribe(FolderDeletePopup.events.onConfirm, () => {
					void (new FolderService()).delete(this.context.folderId);
				});
				popup.show();
			},
		};
	}
}
