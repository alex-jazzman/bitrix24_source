import {RecentStickerState, StickerPackState, StickerState} from "../../../../../../model/sticker-pack/src/types";

export type UploadingStickerData = {
	stickerId: string,
	status: 'progress' | 'complete' | 'error',
	serverFileId: string | null,
	localUrl: string,
	progress: number,
}

declare type StickerPackLoadResult = {
	packs: Array<StickerPackState>,
	stickers: Array<StickerState>,
	recentStickers: Array<RecentStickerState>,
	hasNextPage: boolean
};

declare type StickerPackTailResult = {
	packs: Array<StickerPackState>,
	stickers: Array<StickerState>,
	hasNextPage: boolean
};

declare type StickerPackGetResult = {
	pack: StickerPackState,
	stickers: Array<StickerState>,
};