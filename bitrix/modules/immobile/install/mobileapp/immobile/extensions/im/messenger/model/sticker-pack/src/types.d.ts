import {MessengerModel, PayloadData} from '../../base';

declare type StickerPackId = number | string;
declare type StickerPackType = 'vendor' | 'custom';
declare type StickerType = 'image';
export type StickerPackMessengerModel = MessengerModel<StickerPackModelCollection>;

export type StickerPackModelCollection = {
	stickerCollection: Map<string, StickerState>,
	// @ts-ignore
	packCollection: Map<string, StickerPackState>,
	recentCollection: Array<RecentStickerState>,
	currentPacks: Set<string>,
	hasNextPage: boolean,
	isCurrentStickersLoaded: boolean,
	shouldClearState: boolean,
}

export type StickerPackState = {
	id: StickerPackId,
	type: StickerPackType,
	name: string,
	authorId: number | null,
	isAdded: boolean,
};

export type RecentStickerState = {
	id: number,
	packId: StickerPackId,
	packType: StickerPackType,
};

export type StickerState = {
	id: number,
	packId: StickerPackId,
	packType: StickerPackType,
	type: StickerType,
	uri: string | null
	height: number,
	width: number,
	sort: number,
}

export type PackWithStickers = {
	pack: StickerPackState,
	stickers: Array<StickerState>
};

export type StickerPackActions =
	'stickerPackModel/clearCurrentState'
	| 'stickerPackModel/markForClear'
	| 'stickerPackModel/setState'
	| 'stickerPackModel/setPage'
	| 'stickerPackModel/setPack'
	| 'stickerPackModel/createPack'
	| 'stickerPackModel/linkPack'
	| 'stickerPackModel/deletePack'
	| 'stickerPackModel/unlinkPack'
	| 'stickerPackModel/addStickers'
	| 'stickerPackModel/renamePack'
	| 'stickerPackModel/deleteStickers'
	| 'stickerPackModel/addRecentSticker'
	| 'stickerPackModel/deleteRecentSticker'
	| 'stickerPackModel/deleteAllRecentStickers'
;

export type StickerPackActionParams = {
	'stickerPackModel/setState': { packs: Array<StickerPackState>, recentStickers: Array<RecentStickerState>, stickers: Array<StickerState>, hasNextPage: boolean };
	'stickerPackModel/setPack': { pack: StickerPackState, stickers: Array<StickerState> };
	'stickerPackModel/addRecentSticker': StickerState;
	'stickerPackModel/deleteRecentSticker': { stickerId: number, packId: StickerPackId, packType: StickerPackType};
	'stickerPackModel/deleteAllRecentStickers': void;
	'stickerPackModel/createPack': { pack: StickerPackState, stickers: Array<StickerState> };
	'stickerPackModel/createStickers': { stickers: Array<StickerState> };
	'stickerPackModel/deletePack': { packId: StickerPackId, packType: StickerPackType };
};

export type StickerPackMutation =
	'stickerPackModel/setState'
	| 'stickerPackModel/clearCurrentState'
	| 'stickerPackModel/markForClear'
	| 'stickerPackModel/setPack'
	| 'stickerPackModel/createPack'
	| 'stickerPackModel/deletePack'
	| 'stickerPackModel/addRecentSticker'
	| 'stickerPackModel/deleteRecentSticker'
	| 'stickerPackModel/deleteAllRecentStickers'
	| 'stickerPackModel/deleteStickers'
	| 'stickerPackModel/addStickers'
;

export type StickerPackSetStateActions = 'setState';
export interface StickerPackSetStateData extends PayloadData
{
	packs?: Array<StickerPackState>;
	recentStickers?: Array<RecentStickerState>;
	stickers: Array<StickerState>;
	hasNextPage: boolean;
}

export type StickerPackSetPackActions = 'setPack' | 'createPack';
export interface StickerPackSetPackData extends PayloadData
{
	pack: StickerPackState;
	stickers: Array<StickerState>;
}

export type StickerPackAddRecentStickerActions = 'addRecentSticker';
export interface StickerPackAddRecentStickerData extends PayloadData
{
	recentSticker: RecentStickerState;
}

export type StickerPackDeleteRecentStickerActions = 'deleteRecentSticker';
export interface StickerPackDeleteRecentStickerData extends PayloadData
{
	id: number;
	packId: StickerPackId;
	packType: StickerPackType
}

export type StickerPackDeleteAllRecentStickersActions = 'deleteAllRecentStickers';
export interface StickerPackDeleteAllRecentStickersData extends PayloadData
{}

export type StickerPackAddUploadingStickersActions = 'createStickers';
export interface StickerPackAddUploadingStickersData extends PayloadData
{
	packId: StickerPackId,
	packType: StickerPackType,
	uploadingStickers: Array<StickerState>,
}

export type StickerPackAddStickersActions = 'addStickers';
export interface StickerPackAddStickersData extends PayloadData
{
	stickers: Array<StickerState>,
}