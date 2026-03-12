import {
	PackWithStickers,
	StickerPackId,
	StickerPackState, StickerPackType, StickerState
} from "../../../../../../model/sticker-pack/src/types";

declare type StickerNavigationBarProps = {
	isLoaded: boolean,
	packs: Array<PackWithStickers>,
	recentStickers: Array<StickerState>,
	hasNextPage: boolean,
	canCreatePack: boolean,
	ref: (ref: StickerNavigationBar) => void,
	onLoadNextPage: (pack: StickerPackState) => void,
}

declare type StickerNavigationBarState = {
	rows: Array<object>,
	packs: Array<PackWithStickers>,
	hasNextPage: boolean,
}

declare type StickerPackNavigationButtonProps = {
	uri: string;
	packId: StickerPackId,
	packType: StickerPackType,
	isActive: boolean,
	onClick: (packId: StickerPackId, packType: StickerPackType) => void,
}

declare type StickerPackNavigationButtonState = {
	isActive: boolean,
	isVisible: boolean,
}

declare type RecentStickersNavigationButtonProps = {
	onClick: () => void;
	isActive: boolean,
}

declare type RecentStickersNavigationButtonState = {
	isActive: boolean,
}