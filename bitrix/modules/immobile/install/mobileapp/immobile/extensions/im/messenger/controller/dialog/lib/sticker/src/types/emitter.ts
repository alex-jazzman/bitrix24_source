import {StickerPackId, StickerPackType} from "../../../../../../model/sticker-pack/src/types";

declare interface StickersEvents
{
	'grid:scroll-to': [packId: StickerPackId, packType: StickerPackType];
	'grid:scroll-t-smoothly': [packId: StickerPackId, packType: StickerPackType];
	'grid:scroll-to-begin': [];
	'grid:scroll-to-begin-smoothly': [];
	'navigation:set-active-recent': [];
	'navigation:set-active-pack': [packId: StickerPackId, packType: string];
	'action:delete-recent-sticker': [stickerId: number, packId: StickerPackId, packType: StickerPackType];
	'action:send': [stickerId: number, packId: StickerPackId, packType: StickerPackType, uri: string];
	'action:clear-history': [];
	'action:create-pack': [],
	'action:create-stickers': [packId: StickerPackId, packType: StickerPackType]
}

declare class StickerEventEmitter<T extends StickersEvents>
{
	on<K extends keyof T>(event: K, func: (...args: T[K]) => void): void;

	once<K extends keyof T>(event: K, func: (...args: T[K]) => void): void;

	emit<K extends keyof T>(name: K, args: T[K]): void;

	off<K extends keyof T>(name: K, func: (...args: T[K]) => void): void;
}

declare type StickerEventHandler<T extends StickersEvents, K extends keyof T> = (...args: T[K]) => void;