import {FullStickerData, StickerPackId, StickerPackModelState} from "../../../../../../model/sticker-pack/src/types";
import {DialogId} from "../../../../../../types/common";

declare type StickerSelectorProps = {
	close: () => void,
	onCreate: (creationParams) => void;
	dialogId: DialogId,
	canEditPack: boolean,
	canCreatePack: boolean,
};

declare type StickerSelectorState = {
	isStickersLoaded: boolean,
	packs: Array<StickerPackModelState>,
	recentStickers: Array<FullStickerData>,
	hasNextPage: boolean,
};