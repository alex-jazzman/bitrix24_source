import {FullStickerData, StickerPackId, StickerPackModelState} from "../../../../../../model/sticker-pack/src/types";

declare type GridStickerState = {
	id: number
	packId: StickerPackId
	packType: string
	uri: string
}

declare type StickerGridProps = {
	isLoaded: boolean,
	packs: Array<StickerPackModelState>,
	recentStickers: Array<FullStickerData>,
	isLoadMode: boolean,
	renderHeaders: boolean,
	renderTopStroke: boolean,
}

declare type StickerGridState = {
	isLoaded: boolean,
	packs: Array<StickerPackModelState>,
	recentStickers: Array<FullStickerData>,
	isLoadMode: boolean,
}

declare type StickersRowProps = {
	stickers: Array<GridStickerState>,
	fakeItemCount: number,
	sectionType: string,
	sectionData: {
		packId?: StickerPackId,
		packType?: string,
	},

	type: string, // for ListView
	key: string, // for ListView
};

declare type StickersRowState = {};

declare type StickerPackHeaderProps = {
	configurable: boolean,
	sectionData: {
		packId?: StickerPackId,
		packType?: string,
	},
	sectionType: string,
	title: string,
	key: string, // for ListView
	type: string, // for ListView
};

declare type StickerPackHeaderState = {

};