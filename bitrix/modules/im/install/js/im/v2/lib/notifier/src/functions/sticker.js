import { Loc } from 'main.core';

import { ErrorCode } from 'im.v2.const';

import { showNotification } from '../utils/notification';

import type { RunActionError } from 'im.v2.lib.rest';

export const StickerNotifier = {
	handleLimits(error: RunActionError)
	{
		if (error.code === ErrorCode.sticker.maxStickers)
		{
			this.onAddStickerError();
		}
		else if (error.code === ErrorCode.sticker.maxPacks)
		{
			this.onAddPackError();
		}
	},

	onLinkPackComplete(): void
	{
		showNotification(Loc.getMessage('IM_NOTIFIER_MESSAGE_STICKER_PACK_LINK_COMPLETE'));
	},

	onLinkPackError(): void
	{
		showNotification(Loc.getMessage('IM_NOTIFIER_MESSAGE_STICKER_PACK_LINK_ERROR'));
	},

	onAddStickerError(): void
	{
		showNotification(Loc.getMessage('IM_NOTIFIER_MESSAGE_STICKERS_LIMIT_ERROR'));
	},

	onAddPackError(): void
	{
		showNotification(Loc.getMessage('IM_NOTIFIER_MESSAGE_STICKER_PACK_LIMIT_ERROR'));
	},

	onCreatePackComplete(): void
	{
		showNotification(Loc.getMessage('IM_NOTIFIER_MESSAGE_STICKER_PACK_CREATE_COMPLETE'));
	},

	onUpdatePackComplete(): void
	{
		showNotification(Loc.getMessage('IM_NOTIFIER_MESSAGE_STICKER_PACK_UPDATE_COMPLETE'));
	},

	onRemovePackComplete(): void
	{
		showNotification(Loc.getMessage('IM_NOTIFIER_MESSAGE_STICKER_PACK_REMOVE_COMPLETE'));
	},
};
