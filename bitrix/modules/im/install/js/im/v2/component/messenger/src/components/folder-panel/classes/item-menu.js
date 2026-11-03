import { Loc } from 'main.core';
import { Outline as OutlineIcons } from 'ui.icon-set.api.core';
import { MenuItemDesign, type MenuItemOptions, type MenuSectionOptions } from 'ui.system.menu';

import { Analytics, AnalyticsSection, AnalyticsSubSection } from 'im.v2.lib.analytics';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { BaseMenu, ReadAllOperation } from 'im.v2.lib.menu';
import { FolderDeletePopup, FolderManager } from 'im.v2.lib.folder';
import { LayoutManager } from 'im.v2.lib.layout';
import {
	Layout,
	FolderType,
	RecentType,
	SystemFolderCode,
	type FolderTypeItem,
	type RecentTypeItem,
} from 'im.v2.const';
import { type ImModelFolder } from 'im.v2.model';
import { FolderService } from 'im.v2.provider.service.folder';

const SectionCode = Object.freeze({
	manage: 'manage',
	navigate: 'navigate',
});

// Test label of every item of this menu is `{menu id}-{action}` - the same rule the folder list item
// menu follows, so a label never has to be looked up to be known.
const MENU_ID = 'im-folder-panel-item-menu';

export class PanelItemMenu extends BaseMenu
{
	static events = {
		openFolderList: 'openFolderList',
	};

	context: { folderId: number, folderType: FolderTypeItem, folder: ImModelFolder };

	constructor()
	{
		super();

		this.id = MENU_ID;
	}

	getMenuItems(): MenuItemOptions[] | null[]
	{
		if (this.#isSystemFolder())
		{
			return [this.getEditAllItem(), this.getReadAllItem(), this.getListItem()];
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

	getEditAllItem(): ?MenuItemOptions
	{
		// Only a composite folder owns a composition to edit; the remaining system folders are filled
		// by the server and keep the navigation item alone.
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
					subSection: AnalyticsSubSection.folderContextMenu,
				});

				FolderManager.openAllFolderSettings();
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
					subSection: AnalyticsSubSection.folderContextMenu,
				});

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
			dataset: { testid: `${MENU_ID}-delete` },
			onClick: () => {
				Analytics.getInstance().folder.onClickDelete({
					folderId: this.context.folderId,
					subSection: AnalyticsSubSection.folderContextMenu,
				});

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
			dataset: { testid: `${MENU_ID}-list` },
			onClick: () => {
				Analytics.getInstance().folder.onOpenList(AnalyticsSubSection.folderContextMenu);

				this.emit(PanelItemMenu.events.openFolderList);
			},
		};
	}

	getReadAllItem(): MenuItemOptions | null
	{
		if (!this.#hasReadAllOperation())
		{
			return null;
		}

		return {
			title: Loc.getMessage('IM_LIB_MENU_READ_ALL_CHATS'),
			icon: OutlineIcons.CHATS_WITH_CHECK,
			dataset: { testid: `${MENU_ID}-read-all` },
			onClick: () => this.#onReadAllClick(),
		};
	}

	#hasReadAllOperation(): boolean
	{
		if (!FeatureManager.isFeatureAvailable(Feature.isChatShellNavigationWebAvailable))
		{
			return false;
		}

		return ReadAllOperation.isSupported(this.#getReadAllSection());
	}

	#onReadAllClick(): void
	{
		ReadAllOperation.run(this.#getReadAllSection(), AnalyticsSection.folderMenu);
	}

	// The composite folder unites several sections and owns none, so it is decided by its code before
	// the section is asked for at all: it spans the whole messenger and is read the way the recent
	// list is.
	#getReadAllSection(): ?RecentTypeItem
	{
		return this.#isAllFolder() ? RecentType.default : this.#getRecentSection();
	}

	#isAllFolder(): boolean
	{
		return this.context.folder?.code === SystemFolderCode.all;
	}

	#getRecentSection(): ?RecentTypeItem
	{
		return this.context.folder?.definition?.recentSection;
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
