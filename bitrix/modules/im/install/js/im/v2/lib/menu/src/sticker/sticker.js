import { Loc, Runtime } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Outline as OutlineIcons } from 'ui.icon-set.api.core';
import { MenuItemDesign, type MenuItemOptions, type MenuOptions } from 'ui.system.menu';

import { Core } from 'im.v2.application.core';
import { EventType, PopupType, TextareaPanelType } from 'im.v2.const';
import { Feature, FeatureManager } from 'im.v2.lib.feature';
import { type ImModelSticker, type ImModelStickerPack } from 'im.v2.model';
import { SendingService } from 'im.v2.provider.service.sending';
import { StickerService } from 'im.v2.provider.service.sticker';

import { BaseMenu } from '../base/base';

export class StickerMenu extends BaseMenu
{
	static events = {
		closeParentPopup: 'closeParentPopup',
	};

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

	getMenuItems(): MenuItemOptions[]
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
			title: Loc.getMessage('IM_LIB_MENU_SEND_STICKER'),
			icon: OutlineIcons.SEND,
			onClick: async () => {
				this.emit(StickerMenu.events.closeParentPopup);

				// draft is loaded lazily so the shared menu bundle does not pull it (and ui.dexie) eagerly
				const { DraftManager } = await Runtime.loadExtension('im.v2.lib.draft');
				const draft = DraftManager.getInstance().drafts[this.context.dialogId] ?? {};
				const isReplyWithMediaAvailable = FeatureManager.isFeatureAvailable(Feature.isReplyWithMediaAvailable);
				const replyId = (isReplyWithMediaAvailable && draft.panelType === TextareaPanelType.reply)
					? draft.panelContext?.messageId
					: undefined;

				void SendingService.getInstance().sendMessageWithSticker({
					dialogId: this.context.dialogId,
					stickerParams: {
						id: this.context.sticker.id,
						packId: this.context.sticker.packId,
						packType: this.context.sticker.packType,
					},
					replyId,
				});

				if (replyId > 0)
				{
					EventEmitter.emit(EventType.textarea.closePanel, { dialogId: this.context.dialogId });
				}
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
			title: Loc.getMessage('IM_LIB_MENU_REMOVE_STICKER'),
			design: MenuItemDesign.Alert,
			icon: OutlineIcons.TRASHCAN,
			onClick: () => {
				void StickerService.getInstance().deleteStickerFromPack({
					ids: [this.context.sticker.id],
					packId: this.context.sticker.packId,
					packType: this.context.sticker.packType,
				});
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
			title: Loc.getMessage('IM_LIB_MENU_REMOVE_RECENT_STICKER'),
			icon: OutlineIcons.CIRCLE_MINUS,
			design: MenuItemDesign.Alert,
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
