import { Loc } from 'main.core';
import { Outline as OutlineIcons } from 'ui.icon-set.api.core';
import { MenuItemDesign } from 'ui.system.menu';

import { Core } from 'im.v2.application.core';
import { SendingService } from 'im.v2.provider.service.sending';
import { StickerService } from 'im.v2.provider.service.sticker';
import { BaseMenu } from 'im.v2.lib.menu';
import { PopupType } from 'im.v2.const';

import type { MenuItemOptions, MenuOptions } from 'ui.system.menu';
import type { ImModelSticker, ImModelStickerPack } from 'im.v2.model';

export class StickerMenu extends BaseMenu
{
	context: { sticker: ImModelSticker, isRecent: boolean, dialogId: string };

	constructor()
	{
		super();

		this.id = PopupType.stickerContextMenu;
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
			this.getSendItem(),
			this.getRemoveFromRecentItem(),
			this.getDeleteFromPackItem(),
		];
	}

	getSendItem(): MenuItemOptions
	{
		return {
			title: Loc.getMessage('IM_TEXTAREA_STICKER_CONTEXT_MENU_SEND_STICKER'),
			icon: OutlineIcons.SEND,
			onClick: () => {
				void SendingService.getInstance().sendMessageWithSticker({
					dialogId: this.context.dialogId,
					stickerParams: {
						id: this.context.sticker.id,
						packId: this.context.sticker.packId,
						packType: this.context.sticker.packType,
					},
				});
				this.menuInstance.close();
			},
		};
	}

	getDeleteFromPackItem(): MenuItemOptions | null
	{
		if (this.context.isRecent)
		{
			return null;
		}

		const isPacksOwner = this.#isPackOwner();
		if (!isPacksOwner)
		{
			return null;
		}

		return {
			title: Loc.getMessage('IM_TEXTAREA_STICKER_CONTEXT_MENU_REMOVE_STICKER'),
			design: MenuItemDesign.Alert,
			icon: OutlineIcons.TRASHCAN,
			onClick: () => {
				void StickerService.getInstance().deleteStickerFromPack({
					ids: [this.context.sticker.id],
					packId: this.context.sticker.packId,
					packType: this.context.sticker.packType,
				});
				this.menuInstance.close();
			},
		};
	}

	getRemoveFromRecentItem(): MenuItemOptions | null
	{
		if (!this.context.isRecent)
		{
			return null;
		}

		return {
			title: Loc.getMessage('IM_TEXTAREA_STICKER_CONTEXT_MENU_REMOVE_RECENT'),
			icon: OutlineIcons.CIRCLE_MINUS,
			onClick: () => {
				void StickerService.getInstance().removeFromRecent({
					id: this.context.sticker.id,
					packId: this.context.sticker.packId,
					packType: this.context.sticker.packType,
				});
			},
		};
	}

	#isPackOwner(): boolean
	{
		const pack: ImModelStickerPack = Core.getStore().getters['stickers/packs/getByIdentifier']({
			id: this.context.sticker.packId,
			type: this.context.sticker.packType,
		});

		if (!pack)
		{
			return false;
		}

		return pack.authorId === Core.getUserId();
	}
}
