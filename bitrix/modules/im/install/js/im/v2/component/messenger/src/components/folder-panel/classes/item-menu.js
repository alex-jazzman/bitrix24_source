import { Loc } from 'main.core';
import { MenuItemDesign, type MenuItemOptions, type MenuSectionOptions } from 'ui.system.menu';

import { BaseMenu } from 'im.v2.lib.menu';
import { FolderDeletePopup } from 'im.v2.lib.folder';
import { LayoutManager } from 'im.v2.lib.layout';
import { Layout, FolderType, type FolderTypeItem } from 'im.v2.const';
import { FolderService } from 'im.v2.provider.service.folder';

const SectionCode = Object.freeze({
	manage: 'manage',
	navigate: 'navigate',
});

export class PanelItemMenu extends BaseMenu
{
	static events = {
		openFolderList: 'openFolderList',
	};

	context: { folderId: number, folderType: FolderTypeItem };

	constructor()
	{
		super();

		this.id = 'im-folder-panel-item-menu';
	}

	getMenuItems(): MenuItemOptions[] | null[]
	{
		if (this.#isSystemFolder())
		{
			return [
				this.getListItem(),
			];
		}

		return [
			...this.groupItems([this.getUpdateItem(), this.getDeleteItem()], SectionCode.manage),
			...this.groupItems([this.getListItem()], SectionCode.navigate),
		];
	}

	getMenuGroups(): MenuSectionOptions[]
	{
		if (this.#isSystemFolder())
		{
			return [];
		}

		return [
			{ code: SectionCode.manage },
			{ code: SectionCode.navigate },
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

	getListItem(): MenuItemOptions
	{
		return {
			title: Loc.getMessage('IM_MESSENGER_FOLDER_PANEL_MENU_LIST'),
			onClick: () => {
				this.emit(PanelItemMenu.events.openFolderList);
			},
		};
	}

	#isSystemFolder(): boolean
	{
		return this.context.folderType === FolderType.system;
	}
}
