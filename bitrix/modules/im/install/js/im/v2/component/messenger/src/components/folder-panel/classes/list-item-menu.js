import { Loc } from 'main.core';
import { MenuItemDesign, type MenuItemOptions } from 'ui.system.menu';

import { Analytics, AnalyticsSubSection } from 'im.v2.lib.analytics';
import { BaseMenu } from 'im.v2.lib.menu';
import { LayoutManager } from 'im.v2.lib.layout';
import { Layout, FolderType, type FolderTypeItem } from 'im.v2.const';
import { FolderDeletePopup, FolderManager } from 'im.v2.lib.folder';
import { FolderService } from 'im.v2.provider.service.folder';

// Test label of every item of this menu is `{menu id}-{action}` - the same rule the folder panel item
// menu follows, so a label never has to be looked up to be known.
const MENU_ID = 'im-folder-list-item-menu';

export class FolderListItemMenu extends BaseMenu
{
	static events = {
		closeList: 'closeList',
	};

	context: { folderId: number, folderType: FolderTypeItem };

	constructor()
	{
		super();

		this.id = MENU_ID;
	}

	getMenuItems(): MenuItemOptions[] | null[]
	{
		// A safety net for deletion, not a live path: the card of a system folder shows the menu button only
		// for a composite one, and even there the only item edits the composition.
		if (this.#isSystemFolder())
		{
			return [this.getEditAllItem()];
		}

		return [
			this.getUpdateItem(),
			this.getDeleteItem(),
		];
	}

	getEditAllItem(): ?MenuItemOptions
	{
		// Only a composite folder owns a composition to edit; for the remaining system folders the branch
		// above stays empty and deletion remains closed.
		if (!this.#isCompositeFolder())
		{
			return null;
		}

		return {
			title: Loc.getMessage('IM_MESSENGER_FOLDER_PANEL_ITEM_MENU_EDIT_ALL'),
			dataset: { testid: `${MENU_ID}-edit-all` },
			onClick: () => {
				Analytics.getInstance().folder.onClickEdit({
					folderId: this.context.folderId,
					subSection: AnalyticsSubSection.folderList,
				});

				FolderManager.openAllFolderSettings();

				this.emit(FolderListItemMenu.events.closeList);
			},
		};
	}

	getUpdateItem(): MenuItemOptions
	{
		return {
			title: Loc.getMessage('IM_MESSENGER_FOLDER_PANEL_ITEM_MENU_UPDATE'),
			dataset: { testid: `${MENU_ID}-update` },
			onClick: () => {
				Analytics.getInstance().folder.onClickEdit({
					folderId: this.context.folderId,
					subSection: AnalyticsSubSection.folderList,
				});

				void LayoutManager.getInstance().setLayout({
					name: Layout.updateFolder,
					entityId: String(this.context.folderId),
				});

				this.emit(FolderListItemMenu.events.closeList);
			},
		};
	}

	getDeleteItem(): MenuItemOptions
	{
		return {
			title: Loc.getMessage('IM_MESSENGER_FOLDER_PANEL_ITEM_MENU_DELETE'),
			design: MenuItemDesign.Alert,
			dataset: { testid: `${MENU_ID}-delete` },
			onClick: () => {
				Analytics.getInstance().folder.onClickDelete({
					folderId: this.context.folderId,
					subSection: AnalyticsSubSection.folderList,
				});

				const popup = new FolderDeletePopup();
				popup.subscribe(FolderDeletePopup.events.onConfirm, () => {
					void (new FolderService()).delete(this.context.folderId);
				});
				popup.show();
			},
		};
	}

	#isSystemFolder(): boolean
	{
		return this.context.folderType === FolderType.system;
	}

	#isCompositeFolder(): boolean
	{
		return this.store.getters['recent/folders/isComposite'](this.context.folderId);
	}
}
