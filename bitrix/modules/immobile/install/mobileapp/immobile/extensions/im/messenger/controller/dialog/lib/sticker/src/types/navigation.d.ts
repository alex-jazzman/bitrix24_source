import {FullStickerData, StickerPackId, StickerPackModelState} from "../../../../../../model/sticker-pack/src/types";

declare type StickerNavigationBarProps = {
	isLoaded: boolean,
	packs: Array<StickerPackModelState>,
	recentStickers: Array<FullStickerData>,
	isLoadMode: boolean,
}

declare type StickerNavigationBarState = {}

declare type StickerPackNavigationButtonProps = {
	uri: string;
	packId: StickerPackId,
	packType: string,
	isActive: boolean,
}

declare type StickerPackNavigationButtonState = {
	isActive: boolean,
}

declare type RecentStickersNavigationButtonProps = {
	isActive: boolean,
}

declare type RecentStickersNavigationButtonState = {
	isActive: boolean,
}