import {MessengerModel, PayloadData} from '../../base';

declare type StickerPackId = number | string;
declare type StickerPackType = 'vendor' | 'custom';
declare type StickerType = 'image';
export type StickerPackMessengerModel = MessengerModel<StickerPackModelCollection>;

export type StickerPackModelCollection = {
	collection: Map<string, StickerPackModelState>;
	recentCollection: Array<FullStickerData>;
	currentPacks: Set<string>;
}

export type StickerPackModelState = {
	id: StickerPackId,
	type: StickerPackType,
	name: string,
	stickers: Array<StickerState>,
};

export type StickerState = {
	id: number,
	type: StickerType,
	uri: string | null,
	height: number,
	width: number,
};

export type FullStickerData = {
	id: number,
	packId: StickerPackId,
	packType: StickerPackType,
	type: StickerType,
	uri: string | null
	height: number,
	width: number,
}

export type StickerPackActions =
	'stickerPackModel/setState'
	| 'stickerPackModel/setPack'
	| 'stickerPackModel/addRecentSticker'
	| 'stickerPackModel/deleteRecentSticker'
	| 'stickerPackModel/deleteAllRecentStickers'
;

export type StickerPackActionParams = {
	'stickerPackModel/setState': { packs: Array<StickerPackModelState>, recentStickers: Array<FullStickerData> };
	'stickerPackModel/setPack': StickerPackModelState;
	'stickerPackModel/addRecentSticker': FullStickerData;
	'stickerPackModel/deleteRecentSticker': { stickerId: number, packId: StickerPackId, packType: StickerPackType};
	'stickerPackModel/deleteAllRecentStickers': void;
};

export type StickerPackMutation =
	'stickerPackModel/setState'
	| 'stickerPackModel/setPack'
	| 'stickerPackModel/addRecentSticker'
	| 'stickerPackModel/deleteRecentSticker'
	| 'stickerPackModel/deleteAllRecentStickers'
;

export type StickerPackSetStateActions = 'setState';
export interface StickerPackSetStateData extends PayloadData
{
	packs?: Array<StickerPackModelState>;
	recentStickers?: Array<FullStickerData>;
}

export type StickerPackSetPackActions = 'setPack';
export interface StickerPackSetPackData extends PayloadData
{
	pack: StickerPackModelState;
}


export type StickerPackAddRecentStickerActions = 'addRecentSticker';
export interface StickerPackAddRecentStickerData extends PayloadData
{
	recentSticker: FullStickerData;
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