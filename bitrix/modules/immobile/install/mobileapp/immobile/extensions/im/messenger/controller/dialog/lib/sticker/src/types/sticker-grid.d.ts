import {
	PackWithStickers,
	StickerPackId, StickerPackState,
	StickerPackType,
	StickerState
} from "../../../../../../model/sticker-pack/src/types";
import {BaseMethods} from "../../../../../../../../../../../../../mobile/dev/janative/types/elements/base-view";

declare type GridStickerState = {
	id: number
	packId: StickerPackId
	packType: string
	uri: string
	isUploading: boolean,
	uploadProgress: number,
}

declare type StickerGridProps = {
	isLoaded: boolean,
	packs: Array<PackWithStickers>,
	recentStickers: Array<StickerState>,
	hasNextPage: boolean,
	shouldRenderHeaders: boolean,
	shouldRenderTopStroke: boolean,
	canEditPack: boolean,
	ref: (ref: StickerGrid) => void,
	onLoadNextPage: (pack: StickerPackState) => void,
}

declare type StickerGridState = {
	isLoaded: boolean,
	packs: Array<PackWithStickers>,
	recentStickers: Array<StickerState>,
	hasNextPage: boolean,
	rows: Array<StickersRowProps>
}

declare type StickersRowProps = {
	stickers: Array<GridStickerState>,
	fakeItemCount: number,
	sectionType: string,
	sectionData: {
		packId?: StickerPackId,
		packType?: string,
		authorId?: number
	},
	isFirstPackRow: boolean,
	onStickerClick: (stickerId, pack?: {packId: StickerPackId, packType: StickerPackType}) => void
	onStickerLongClick: () => void;
	onCreateStickersClick: (pack?: { packId: StickerPackId, packType: StickerPackType }) => void

	type: string, // for ListView
	key: string, // for ListView
};

declare type StickersRowState = {};

declare type StickerPackHeaderProps = {
	configurable: boolean,
	canEditPack: boolean,
	sectionData: {
		packId?: StickerPackId,
		packType?: string,
		authorId?: number,
	},
	sectionType: string,
	title: string,
	key: string, // for ListView
	type: string, // for ListView
};

declare type StickerPackHeaderState = {

};

declare type StickerViewProps = {
	id: number | string,
	packId: StickerPackId,
	packType: StickerPackType,
	onClick: (stickerData: StickerViewClickData, ref: object) => void,
	onLongClick: (stickerData: StickerViewClickData, ref: object) => void,
	uri: string,
	ref(ref: object): BaseMethods;
	isUploading: boolean,
};

declare type StickerViewClickData = {
	id: number | string,
	packId: StickerPackId,
	packType: StickerPackType,
}

declare type StickerViewState = {};

declare type UploadStatus = 'progress' | 'complete' | 'error';


declare type UploadingStickerViewProps = {
	id: number | string,
	onClick: (id, ref) => void,
	onUploadCancelClick: (id) => void,
	onRetryUpload: (id) => void,
	onLongClick: (id, ref) => void,
	getUploadProgress: (id) => { uploadStatus, progress}
	uploadStatus: UploadStatus,
	progress: number,
	uri: string,
};

declare type UploadingStickerViewState = {
	uploadStatus: UploadStatus,
	progress: number
};