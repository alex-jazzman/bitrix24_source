import { Loc } from 'main.core';
import { Outline as OutlineIcons } from 'ui.icon-set.api.core';
import { MenuItemDesign } from 'ui.system.menu';

import { Notifier } from 'im.v2.lib.notifier';
import { Core } from 'im.v2.application.core';
import { PermissionManager } from 'im.v2.lib.permission';
import { ActionByUserType, PopupType, StickerPackType } from 'im.v2.const';
import { StickerService } from 'im.v2.provider.service.sticker';
import { showStickerPackDeleteConfirm, showStickerPackUnlinkConfirm } from 'im.v2.lib.confirm';

import { BaseMenu } from '../base/base';

import type { MenuItemOptions, MenuOptions, MenuSectionOptions } from 'ui.system.menu';
import type { ImModelStickerPack } from 'im.v2.model';

const MenuSectionCode = {
	first: 'first',
	second: 'second',
};

export class StickerPackMenu extends BaseMenu
{
	static events = {
		showPackForm: 'showPackForm',
		closeParentPopup: 'closeParentPopup',
	};

	context: { pack: ImModelStickerPack, isRecent: boolean, dialogId: string };

	constructor()
	{
		super();

		this.id = PopupType.stickerPackContextMenu;
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
		if (this.context.isRecent)
		{
			return [
				this.getClearRecentItem(),
			];
		}

		return [
			...this.groupItems([this.getEditPackItem()], MenuSectionCode.first),
			...this.groupItems([
				this.getUnlinkPackItem(),
				this.getDeletePackItem(),
			], MenuSectionCode.second),
		];
	}

	getMenuGroups(): MenuSectionOptions[]
	{
		return this.getMenuItems().map((menuItem: MenuItemOptions) => {
			return { code: menuItem.sectionCode };
		});
	}

	getEditPackItem(): MenuItemOptions | null
	{
		if (!PermissionManager.getInstance().canPerformActionByUserType(ActionByUserType.changeStickerPack))
		{
			return null;
		}

		if (!this.#isPackOwner())
		{
			return null;
		}

		return {
			title: Loc.getMessage('IM_LIB_MENU_EDIT_STICKER_PACK'),
			icon: OutlineIcons.EDIT_M,
			onClick: () => {
				this.emit(StickerPackMenu.events.showPackForm);
			},
		};
	}

	getDeletePackItem(): MenuItemOptions | null
	{
		if (!this.#canDeletePack())
		{
			return null;
		}

		return {
			title: Loc.getMessage('IM_LIB_MENU_REMOVE_STICKER_PACK'),
			design: MenuItemDesign.Alert,
			icon: OutlineIcons.TRASHCAN,
			onClick: async () => {
				const confirmResult = await showStickerPackDeleteConfirm();
				if (!confirmResult)
				{
					return;
				}
				this.emit(StickerPackMenu.events.closeParentPopup);
				await StickerService.getInstance().deletePack({
					id: this.context.pack.id,
					type: this.context.pack.type,
				});
				Notifier.sticker.onRemovePackComplete();
			},
		};
	}

	getUnlinkPackItem(): MenuItemOptions | null
	{
		if (!this.#canUnlinkPack())
		{
			return null;
		}

		return {
			title: Loc.getMessage('IM_LIB_MENU_UNLINK_STICKER_PACK'),
			design: MenuItemDesign.Alert,
			icon: OutlineIcons.TRASHCAN,
			onClick: async () => {
				const confirmResult = await showStickerPackUnlinkConfirm();
				if (!confirmResult)
				{
					return;
				}
				this.emit(StickerPackMenu.events.closeParentPopup);
				await StickerService.getInstance().unlinkPack({
					id: this.context.pack.id,
					type: this.context.pack.type,
				});
				Notifier.sticker.onRemovePackComplete();
			},
		};
	}

	getClearRecentItem(): MenuItemOptions
	{
		return {
			title: Loc.getMessage('IM_LIB_MENU_CLEAR_RECENT_STICKERS'),
			icon: OutlineIcons.BROOM,
			onClick: () => {
				void StickerService.getInstance().clearRecent();
			},
		};
	}

	#isPackOwner(): boolean
	{
		return this.context.pack.authorId === Core.getUserId();
	}

	#isVendorStickerPack(): boolean
	{
		return this.context.packType === StickerPackType.vendor;
	}

	#canUnlinkPack(): boolean
	{
		if (this.#isVendorStickerPack())
		{
			return false;
		}

		if (!this.context.pack.isAdded)
		{
			return false;
		}

		return !this.#isPackOwner();
	}

	#canDeletePack(): boolean
	{
		if (this.#isVendorStickerPack())
		{
			return false;
		}

		return this.#isPackOwner();
	}
}
