import {FullStickerData, StickerPackId, StickerPackModelState} from "../../../../../../model/sticker-pack/src/types";
import {DialogId} from "../../../../../../types/common";

declare type StickerSelectorProps = {
	mode: 'currentStickers' | 'pack',
	packId?: StickerPackId, // for mode pack only
	type?: string, // for mode pack only
	close: () => void,
	dialogId: DialogId,
};

declare type StickerSelectorState = {
	isStickersLoaded: boolean,
	packs: Array<StickerPackModelState>,
	recentStickers: Array<FullStickerData>,
	hasMore?: boolean,
};