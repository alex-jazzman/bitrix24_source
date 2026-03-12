import {DialogId} from "../../../../../../types/common";
import {
	PackWithStickers,
	StickerPackId,
	StickerPackType
} from "../../../../../../model/sticker-pack/src/types";

declare type StickerPackViewerProps = {
	dialogId: DialogId,
	packId: StickerPackId,
	packType: StickerPackType,
	close: () => void,
	canEditPack: boolean,
};

declare type StickerPackViewerState = {
	pack: null | PackWithStickers,
	isPackLoaded: boolean,
	packAdded: boolean,
};