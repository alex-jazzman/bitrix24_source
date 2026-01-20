import {DialogId} from "../../../../../../types/common";
import {StickerPackId, StickerPackModelState} from "../../../../../../model/sticker-pack/src/types";

declare type StickerPackViewerProps = {
	dialogId: DialogId,
	packId: StickerPackId,
	packType: string,
	close: () => void,
};

declare type StickerPackViewerState = {
	pack: null | StickerPackModelState,
	isPackLoaded: boolean,
	packAdded: boolean,
};