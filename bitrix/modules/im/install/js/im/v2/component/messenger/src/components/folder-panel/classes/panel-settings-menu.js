import { Loc } from 'main.core';
import { type MenuItemOptions, type MenuSectionOptions } from 'ui.system.menu';

import { Analytics } from 'im.v2.lib.analytics';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { BaseMenu } from 'im.v2.lib.menu';
import { FolderManager } from 'im.v2.lib.folder';
import { LayoutManager } from 'im.v2.lib.layout';
import { Layout, SystemFolderCode } from 'im.v2.const';
import { type ImModelFolder } from 'im.v2.model';

const SectionCode = Object.freeze({
	settings: 'settings',
});

// Test label of every item of this menu is `{menu id}-{action}` - the same rule the folder panel item
// menu follows, so a label never has to be looked up to be known.
const MENU_ID = 'im-folder-panel-settings-menu';

export class PanelSettingsMenu extends BaseMenu
{
	static events = {
		openFolderList: 'openFolderList',
	};

	constructor()
	{
		super();

		this.id = MENU_ID;
	}

	getMenuItems(): MenuItemOptions | null[]
	{
		return [
			this.getCreateItem(),
			this.getListItem(),
			this.getEditAllItem(),
			...this.groupItems([this.getSettingsItem()], SectionCode.settings),
		];
	}

	getMenuGroups(): MenuSectionOptions[]
	{
		return [{ code: SectionCode.settings }];
	}

	getCreateItem(): MenuItemOptions
	{
		return {
			title: Loc.getMessage('IM_MESSENGER_FOLDER_PANEL_MENU_CREATE'),
			dataset: { testid: `${MENU_ID}-create` },
			onClick: () => {
				Analytics.getInstance().folder.onClickCreateFolder();

				FolderManager.startCreation();
			},
		};
	}

	getListItem(): MenuItemOptions
	{
		return {
			title: Loc.getMessage('IM_MESSENGER_FOLDER_PANEL_MENU_LIST'),
			dataset: { testid: `${MENU_ID}-list` },
			onClick: () => {
				Analytics.getInstance().folder.onOpenList();

				this.emit(PanelSettingsMenu.events.openFolderList);
			},
		};
	}

	getEditAllItem(): ?MenuItemOptions
	{
		const folder = this.#getCompositeAllFolder();
		if (!folder)
		{
			return null;
		}

		return {
			title: Loc.getMessage('IM_MESSENGER_FOLDER_PANEL_MENU_EDIT_ALL'),
			dataset: { testid: `${MENU_ID}-edit-all` },
			onClick: () => {
				Analytics.getInstance().folder.onClickEdit({ folderId: folder.id });

				FolderManager.openAllFolderSettings();
			},
		};
	}

	getSettingsItem(): ?MenuItemOptions
	{
		if (!FeatureManager.isFeatureAvailable(Feature.isChatShellNavigationWebAvailable))
		{
			return null;
		}

		return {
			title: Loc.getMessage('IM_MESSENGER_FOLDER_PANEL_MENU_SETTINGS'),
			dataset: { testid: `${MENU_ID}-settings` },
			onClick: () => {
				Analytics.getInstance().settings.onOpenFromFolderMenu();

				void LayoutManager.getInstance().setLayout({ name: Layout.settings });
			},
		};
	}

	// The menu stands on no folder, so the "All" folder is found by its code; only a composite one owns
	// a composition to edit, the same condition the card menu of that folder follows.
	#getCompositeAllFolder(): ?ImModelFolder
	{
		const folder: ?ImModelFolder = this.store.getters['recent/folders/getByCode'](SystemFolderCode.all);
		if (!folder || !this.store.getters['recent/folders/isComposite'](folder.id))
		{
			return null;
		}

		return folder;
	}
}
