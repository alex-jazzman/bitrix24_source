import { Loc } from 'main.core';

import { showTwoButtonConfirm } from '../base/base';

export const showStickerPackDeleteConfirm = (): Promise<boolean> => {
	return showTwoButtonConfirm({
		title: Loc.getMessage('IM_LIB_CONFIRM_DELETE_STICKER_PACK_CONFIRM_TITLE'),
		text: Loc.getMessage('IM_LIB_CONFIRM_DELETE_STICKER_PACK_CONFIRM_TEXT'),
		firstButtonCaption: Loc.getMessage('IM_LIB_CONFIRM_DELETE_STICKER_PACK_CONFIRM_CONFIRM'),
	});
};

export const showStickerPackUnlinkConfirm = (): Promise<boolean> => {
	return showTwoButtonConfirm({
		title: Loc.getMessage('IM_LIB_CONFIRM_UNLINK_STICKER_PACK_CONFIRM_TITLE'),
		text: Loc.getMessage('IM_LIB_CONFIRM_UNLINK_STICKER_PACK_CONFIRM_TEXT'),
		firstButtonCaption: Loc.getMessage('IM_LIB_CONFIRM_UNLINK_STICKER_PACK_CONFIRM_CONFIRM'),
	});
};
